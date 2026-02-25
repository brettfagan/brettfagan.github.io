import { useState, useEffect } from 'react';
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

const dateInputStyle = {
  ...inputStyle,
  flex: 1,
  padding: '5px 6px',
  fontSize: '11px',
};

async function callPlaidFetch(body) {
  const { data: { session } } = await supabase.auth.getSession();
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

export default function PlaidConnectionsSection({ onLoad, onClear }) {
  const { user } = useAuth();
  const [connections, setConnections] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newForm, setNewForm] = useState({
    access_token: '',
    card_name: '',
    start: '',
    end: '',
    save: true,
  });
  const [fetching, setFetching] = useState({});   // { [id | 'new']: bool }
  const [fetchErr, setFetchErr] = useState({});    // { [id | 'new']: string }
  const [loadedKeys, setLoadedKeys] = useState(new Set()); // connection ids loaded this session
  const [connDates, setConnDates] = useState({});  // { [id]: { start, end } }

  useEffect(() => {
    if (user) loadConnections();
  }, [user]);

  async function loadConnections() {
    const { data } = await supabase
      .from('plaid_connections')
      .select('id, card_name, created_at')
      .order('created_at', { ascending: false });
    if (data) {
      setConnections(data);
      const init = {};
      data.forEach(c => { init[c.id] = { start: '', end: '' }; });
      setConnDates(init);
    }
    return data || [];
  }

  async function fetchSaved(conn) {
    const dates = connDates[conn.id] || { start: '', end: '' };
    setFetching(f => ({ ...f, [conn.id]: true }));
    setFetchErr(e => ({ ...e, [conn.id]: '' }));
    try {
      const { transactions } = await callPlaidFetch({
        connection_id: conn.id,
        start_date: dates.start,
        end_date: dates.end,
      });
      onLoad(conn.card_name, transactions.map(normPlaid));
      setLoadedKeys(s => new Set([...s, conn.id]));
    } catch (e) {
      setFetchErr(f => ({ ...f, [conn.id]: e.message }));
    } finally {
      setFetching(f => ({ ...f, [conn.id]: false }));
    }
  }

  async function addConnection() {
    if (!newForm.access_token || !newForm.card_name) return;
    setFetching(f => ({ ...f, new: true }));
    setFetchErr(e => ({ ...e, new: '' }));
    try {
      const { transactions } = await callPlaidFetch({
        access_token: newForm.access_token,
        card_name: newForm.card_name,
        start_date: newForm.start,
        end_date: newForm.end,
        save: newForm.save,
      });
      onLoad(newForm.card_name, transactions.map(normPlaid));
      setShowAdd(false);
      const savedCardName = newForm.card_name;
      setNewForm({ access_token: '', card_name: '', start: '', end: '', save: true });
      if (newForm.save) {
        const conns = await loadConnections();
        const newConn = conns.find(c => c.card_name === savedCardName);
        if (newConn) setLoadedKeys(s => new Set([...s, newConn.id]));
      }
    } catch (e) {
      setFetchErr(f => ({ ...f, new: e.message }));
    } finally {
      setFetching(f => ({ ...f, new: false }));
    }
  }

  async function removeConnection(conn) {
    await supabase.from('plaid_connections').delete().eq('id', conn.id);
    onClear(conn.card_name);
    setLoadedKeys(s => { const n = new Set(s); n.delete(conn.id); return n; });
    setConnections(cs => cs.filter(c => c.id !== conn.id));
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '10px', color: 'var(--muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Start</label>
              <input
                type="date"
                value={newForm.start}
                onChange={e => setNewForm(f => ({ ...f, start: e.target.value }))}
                style={{ ...inputStyle, fontSize: '11px', padding: '5px 6px' }}
              />
              <label style={{ fontSize: '10px', color: 'var(--muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>End</label>
              <input
                type="date"
                value={newForm.end}
                onChange={e => setNewForm(f => ({ ...f, end: e.target.value }))}
                style={{ ...inputStyle, fontSize: '11px', padding: '5px 6px' }}
              />
            </div>
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
              disabled={fetching.new || !newForm.access_token || !newForm.card_name || !newForm.start || !newForm.end}
              style={{ width: '100%' }}
            >
              {fetching.new ? 'Fetching…' : 'Fetch Transactions'}
            </button>
          </div>
        </div>
      )}

      {/* Saved connections */}
      {connections.map(conn => {
        const dates = connDates[conn.id] || { start: '', end: '' };
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
              <span style={{ fontSize: '13px', fontWeight: 500 }}>{conn.card_name}</span>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                {isLoaded && (
                  <span style={{ fontSize: '10px', color: 'var(--accent)', fontWeight: 600, textTransform: 'uppercase' }}>
                    loaded
                  </span>
                )}
                <button
                  onClick={() => removeConnection(conn)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: '13px', padding: '2px 4px', lineHeight: 1 }}
                  title="Remove connection"
                >
                  ✕
                </button>
              </div>
            </div>

            {!isLoaded && (
              <>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '6px' }}>
                  <input
                    type="date"
                    value={dates.start}
                    onChange={e => setConnDates(d => ({ ...d, [conn.id]: { ...d[conn.id], start: e.target.value } }))}
                    style={{ ...dateInputStyle, width: 'auto' }}
                  />
                  <span style={{ color: 'var(--muted)', fontSize: '11px', flexShrink: 0 }}>→</span>
                  <input
                    type="date"
                    value={dates.end}
                    onChange={e => setConnDates(d => ({ ...d, [conn.id]: { ...d[conn.id], end: e.target.value } }))}
                    style={{ ...dateInputStyle, width: 'auto' }}
                  />
                </div>
                {fetchErr[conn.id] && (
                  <div style={{ color: 'var(--warn)', fontSize: '11px', marginBottom: '4px' }}>
                    ✗ {fetchErr[conn.id]}
                  </div>
                )}
                <button
                  className="cm-btn primary"
                  onClick={() => fetchSaved(conn)}
                  disabled={fetching[conn.id] || !dates.start || !dates.end}
                  style={{ width: '100%', fontSize: '12px' }}
                >
                  {fetching[conn.id] ? 'Fetching…' : 'Fetch Transactions'}
                </button>
              </>
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
