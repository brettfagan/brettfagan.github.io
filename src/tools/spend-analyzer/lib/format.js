export function fmt(n) {
  return '$' + Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function fmtCat(c) {
  return (c || 'OTHER').replace(/_/g, ' ').replace(/\b\w/g, x => x.toUpperCase());
}

export function fmtDetail(d) {
  if (!d) return '';
  const prefixes = [
    'FOOD_AND_DRINK', 'GENERAL_MERCHANDISE', 'GENERAL_SERVICES',
    'RENT_AND_UTILITIES', 'HOME_IMPROVEMENT', 'PERSONAL_CARE',
    'GOVERNMENT_AND_NON_PROFIT', 'LOAN_PAYMENTS', 'ENTERTAINMENT',
    'TRANSPORTATION', 'MEDICAL', 'TRAVEL', 'INCOME', 'OTHER',
  ];
  for (const p of prefixes) {
    if (d.startsWith(p + '_')) {
      const stripped = d.slice(p.length + 1);
      return stripped.replace(/_/g, ' ').replace(/\b\w/g, x => x.toUpperCase());
    }
  }
  return d.replace(/_/g, ' ').replace(/\b\w/g, x => x.toUpperCase());
}

export function fmtDate(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  if (!y || !m || !d) return iso;
  return `${m}/${d}/${y}`;
}

export function fmtShortDate(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  const month = parseInt(m), day = parseInt(d);
  if (isNaN(month) || isNaN(day)) return iso; // graceful fallback for non-ISO dates
  return `${month}/${day}/${y.slice(2)}`;
}
