const normalize = require('../utils/normalizeSearch');

const samples = [
  "mc donalds",
  "MCDONALDS",
  "mcdonalds",
  "mc donald's",
  "Dominos",
  "Domino's",
  "  Burger   King ",
];

samples.forEach(s => console.log(s, '->', normalize(s)));
