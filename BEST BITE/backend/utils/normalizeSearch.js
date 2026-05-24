// Utility to normalize search strings for consistent comparisons
const normalizeSearch = (input) => {
  if (!input && input !== 0) return '';
  // Ensure string
  let s = String(input);
  // Lowercase
  s = s.toLowerCase();
  // Remove punctuation and apostrophes but keep spaces and alphanumerics
  s = s.replace(/[^a-z0-9\s]/g, '');
  // Collapse multiple spaces
  s = s.replace(/\s+/g, ' ').trim();
  return s;
};

module.exports = normalizeSearch;
