export function normPlaid(tx) {
  return {
    date: tx.date,
    merchant: tx.merchant_name || tx.name || '—',
    logo_url: tx.logo_url || '',
    website: tx.website || '',
    payment_channel: tx.payment_channel || '',
    amount: tx.amount,
    cat: tx.personal_finance_category?.primary || 'OTHER',
    cat_detail: tx.personal_finance_category?.detailed || '',
    cat_confidence: tx.personal_finance_category?.confidence_level || '',
    pending: tx.pending || false,
    authorized_date: tx.authorized_date || '',
    authorized_datetime: tx.authorized_datetime || '',
    datetime: tx.datetime || '',
    location: tx.location || null,
    transaction_id: tx.transaction_id || '',
    account_id: tx.account_id || '',
    counterparty: Array.isArray(tx.counterparties) ? tx.counterparties : [],
    source: 'plaid',
  };
}

export function guessCat(raw) {
  if (!raw) return 'OTHER';
  const r = raw.toUpperCase();
  if (/FOOD|DINING|RESTAURANT|GROCERY|GROC|COFFEE|CAFE/.test(r)) return 'FOOD_AND_DRINK';
  if (/GAS|FUEL|AUTO|UBER|LYFT|PARKING|TRANSIT/.test(r)) return 'TRANSPORTATION';
  if (/UTIL|PHONE|INTERNET|ELECTRIC|CABLE|WATER/.test(r)) return 'RENT_AND_UTILITIES';
  if (/MEDICAL|HEALTH|PHARMACY|DRUG|DOCTOR/.test(r)) return 'MEDICAL';
  if (/ENTERTAIN|MOVIE|SPORT|THEATER/.test(r)) return 'ENTERTAINMENT';
  if (/HOTEL|FLIGHT|AIRLINE|TRAVEL|AIRBNB/.test(r)) return 'TRAVEL';
  if (/SHOP|AMAZON|WALMART|TARGET|MERCHANDISE/.test(r)) return 'GENERAL_MERCHANDISE';
  if (/PERSONAL|SPA|SALON|GYM|FITNESS/.test(r)) return 'PERSONAL_CARE';
  return 'GENERAL_SERVICES';
}

export function normDate(d) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
  const m = d.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  return m ? `${m[3]}-${m[1].padStart(2, '0')}-${m[2].padStart(2, '0')}` : d;
}

function clean(s) {
  return (s || '').replace(/^"|"$/g, '').trim();
}

function splitRow(line) {
  const res = [];
  let cur = '', inQ = false;
  for (const c of line) {
    if (c === '"') inQ = !inQ;
    else if (c === ',' && !inQ) { res.push(cur); cur = ''; }
    else cur += c;
  }
  res.push(cur);
  return res;
}

export function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) throw new Error('CSV appears empty.');
  const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim().toLowerCase());

  const find = (...keys) => {
    for (const k of keys) {
      const i = headers.findIndex(h => h.includes(k));
      if (i >= 0) return i;
    }
    return -1;
  };

  const iDate = (() => {
    const i = headers.indexOf('transaction date');
    return i >= 0 ? i : find('date', 'trans date');
  })();
  const iDesc = find('description', 'merchant', 'name', 'payee', 'memo');
  const iAmount = find('amount', 'debit', 'charge');
  const iCat = find('category');
  const iType = find('type');

  if (iDate < 0) throw new Error('No date column found.');
  if (iDesc < 0) throw new Error('No merchant/description column found.');
  if (iAmount < 0) throw new Error('No amount column found.');

  const txns = [];
  for (let i = 1; i < lines.length; i++) {
    const row = splitRow(lines[i]);
    if (row.length < 2) continue;
    const rawDate = clean(row[iDate]);
    const rawDesc = clean(row[iDesc]);
    const rawAmt = clean(row[iAmount] || '').replace(/[$,]/g, '');
    const rawCat = iCat >= 0 ? clean(row[iCat]) : '';
    const rawType = iType >= 0 ? clean(row[iType]).toLowerCase() : '';
    if (!rawDate || !rawAmt) continue;
    const amount = parseFloat(rawAmt);
    if (isNaN(amount)) continue;
    if (rawType === 'payment') continue;
    const normalizedAmount =
      rawType === 'sale' ? Math.abs(amount) :
      rawType === 'return' ? -Math.abs(amount) :
      amount;
    txns.push({
      date: normDate(rawDate),
      merchant: rawDesc || '—',
      amount: normalizedAmount,
      cat: guessCat(rawCat),
      cat_detail: rawCat,
      pending: false,
      source: 'csv',
    });
  }

  if (!txns.length) throw new Error('No valid rows found. Check your CSV format.');

  if (iType < 0) {
    const nonZero = txns.filter(r => r.amount !== 0);
    if (nonZero.filter(r => r.amount < 0).length > nonZero.length / 2) {
      txns.forEach(t => { t.amount = -t.amount; });
    }
  }

  return txns;
}
