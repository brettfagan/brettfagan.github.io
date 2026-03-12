import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { normPlaid } from '../lib/parse';
import { CARDS } from '../lib/constants';
import { Button } from '@/components/ui/button';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

// localStorage cursor helpers
const cursorKey = id => `plaid_cursor_${id}`;
const getCursor = id => localStorage.getItem(cursorKey(id)) || undefined;
const setCursor = (id, c) => localStorage.setItem(cursorKey(id), c);
const clearCursor = id => localStorage.removeItem(cursorKey(id));

async function callPlaidFetch(body) {
  let { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not signed in — please sign in again');

  // If the access token is expired or expiring within 60 s, refresh it.
  // getSession() returns a cached token that can be stale after the tab is idle.
  try {
    const { exp } = JSON.parse(atob(session.access_token.split('.')[1]));
    if (exp * 1000 < Date.now() + 60_000) {
      const { data } = await supabase.auth.refreshSession();
      if (!data.session) throw new Error('Session expired — please sign out and sign in again');
      session = data.session;
    }
  } catch (e) {
    if (e.message?.startsWith('Session expired')) throw e;
    // unparseable token — proceed and let the server reject it
  }

  const res = await fetch(`${SUPABASE_URL}/functions/v1/plaid-fetch`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok || json.error) throw new Error(json.error || `HTTP ${res.status}`);
  return json;
}

export default function PlaidConnectionsSection({ onLoad, onClear, onSync }) {
  const { user } = useAuth();
  const [connections, setConnections] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newForm, setNewForm] = useState({
    access_token: '',
    card_name: '',
    save: true,
  });
  const [fetching, setFetching] = useState({});   // { [id | 'new' | 'sync_id']: bool }
  const [fetchErr, setFetchErr] = useState({});    // { [id | 'new']: string }
  const [loadedKeys, setLoadedKeys] = useState(new Set()); // connection ids loaded this session
  const [editingToken, setEditingToken] = useState({}); // { [id]: string } — token being typed
  const [updatingToken, setUpdatingToken] = useState({}); // { [id]: bool }
  const connectionIdsRef = useRef(new Set()); // kept in sync for race-condition guard in syncConnection

  useEffect(() => {
    if (user) loadConnections();
  }, [user]);

  async function loadConnections() {
    const { data } = await supabase
      .from('plaid_connections')
      .select('id, card_name, created_at, account_type')
      .order('created_at', { ascending: false });
    if (data) {
      setConnections(data);
      connectionIdsRef.current = new Set(data.map(c => c.id));
    }
    return data || [];
  }

  async function fetchSaved(conn) {
    setFetching(f => ({ ...f, [conn.id]: true }));
    setFetchErr(e => ({ ...e, [conn.id]: '' }));
    try {
      clearCursor(conn.id); // full fetch always starts fresh
      const { transactions, next_cursor } = await callPlaidFetch({
        connection_id: conn.id,
      });
      onLoad(conn.card_name, transactions.map(normPlaid));
      setCursor(conn.id, next_cursor);
      setLoadedKeys(s => new Set([...s, conn.id]));
    } catch (e) {
      setFetchErr(f => ({ ...f, [conn.id]: e.message }));
    } finally {
      setFetching(f => ({ ...f, [conn.id]: false }));
    }
  }

  async function syncConnection(conn) {
    setFetching(f => ({ ...f, [`sync_${conn.id}`]: true }));
    setFetchErr(e => ({ ...e, [conn.id]: '' }));
    try {
      const storedCursor = getCursor(conn.id);
      const { added, modified, removed, next_cursor } = await callPlaidFetch({
        connection_id: conn.id,
        cursor: storedCursor,
      });
      // Guard: if the connection was removed while the fetch was in flight, discard results
      if (connectionIdsRef.current.has(conn.id)) {
        onSync(conn.card_name, added.map(normPlaid), modified.map(normPlaid), removed);
        setCursor(conn.id, next_cursor);
        setLoadedKeys(s => new Set([...s, conn.id]));
      }
    } catch (e) {
      setFetchErr(f => ({ ...f, [conn.id]: e.message }));
    } finally {
      setFetching(f => ({ ...f, [`sync_${conn.id}`]: false }));
    }
  }

  async function addConnection() {
    if (!newForm.access_token || !newForm.card_name) return;
    setFetching(f => ({ ...f, new: true }));
    setFetchErr(e => ({ ...e, new: '' }));
    try {
      const { transactions, next_cursor, connection_id } = await callPlaidFetch({
        access_token: newForm.access_token,
        card_name: newForm.card_name,
        save: newForm.save,
      });
      onLoad(newForm.card_name, transactions.map(normPlaid));
      setShowAdd(false);
      setNewForm({ access_token: '', card_name: '', save: true });
      if (newForm.save && connection_id) {
        setCursor(connection_id, next_cursor);
        await loadConnections();
        setLoadedKeys(s => new Set([...s, connection_id]));
      }
    } catch (e) {
      setFetchErr(f => ({ ...f, new: e.message }));
    } finally {
      setFetching(f => ({ ...f, new: false }));
    }
  }

  async function removeConnection(conn) {
    await supabase.from('plaid_connections').delete().eq('id', conn.id).eq('user_id', user.id);
    clearCursor(conn.id);
    connectionIdsRef.current.delete(conn.id);
    onClear(conn.card_name);
    setLoadedKeys(s => { const n = new Set(s); n.delete(conn.id); return n; });
    setConnections(cs => cs.filter(c => c.id !== conn.id));
  }

  async function updateToken(conn) {
    const newToken = editingToken[conn.id];
    if (!newToken) return;
    setUpdatingToken(u => ({ ...u, [conn.id]: true }));
    try {
      await callPlaidFetch({ action: 'rotate_token', connection_id: conn.id, access_token: newToken });
      clearCursor(conn.id);
      onClear(conn.card_name);
      setLoadedKeys(s => { const n = new Set(s); n.delete(conn.id); return n; });
      setEditingToken(e => { const n = { ...e }; delete n[conn.id]; return n; });
    } catch (e) {
      setFetchErr(err => ({ ...err, [conn.id]: e.message }));
    } finally {
      setUpdatingToken(u => ({ ...u, [conn.id]: false }));
    }
  }

  const cardNameSuggestions = [
    ...new Set([
      ...CARDS.map(c => c.label),
      ...connections.map(c => c.card_name),
    ])
  ];

  if (!user) return null;

  const inputCls = "w-full bg-background border border-border rounded text-xs py-1.5 px-2 outline-none text-foreground placeholder:text-muted-foreground focus:border-primary transition-colors";
  const iconBtnCls = "bg-transparent border-0 cursor-pointer text-muted-foreground text-[13px] p-0.5 leading-none hover:text-foreground transition-colors";

  return (
    <div className="mb-4">
      {/* ── Section header ─────────────────────────────────────────────────── */}
      <div className="flex justify-between items-center mb-2">
        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.06em]">
          Plaid API
        </span>
        <Button
          variant={showAdd ? 'outline' : 'default'}
          size="sm"
          className="text-[11px] font-bold h-auto py-0.5 px-2"
          onClick={() => setShowAdd(s => !s)}
        >
          {showAdd ? 'Cancel' : '+ Add'}
        </Button>
      </div>

      {/* ── Add connection form ─────────────────────────────────────────────── */}
      {showAdd && (
        <div className="bg-card border border-border rounded-lg p-3 mb-2 flex flex-col gap-2">
          <input
            type="text"
            placeholder="Card name (e.g. Chase Sapphire)"
            value={newForm.card_name}
            onChange={e => setNewForm(f => ({ ...f, card_name: e.target.value }))}
            className={inputCls}
            list="plaid-card-name-suggestions"
          />
          <datalist id="plaid-card-name-suggestions">
            {cardNameSuggestions.map(name => <option key={name} value={name} />)}
          </datalist>
          <input
            type="password"
            placeholder="Plaid access token"
            value={newForm.access_token}
            onChange={e => setNewForm(f => ({ ...f, access_token: e.target.value }))}
            className={inputCls}
          />
          <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
            <input
              type="checkbox"
              checked={newForm.save}
              onChange={e => setNewForm(f => ({ ...f, save: e.target.checked }))}
              className="cursor-pointer"
            />
            Save connection for future use
          </label>
          {fetchErr.new && (
            <div className="text-destructive text-[11px]">✗ {fetchErr.new}</div>
          )}
          <Button
            size="sm"
            className="w-full text-[11px] font-bold"
            onClick={addConnection}
            disabled={fetching.new || !newForm.access_token || !newForm.card_name}
          >
            {fetching.new ? 'Fetching…' : 'Fetch Transactions'}
          </Button>
        </div>
      )}

      {/* ── Saved connections ───────────────────────────────────────────────── */}
      {connections.map(conn => {
        const isLoaded = loadedKeys.has(conn.id);
        return (
          <div
            key={conn.id}
            className={`rounded-lg px-3 py-2.5 mb-1.5 border transition-colors ${
              isLoaded ? 'bg-emerald-600/6 border-primary' : 'bg-card border-border'
            }`}
          >
            <div className={`flex justify-between items-center${isLoaded ? '' : ' mb-2'}`}>
              <span className="flex items-center gap-1.5">
                <span className="text-[13px] font-medium">{conn.card_name}</span>
                {conn.account_type && (
                  <span className="text-[10px] text-muted-foreground bg-muted border border-border rounded px-1.5 py-px font-medium">
                    {conn.account_type === 'depository' ? 'Bank' : conn.account_type === 'credit' ? 'Credit Card' : 'Mixed'}
                  </span>
                )}
              </span>
              <div className="flex gap-1.5 items-center">
                {isLoaded && (
                  <>
                    <span className="text-[10px] text-primary font-semibold uppercase tracking-wide">loaded</span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-[11px] font-bold h-auto py-0.5 px-2"
                      onClick={() => syncConnection(conn)}
                      disabled={fetching[`sync_${conn.id}`]}
                    >
                      {fetching[`sync_${conn.id}`] ? 'Syncing…' : 'Sync'}
                    </Button>
                  </>
                )}
                <button
                  onClick={() => setEditingToken(e =>
                    e[conn.id] !== undefined
                      ? (({ [conn.id]: _, ...rest }) => rest)(e)
                      : { ...e, [conn.id]: '' }
                  )}
                  className={iconBtnCls}
                  title={editingToken[conn.id] !== undefined ? 'Cancel update' : 'Update access token'}
                >
                  {editingToken[conn.id] !== undefined ? '↩' : '✎'}
                </button>
                <button
                  onClick={() => removeConnection(conn)}
                  className={iconBtnCls}
                  title="Remove connection"
                >
                  ✕
                </button>
              </div>
            </div>

            {editingToken[conn.id] !== undefined && (
              <div className="mt-2 flex gap-1.5">
                <input
                  type="password"
                  placeholder="New access token"
                  value={editingToken[conn.id]}
                  onChange={e => setEditingToken(et => ({ ...et, [conn.id]: e.target.value }))}
                  className={`${inputCls} flex-1`}
                  autoFocus
                />
                <Button
                  size="sm"
                  className="text-[11px] font-bold whitespace-nowrap h-auto py-0.5 px-2.5"
                  onClick={() => updateToken(conn)}
                  disabled={updatingToken[conn.id] || !editingToken[conn.id]}
                >
                  {updatingToken[conn.id] ? 'Saving…' : 'Update'}
                </Button>
              </div>
            )}

            {!isLoaded && (
              <>
                {fetchErr[conn.id] && (
                  <div className="text-destructive text-[11px] mb-1">✗ {fetchErr[conn.id]}</div>
                )}
                <div className="flex flex-col gap-1.5">
                  {getCursor(conn.id) && (
                    <Button
                      size="sm"
                      className="w-full text-[11px] font-bold"
                      onClick={() => syncConnection(conn)}
                      disabled={fetching[conn.id] || fetching[`sync_${conn.id}`]}
                    >
                      {fetching[`sync_${conn.id}`] ? 'Syncing…' : 'Sync New'}
                    </Button>
                  )}
                  <Button
                    variant={getCursor(conn.id) ? 'outline' : 'default'}
                    size="sm"
                    className="w-full text-[11px] font-bold"
                    onClick={() => fetchSaved(conn)}
                    disabled={fetching[conn.id] || fetching[`sync_${conn.id}`]}
                  >
                    {fetching[conn.id] ? 'Fetching…' : 'Fetch All'}
                  </Button>
                </div>
              </>
            )}

            {isLoaded && fetchErr[conn.id] && (
              <div className="text-destructive text-[11px] mt-1.5">✗ {fetchErr[conn.id]}</div>
            )}
          </div>
        );
      })}

      {connections.length === 0 && !showAdd && (
        <div className="text-[11px] text-muted-foreground py-0.5 pb-1">No saved connections</div>
      )}

      {/* ── Divider before existing card blocks ────────────────────────────── */}
      <div className={`border-t border-border ${connections.length > 0 || showAdd ? 'mt-3' : 'mt-2'}`} />
    </div>
  );
}
