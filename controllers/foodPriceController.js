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

const searchFoodPrices = async (req, res, next) => {
  try {
    const { query } = req.query;

    if (!query || !query.trim()) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    const rawQuery = String(query).trim();

    await SearchAnalytics.create({ searchTerm: rawQuery });

    const normalizedQuery = normalizeSearch(rawQuery);
    const compact = normalizedQuery.replace(/\s+/g, '');
    const fuzzyPattern = compact.split('').map((c) => c.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')).join('.*');

    const orClauses = [];
    if (fuzzyPattern) {
      orClauses.push({ normalizedRestaurant: { $regex: fuzzyPattern } });
      orClauses.push({ normalizedItem: { $regex: fuzzyPattern } });
    }
    orClauses.push({ platform: { $regex: rawQuery, $options: 'i' } });

    const foodPrices = await FoodPrice.find({ $or: orClauses });

    // Group by restaurant + item
    const groups = {};
    foodPrices.forEach((fp) => {
      const obj = fp.toObject();
      const priceDetails = calculateFinalPrice(obj);
      const key = `${obj.restaurant}||${obj.item}`;

      if (!groups[key]) groups[key] = { restaurant: obj.restaurant, item: obj.item, entries: [] };
      groups[key].entries.push({ platform: obj.platform, finalPrice: priceDetails.finalPrice, foodPrice: obj.foodPrice });
    });

      g.entries.sort((a, b) => a.finalPrice - b.finalPrice);
      const cheapest = g.entries[0];
      return {
        restaurant: g.restaurant,
        item: g.item,
        cheapestPlatform: cheapest.platform,
        cheapestPrice: cheapest.finalPrice,
        platforms: g.entries.map((e) => ({ platform: e.platform, price: e.finalPrice })),
        badge: `Cheapest: ${cheapest.platform} ₹${cheapest.finalPrice}`,
        comparisonLine: g.entries.map((e) => `${e.platform} ₹${e.price}`).join(' | '),
      };
    });

    const results = Object.values(groups).map((g) => {
      g.entries.sort((a, b) => a.finalPrice - b.finalPrice);
      const cheapest = g.entries[0];
      return {
        restaurant: g.restaurant,
        item: g.item,
        cheapestPlatform: cheapest.platform,
        cheapestPrice: cheapest.finalPrice,
        platforms: g.entries.map((e) => ({ platform: e.platform, price: e.finalPrice })),
        badge: `Cheapest: ${cheapest.platform} ₹${cheapest.finalPrice}`,
        comparisonLine: g.entries.map((e) => `${e.platform} ₹${e.price}`).join(' | '),
      };
    });

    // Also supply entries for backwards compatibility
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
    const normalizedQuery = normalizeSearch(rawQuery);
    const compact = normalizedQuery.replace(/\s+/g, '');
    const fuzzyPattern = compact.split('').map((c) => c.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')).join('.*');

    const orClauses = [];
    if (fuzzyPattern) {
      orClauses.push({ normalizedRestaurant: { $regex: fuzzyPattern } });
      orClauses.push({ normalizedItem: { $regex: fuzzyPattern } });
    }
    orClauses.push({ platform: { $regex: rawQuery, $options: 'i' } });

    const foodPrices = await FoodPrice.find({ $or: orClauses }).select('restaurant item platform').limit(20);

    const allValues = foodPrices.flatMap((fp) => [fp.item, fp.restaurant, fp.platform]);
    const uniqueValues = [...new Set(allValues)];

    const suggestions = uniqueValues.filter((value) => normalizeSearch(value).includes(normalizedQuery)).slice(0, 6);

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
