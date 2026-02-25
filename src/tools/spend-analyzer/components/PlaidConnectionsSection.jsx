import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { normPlaid } from '../lib/parse';
import { CARDS } from '../lib/constants';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

const inputStyle = {
  fontSize: '12px',
  padding: '6px 8px',
  border: '1px solid var(--border)',
  borderRadius: '5px',
  background: 'var(--bg)',
  color: 'var(--text)',
  width: '100%',
  boxSizing: 'border-box',
};

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
      if (data.session) session = data.session;
    }
  } catch { /* unparseable token — proceed and let the server reject it */ }

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
      const savedCardName = newForm.card_name;
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
    await supabase.from('plaid_connections').delete().eq('id', conn.id);
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
      const { error } = await supabase.from('plaid_connections').update({ access_token: newToken }).eq('id', conn.id);
      if (error) {
        setFetchErr(e => ({ ...e, [conn.id]: error.message }));
        return;
      }
      clearCursor(conn.id);
      onClear(conn.card_name);
      setLoadedKeys(s => { const n = new Set(s); n.delete(conn.id); return n; });
      setEditingToken(e => { const n = { ...e }; delete n[conn.id]; return n; });
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

  return (
    <div style={{ marginBottom: '16px' }}>
      {/* Section header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Plaid API
        </span>
        <button
          className="cm-btn primary"
          style={{ fontSize: '11px', padding: '3px 8px' }}
          onClick={() => setShowAdd(s => !s)}
        >
          {showAdd ? 'Cancel' : '+ Add'}
        </button>
      </div>

      {/* Add connection form */}
      {showAdd && (
        <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px', padding: '12px', marginBottom: '8px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <input
              type="text"
              placeholder="Card name (e.g. Chase Sapphire)"
              value={newForm.card_name}
              onChange={e => setNewForm(f => ({ ...f, card_name: e.target.value }))}
              style={inputStyle}
              list="plaid-card-name-suggestions"
            />
            <datalist id="plaid-card-name-suggestions">
              {cardNameSuggestions.map(name => (
                <option key={name} value={name} />
              ))}
            </datalist>
            <input
              type="password"
              placeholder="Plaid access token"
              value={newForm.access_token}
              onChange={e => setNewForm(f => ({ ...f, access_token: e.target.value }))}
              style={inputStyle}
            />
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--muted)', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={newForm.save}
                onChange={e => setNewForm(f => ({ ...f, save: e.target.checked }))}
              />
              Save connection for future use
            </label>
            {fetchErr.new && (
              <div style={{ color: 'var(--warn)', fontSize: '11px' }}>✗ {fetchErr.new}</div>
            )}
            <button
              className="cm-btn primary"
              onClick={addConnection}
              disabled={fetching.new || !newForm.access_token || !newForm.card_name}
              style={{ width: '100%' }}
            >
              {fetching.new ? 'Fetching…' : 'Fetch Transactions'}
            </button>
          </div>
        </div>
      )}

      {/* Saved connections */}
      {connections.map(conn => {
        const isLoaded = loadedKeys.has(conn.id);
        return (
          <div
            key={conn.id}
            style={{
              background: isLoaded ? 'rgba(5,150,105,0.06)' : 'var(--bg)',
              border: `1px solid ${isLoaded ? 'var(--accent)' : 'var(--border)'}`,
              borderRadius: '8px',
              padding: '10px 12px',
              marginBottom: '6px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isLoaded ? '0' : '8px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '13px', fontWeight: 500 }}>{conn.card_name}</span>
                {conn.account_type && (
                  <span style={{ fontSize: '10px', color: 'var(--muted)', background: 'var(--border)', borderRadius: '4px', padding: '1px 5px', fontWeight: 500 }}>
                    {conn.account_type === 'depository' ? 'Bank' : conn.account_type === 'credit' ? 'Credit Card' : 'Mixed'}
                  </span>
                )}
              </span>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                {isLoaded && (
                  <>
                    <span style={{ fontSize: '10px', color: 'var(--accent)', fontWeight: 600, textTransform: 'uppercase' }}>
                      loaded
                    </span>
                    <button
                      className="cm-btn"
                      onClick={() => syncConnection(conn)}
                      disabled={fetching[`sync_${conn.id}`]}
                      style={{ fontSize: '11px', padding: '3px 8px' }}
                    >
                      {fetching[`sync_${conn.id}`] ? 'Syncing…' : 'Sync'}
                    </button>
                  </>
                )}
                <button
                  onClick={() => setEditingToken(e =>
                    e[conn.id] !== undefined
                      ? (({ [conn.id]: _, ...rest }) => rest)(e)
                      : { ...e, [conn.id]: '' }
                  )}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: '13px', padding: '2px 4px', lineHeight: 1 }}
                  title={editingToken[conn.id] !== undefined ? 'Cancel update' : 'Update access token'}
                >
                  {editingToken[conn.id] !== undefined ? '↩' : '✎'}
                </button>
                <button
                  onClick={() => removeConnection(conn)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: '13px', padding: '2px 4px', lineHeight: 1 }}
                  title="Remove connection"
                >
                  ✕
                </button>
              </div>
            </div>

            {editingToken[conn.id] !== undefined && (
              <div style={{ marginTop: '8px', display: 'flex', gap: '6px' }}>
                <input
                  type="password"
                  placeholder="New access token"
                  value={editingToken[conn.id]}
                  onChange={e => setEditingToken(et => ({ ...et, [conn.id]: e.target.value }))}
                  style={{ ...inputStyle, flex: 1 }}
                  autoFocus
                />
                <button
                  className="cm-btn primary"
                  onClick={() => updateToken(conn)}
                  disabled={updatingToken[conn.id] || !editingToken[conn.id]}
                  style={{ fontSize: '11px', padding: '3px 10px', whiteSpace: 'nowrap' }}
                >
                  {updatingToken[conn.id] ? 'Saving…' : 'Update'}
                </button>
              </div>
            )}

            {!isLoaded && (
              <>
                {fetchErr[conn.id] && (
                  <div style={{ color: 'var(--warn)', fontSize: '11px', marginBottom: '4px' }}>
                    ✗ {fetchErr[conn.id]}
                  </div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {getCursor(conn.id) && (
                    <button
                      className="cm-btn primary"
                      onClick={() => syncConnection(conn)}
                      disabled={fetching[conn.id] || fetching[`sync_${conn.id}`]}
                      style={{ width: '100%', fontSize: '12px' }}
                    >
                      {fetching[`sync_${conn.id}`] ? 'Syncing…' : 'Sync New'}
                    </button>
                  )}
                  <button
                    className={getCursor(conn.id) ? 'cm-btn' : 'cm-btn primary'}
                    onClick={() => fetchSaved(conn)}
                    disabled={fetching[conn.id] || fetching[`sync_${conn.id}`]}
                    style={{ width: '100%', fontSize: '12px' }}
                  >
                    {fetching[conn.id] ? 'Fetching…' : 'Fetch All'}
                  </button>
                </div>
              </>
            )}

            {isLoaded && fetchErr[conn.id] && (
              <div style={{ color: 'var(--warn)', fontSize: '11px', marginTop: '6px' }}>
                ✗ {fetchErr[conn.id]}
              </div>
            )}
          </div>
        );
      })}

      {connections.length === 0 && !showAdd && (
        <div style={{ fontSize: '11px', color: 'var(--muted)', padding: '2px 0 4px' }}>
          No saved connections
        </div>
      )}

      {/* Divider before existing card blocks */}
      <div style={{ borderTop: '1px solid var(--border)', marginTop: connections.length > 0 || showAdd ? '12px' : '8px' }} />
    </div>
  );
}
