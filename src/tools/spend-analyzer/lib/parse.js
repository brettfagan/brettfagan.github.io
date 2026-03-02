const MAX_PATTERN_LENGTH = 200;

// Returns an error string if the pattern is invalid or risky, or null if safe.
// Catches: missing input, excessive length, nested quantifiers (ReDoS risk),
// and invalid regex syntax.
export function validatePattern(pattern) {
  if (!pattern || !pattern.trim()) return 'Pattern is required.';
  if (pattern.length > MAX_PATTERN_LENGTH)
    return `Pattern must be ${MAX_PATTERN_LENGTH} characters or fewer.`;
  // Reject nested quantifiers that cause catastrophic backtracking, e.g. (a+)+
  if (/\([^)]+[+*][^)]*\)[+*{]/.test(pattern))
    return 'Pattern contains nested quantifiers (e.g. (a+)+) that may freeze the page. Simplify the pattern.';
  try { new RegExp(pattern, 'i'); }
  catch (e) { return `Invalid regex: ${e.message}`; }
  return null;
}

export function normPlaid(tx) {
  return {
    date: tx.date,
    merchant: tx.merchant_name || tx.name || '—',
    name: tx.name || tx.merchant_name || '—',
    logo_url: tx.logo_url || '',
    cat_icon_url: tx.personal_finance_category_icon_url || '',
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

// guessCat: tries user rules first (in priority order), then falls back to
// hardcoded patterns. Works on both the CSV category column and merchant name.
// Returns { cat, cat_detail } — cat_detail is from the matched rule if set,
// otherwise falls back to the raw CSV category string.
export function guessCat(rawCat = '', rawDesc = '', rules = []) {
  const catUp  = rawCat.toUpperCase();
  const descUp = rawDesc.toUpperCase();

  // 1. User rules (already sorted by priority ascending from context)
  for (const rule of rules) {
    let re;
    try { re = new RegExp(rule.pattern, 'i'); }
    catch { continue; } // skip invalid patterns

    const testCat  = rule.match_field !== 'merchant'  && re.test(catUp);
    const testDesc = rule.match_field !== 'category'  && re.test(descUp);
    if (testCat || testDesc) {
      return {
        cat: rule.cat,
        cat_detail: rule.cat_detail || rawCat || null,
      };
    }
  }

  // 2. Hardcoded fallback (for signed-out users or empty rules list)
  const r = catUp + ' ' + descUp;
  const fallbackCat =
    /FOOD|DINING|RESTAURANT|GROCERY|GROC|COFFEE|CAFE/.test(r) ? 'FOOD_AND_DRINK' :
    /GAS|FUEL|AUTO|UBER|LYFT|PARKING|TRANSIT/.test(r)         ? 'TRANSPORTATION' :
    /UTIL|PHONE|INTERNET|ELECTRIC|CABLE|WATER/.test(r)        ? 'RENT_AND_UTILITIES' :
    /MEDICAL|HEALTH|PHARMACY|DRUG|DOCTOR/.test(r)             ? 'MEDICAL' :
    /ENTERTAIN|MOVIE|SPORT|THEATER/.test(r)                   ? 'ENTERTAINMENT' :
    /HOTEL|FLIGHT|AIRLINE|TRAVEL|AIRBNB/.test(r)              ? 'TRAVEL' :
    /SHOP|AMAZON|WALMART|TARGET|MERCHANDISE/.test(r)          ? 'GENERAL_MERCHANDISE' :
    /PERSONAL|SPA|SALON|GYM|FITNESS/.test(r)                  ? 'PERSONAL_CARE' :
    'GENERAL_SERVICES';

  return { cat: fallbackCat, cat_detail: rawCat || null };
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

export function parseCSV(text, rules = []) {
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
    const rawAmt  = clean(row[iAmount] || '').replace(/[$,]/g, '');
    const rawCat  = iCat >= 0 ? clean(row[iCat]) : '';
    const rawType = iType >= 0 ? clean(row[iType]).toLowerCase() : '';
    if (!rawDate || !rawAmt) continue;
    const amount = parseFloat(rawAmt);
    if (isNaN(amount)) continue;
    if (rawType === 'payment') continue;
    const normalizedAmount =
      rawType === 'sale'   ? Math.abs(amount) :
      rawType === 'return' ? -Math.abs(amount) :
      amount;
    const { cat, cat_detail } = guessCat(rawCat, rawDesc, rules);
    txns.push({
      date: normDate(rawDate),
      merchant: rawDesc || '—',
      amount: normalizedAmount,
      cat,
      cat_detail,
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
