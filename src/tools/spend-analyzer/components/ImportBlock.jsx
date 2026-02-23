import { useState, useRef } from 'react';
import { normPlaid } from '../lib/parse';
import { parseCSV } from '../lib/parse';

export default function ImportBlock({ card, onLoad, onClear }) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('json');
  const [jsonText, setJsonText] = useState('');
  const [jsonErr, setJsonErr] = useState('');
  const [csvErr, setCsvErr] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [txnCount, setTxnCount] = useState(0);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef(null);

  function handleLoad(txns) {
    setLoaded(true);
    setTxnCount(txns.length);
    setOpen(false);
    onLoad(card.id, txns);
  }

  function handleClear() {
    setLoaded(false);
    setTxnCount(0);
    setJsonText('');
    setJsonErr('');
    setCsvErr('');
    onClear(card.id);
  }

  function loadJSON() {
    setJsonErr('');
    try {
      const data = JSON.parse(jsonText.trim());
      if (!Array.isArray(data.transactions))
        throw new Error('Missing "transactions" array — check this is a Plaid /transactions/get response.');
      handleLoad(data.transactions.map(normPlaid));
    } catch (e) {
      setJsonErr('✗ ' + e.message);
    }
  }

  function loadJSONFile(file) {
    if (!file) return;
    setJsonErr('');
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const data = JSON.parse(ev.target.result.trim());
        if (!Array.isArray(data.transactions))
          throw new Error('Missing "transactions" array — check this is a Plaid /transactions/get response.');
        handleLoad(data.transactions.map(normPlaid));
      } catch (e) {
        setJsonErr('✗ ' + e.message);
      }
    };
    reader.readAsText(file);
  }

  function loadCSVFile(file) {
    if (!file) return;
    setCsvErr('');
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        handleLoad(parseCSV(ev.target.result));
      } catch (e) {
        setCsvErr('✗ ' + e.message);
      }
    };
    reader.readAsText(file);
  }

  function onDrop(e) {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) loadCSVFile(f);
  }

  return (
    <div className={`import-block${loaded ? ' loaded' : ''}${open ? ' open' : ''}`}>
      <div
        className="import-block-header"
        onClick={() => setOpen(o => !o)}
      >
        <span className="block-label">{card.label}{card.sub ? ` — ${card.sub}` : ''}</span>
        <span className={`block-status${loaded ? ' ok' : ''}`}>
          {loaded ? `${txnCount} txns` : 'no data'}
        </span>
      </div>

      <div className="import-body">
        <div className="tabs">
          <button
            className={`tab-btn${activeTab === 'json' ? ' active' : ''}`}
            onClick={() => setActiveTab('json')}
          >
            Plaid JSON
          </button>
          <button
            className={`tab-btn${activeTab === 'csv' ? ' active' : ''}`}
            onClick={() => setActiveTab('csv')}
          >
            CSV
          </button>
        </div>

        {activeTab === 'json' && (
          <div className="tab-pane active">
            <textarea
              value={jsonText}
              onChange={e => setJsonText(e.target.value)}
              placeholder='Paste Plaid /transactions/get JSON response…'
            />
            <div
              className={`drop-zone`}
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) loadJSONFile(f); }}
              onClick={() => document.getElementById(`fi-json-${card.id}`).click()}
              style={dragging ? { borderColor: 'var(--accent2)', background: 'rgba(8,145,178,0.04)' } : {}}
            >
              <div className="drop-icon">⬆</div>
              Drop .json file or click to browse
              <input
                type="file"
                id={`fi-json-${card.id}`}
                accept=".txt,.json"
                style={{ display: 'none' }}
                onChange={e => loadJSONFile(e.target.files[0])}
              />
            </div>
            <div className="err">{jsonErr}</div>
            <button className="btn" onClick={loadJSON}>Load JSON</button>
            {loaded && <button className="btn btn-ghost" onClick={handleClear}>Clear</button>}
          </div>
        )}

        {activeTab === 'csv' && (
          <div className="tab-pane active">
            <div
              className={`drop-zone${dragging ? ' dragover' : ''}`}
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="drop-icon">⬆</div>
              Drop .csv file or click to browse
              <input
                type="file"
                ref={fileInputRef}
                accept=".csv"
                style={{ display: 'none' }}
                onChange={e => loadCSVFile(e.target.files[0])}
              />
              <div className="csv-hint">
                Chase · Fidelity · Barclays · Verizon<br />
                Any CSV with Date, Merchant, Amount columns
              </div>
            </div>
            <div className="err">{csvErr}</div>
            {loaded && <button className="btn btn-ghost" onClick={handleClear}>Clear</button>}
          </div>
        )}
      </div>
    </div>
  );
}
