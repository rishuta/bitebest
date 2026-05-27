const mongoose = require('mongoose');
const FoodPrice = require('../models/FoodPrice');
const SearchAnalytics = require('../models/SearchAnalytics');
const calculateFinalPrice = require('../utils/priceEngine');
const normalizeSearch = require('../utils/normalizeSearch');

const buildFoodPricePayload = (body) => {
  const payload = {
    restaurant: body.restaurant,
    normalizedRestaurant: body.restaurant ? normalizeSearch(body.restaurant) : undefined,
    item: body.item,
    normalizedItem: body.item ? normalizeSearch(body.item) : undefined,
    platform: body.platform,
    foodPrice: body.foodPrice,
    deliveryFee: body.deliveryFee,
    packagingFee: body.packagingFee,
    offerType: body.offerType,
    offerValue: body.offerValue,
    minOrder: body.minOrder,
    eta: typeof body.eta === 'string' ? body.eta.trim() : body.eta,
  };

  if (body.rating !== undefined && body.rating !== '') {
    payload.rating = Number(body.rating);
  }

  return payload;
};

const getFoodPrices = async (req, res, next) => {
  try {
    const foodPrices = await FoodPrice.find().sort({ createdAt: -1 });
    console.log(`Food price records found: ${foodPrices.length}`);
    res.json(foodPrices);
  } catch (error) {
    next(error);
  }
};

// Helpers for forgiving search: build fuzzy regex from normalized query
const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const buildFuzzyPatternFromNormalized = (normalizedInput) => {
  if (!normalizedInput) return '';
  // remove spaces for character based fuzzy matching
  const compact = String(normalizedInput).replace(/\s+/g, '');
  const chars = compact.split('');
  return chars.map((c) => escapeRegex(c)).join('.*');
};

// Alias map for common misspellings / alternate forms. Keys/values should be normalized.
const ALIAS_MAP = {
  'shwarma': 'shawarma',
  'shawarma': 'shawarma',
  'dosai': 'dosa',
  'dosa': 'dosa',
  'biriyani': 'biryani',
  'biryani': 'biryani',
  "mc donalds": 'mcdonalds',
  'mcdonalds': 'mcdonalds',
  "mc donald's": 'mcdonalds',
  'domino s': 'dominos',
  'dominos': 'dominos',
  'domino': 'dominos',
  'burgerking': 'burger king',
};

// getSearchAliases returns an array of normalized aliases for a given query.
// It keeps the original normalized query and adds mapped replacements where applicable.
const getSearchAliases = (rawQuery) => {
  const aliases = new Set();
  if (!rawQuery && rawQuery !== 0) return [];

  const normalizedQuery = normalizeSearch(rawQuery);
  aliases.add(normalizedQuery);

  // For each mapping key, if the normalized query contains the key as a substring,
  // add a variant where the key is replaced with the mapped value. This handles
  // multi-word phrases like "chicken shwarma" -> "chicken shawarma".
  Object.keys(ALIAS_MAP).forEach((rawKey) => {
    const key = normalizeSearch(rawKey);
    const mapped = normalizeSearch(ALIAS_MAP[rawKey]);

    if (key && normalizedQuery.includes(key)) {
      const replaced = normalizedQuery.split(key).join(mapped);
      aliases.add(replaced);
    }

    if (key && (normalizedQuery === key || mapped === normalizedQuery)) {
      aliases.add(mapped);
    }
  });

  return Array.from(aliases).filter(Boolean);
};

