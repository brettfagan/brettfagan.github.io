import { useState, useRef } from 'react';
import { normPlaid, parseCSV } from '../lib/parse';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

export default function ImportBlock({ card, onLoad, onClear, rules = [] }) {
  const [open, setOpen] = useState(false);
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
    if (!file.name.match(/\.(json|txt)$/i)) { setJsonErr('✗ File must be .json or .txt'); return; }
    if (file.size > 10 * 1024 * 1024) { setJsonErr('✗ File too large (max 10 MB)'); return; }
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
    if (!file.name.match(/\.csv$/i)) { setCsvErr('✗ File must be .csv'); return; }
    if (file.size > 10 * 1024 * 1024) { setCsvErr('✗ File too large (max 10 MB)'); return; }
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        handleLoad(parseCSV(ev.target.result, rules));
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
    <div className={`rounded-lg border overflow-hidden transition-colors ${loaded ? 'border-primary' : 'border-border'}`}>
      <div
        className={`flex items-center justify-between px-3.5 py-1.75 cursor-pointer select-none transition-colors hover:bg-black/3 dark:hover:bg-white/3 bg-muted/40 ${open ? 'border-b border-border' : ''}`}
        onClick={() => setOpen(o => !o)}
      >
        <span className="text-xs font-bold">
          {card.label}{card.sub ? ` — ${card.sub}` : ''}
        </span>
        <span className={`text-[11px] ${loaded ? 'text-primary' : 'text-muted-foreground'}`}>
          {loaded ? `${txnCount} txns` : 'no data'}
        </span>
      </div>

      {open && (
        <div className="p-3.5">
          <Tabs defaultValue="json">
            <TabsList className="w-full mb-3">
              <TabsTrigger value="json" className="flex-1 text-[11px] font-bold">Plaid JSON</TabsTrigger>
              <TabsTrigger value="csv" className="flex-1 text-[11px] font-bold">CSV</TabsTrigger>
            </TabsList>

            <TabsContent value="json" className="mt-0">
              <textarea
                className="w-full bg-background border border-border rounded text-[11px] p-2.5 resize-y min-h-22.5 outline-none focus:border-primary transition-colors mb-2"
                value={jsonText}
                onChange={e => setJsonText(e.target.value)}
                placeholder='Paste Plaid /transactions/get JSON response…'
              />
              <div
                className="border-2 border-dashed border-border rounded-md p-5 text-center cursor-pointer text-muted-foreground text-xs leading-[1.8] transition-all hover:border-primary/50 hover:bg-primary/2 hover:text-foreground"
                onDragOver={e => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) loadJSONFile(f); }}
                onClick={() => document.getElementById(`fi-json-${card.id}`).click()}
                style={dragging ? { borderColor: 'var(--accent2)', background: 'rgba(8,145,178,0.04)' } : {}}
              >
                <div className="text-[22px] mb-1.5">⬆</div>
                Drop .json file or click to browse
                <input
                  type="file"
                  id={`fi-json-${card.id}`}
                  accept=".txt,.json"
                  className="hidden"
                  onChange={e => loadJSONFile(e.target.files[0])}
                />
              </div>
              {jsonErr && <div className="text-destructive text-[11px] py-1">{jsonErr}</div>}
              <Button size="sm" className="w-full mt-2.5 font-bold shadow-none" onClick={loadJSON}>Load JSON</Button>
              {loaded && (
                <Button size="sm" variant="outline" className="w-full mt-1.5 font-bold shadow-none text-muted-foreground hover:text-destructive hover:border-destructive hover:bg-transparent" onClick={handleClear}>Clear</Button>
              )}
            </TabsContent>

            <TabsContent value="csv" className="mt-0">
              <div
                className="border-2 border-dashed border-border rounded-md p-5 text-center cursor-pointer text-muted-foreground text-xs leading-[1.8] transition-all hover:border-primary/50 hover:bg-primary/2 hover:text-foreground"
                onDragOver={e => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
                style={dragging ? { borderColor: 'var(--accent2)', background: 'rgba(8,145,178,0.04)' } : {}}
              >
                <div className="text-[22px] mb-1.5">⬆</div>
                Drop .csv file or click to browse
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".csv"
                  className="hidden"
                  onChange={e => loadCSVFile(e.target.files[0])}
                />
                <div className="mt-2 text-[10px] text-muted-foreground leading-[1.7]">
                  Chase · Fidelity · Barclays · Verizon<br />
                  Any CSV with Date, Merchant, Amount columns
                </div>
              </div>
              {csvErr && <div className="text-destructive text-[11px] py-1">{csvErr}</div>}
              {loaded && (
                <Button size="sm" variant="outline" className="w-full mt-2.5 font-bold shadow-none text-muted-foreground hover:text-destructive hover:border-destructive hover:bg-transparent" onClick={handleClear}>Clear</Button>
              )}
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}
