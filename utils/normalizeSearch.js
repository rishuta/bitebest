const normalizeSearch = (input) => {
  if (!input && input !== 0) return '';
  let s = String(input).toLowerCase();
  s = s.replace(/[^a-z0-9\s]/g, '');
  s = s.replace(/\s+/g, ' ').trim();
  return s;
};

module.exports = normalizeSearch;