const searchFoodPrices = async (req, res, next) => {
  try {
    const { query } = req.query;

    if (!query || !query.trim()) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    const rawQuery = String(query).trim();

    await SearchAnalytics.create({ searchTerm: rawQuery });

    // Build aliases for the query and search across them using fuzzy patterns
    const aliases = getSearchAliases(rawQuery);

    const orClauses = [];
    aliases.forEach((alias) => {
      const pattern = buildFuzzyPatternFromNormalized(alias);
      if (pattern) {
        orClauses.push({ normalizedRestaurant: { $regex: pattern, $options: 'i' } });
        orClauses.push({ normalizedItem: { $regex: pattern, $options: 'i' } });
      }
      // also allow matching against platform text
      orClauses.push({ platform: { $regex: alias, $options: 'i' } });
    });

    // fallback: if no clauses produced, search by raw query as-is
    if (orClauses.length === 0) {
      orClauses.push({ platform: { $regex: rawQuery, $options: 'i' } });
    }

    const foodPrices = await FoodPrice.find({ $or: orClauses });

    // Group by restaurant + item to present comparison-ready results
    const groups = {};

    foodPrices.forEach((fp) => {
      const obj = fp.toObject();
      const priceDetails = calculateFinalPrice(obj);
      const key = `${obj.restaurant}||${obj.item}`;

      if (!groups[key]) {
        groups[key] = {
          restaurant: obj.restaurant,
          item: obj.item,
          entries: [],
        };
      }

      groups[key].entries.push({
        platform: obj.platform,
        foodPrice: obj.foodPrice,
        deliveryFee: obj.deliveryFee,
        packagingFee: obj.packagingFee,
        finalPrice: priceDetails.finalPrice,
      });
    });

    const results = Object.values(groups).map((g) => {
      // sort entries by finalPrice
      g.entries.sort((a, b) => a.finalPrice - b.finalPrice);
      const cheapest = g.entries[0];
      const others = g.entries.slice(1);

      return {
        restaurant: g.restaurant,
        item: g.item,
        cheapestPlatform: cheapest.platform,
        cheapestPrice: cheapest.finalPrice,
        platforms: g.entries.map((e) => ({ platform: e.platform, price: e.finalPrice })),
        // UI-friendly badge text fields frontend can use
        badge: `Cheapest: ${cheapest.platform} ₹${cheapest.finalPrice}`,
        comparisonLine: g.entries.map((e) => `${e.platform} ₹${e.finalPrice}`).join(' | '),
      };
    });

    // Also prepare flat entries (backwards compatible)
    const resultsWithPrices = foodPrices
      .map((foodPrice) => {
        const foodPriceObject = foodPrice.toObject();
        const priceDetails = calculateFinalPrice(foodPriceObject);

        return {
          ...foodPriceObject,
          ...priceDetails,
          bestDeal: false,
        };
      })
      .sort((a, b) => a.finalPrice - b.finalPrice);

    if (resultsWithPrices.length > 0) resultsWithPrices[0].bestDeal = true;

    results.sort((a, b) => a.cheapestPrice - b.cheapestPrice);

    res.json({ grouped: results, entries: resultsWithPrices });
  } catch (error) {
    next(error);
  }
};

const getSearchSuggestions = async (req, res, next) => {
  try {
    const { query } = req.query;

    if (!query || !query.trim()) {
      return res.json([]);
    }

    const rawQuery = String(query).trim();
    const aliases = getSearchAliases(rawQuery);

    const orClauses = [];
    aliases.forEach((alias) => {
      const pattern = buildFuzzyPatternFromNormalized(alias);
      if (pattern) {
        orClauses.push({ normalizedRestaurant: { $regex: pattern, $options: 'i' } });
        orClauses.push({ normalizedItem: { $regex: pattern, $options: 'i' } });
      }
      orClauses.push({ platform: { $regex: alias, $options: 'i' } });
    });

    // fallback
    if (orClauses.length === 0) {
      orClauses.push({ platform: { $regex: rawQuery, $options: 'i' } });
    }

    const foodPrices = await FoodPrice.find({ $or: orClauses }).select('restaurant item platform').limit(20);

    // Normalize suggestions and filter by any alias inclusion
    const allValues = foodPrices.flatMap((fp) => [fp.item, fp.restaurant, fp.platform]);
    const uniqueValues = [...new Set(allValues)];

    const suggestions = uniqueValues
      .filter((value) => aliases.some((alias) => normalizeSearch(value).includes(alias)))
      .slice(0, 6);

    res.json(suggestions);
  } catch (error) {
    next(error);
  }
};

const createFoodPrice = async (req, res, next) => {
  try {
    const foodPrice = await FoodPrice.create(buildFoodPricePayload(req.body));
    res.status(201).json(foodPrice);
  } catch (error) {
    next(error);
  }
};

const updateFoodPrice = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid food price id' });
    }

    const foodPrice = await FoodPrice.findByIdAndUpdate(
      id,
      {
        ...buildFoodPricePayload(req.body),
        lastUpdated: Date.now(),
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!foodPrice) {
      return res.status(404).json({ message: 'Food price record not found' });
    }

    res.json(foodPrice);
  } catch (error) {
    next(error);
  }
};

const deleteFoodPrice = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid food price id' });
    }

    const foodPrice = await FoodPrice.findByIdAndDelete(id);

    if (!foodPrice) {
      return res.status(404).json({ message: 'Food price record not found' });
    }

    res.json({ message: 'Food price record deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getFoodPrices,
  searchFoodPrices,
  getSearchSuggestions,
  createFoodPrice,
  updateFoodPrice,
  deleteFoodPrice,
};
