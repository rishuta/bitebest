const mongoose = require('mongoose');
const FoodPrice = require('../models/FoodPrice');
const SearchAnalytics = require('../models/SearchAnalytics');
const calculateFinalPrice = require('../utils/priceEngine');

const buildFoodPricePayload = (body) => {
  const payload = {
    restaurant: body.restaurant,
    item: body.item,
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

    const cleanQuery = query.trim();

    await SearchAnalytics.create({
      searchTerm: cleanQuery,
    });

    const foodPrices = await FoodPrice.find({
      $or: [
        { restaurant: { $regex: cleanQuery, $options: 'i' } },
        { item: { $regex: cleanQuery, $options: 'i' } },
        { platform: { $regex: cleanQuery, $options: 'i' } },
      ],
    });

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
      .sort((firstResult, secondResult) => firstResult.finalPrice - secondResult.finalPrice);

    if (resultsWithPrices.length > 0) {
      resultsWithPrices[0].bestDeal = true;
    }

    res.json(resultsWithPrices);
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

    const cleanQuery = query.trim();
    const foodPrices = await FoodPrice.find({
      $or: [
        { restaurant: { $regex: cleanQuery, $options: 'i' } },
        { item: { $regex: cleanQuery, $options: 'i' } },
        { platform: { $regex: cleanQuery, $options: 'i' } },
      ],
    })
      .select('restaurant item platform')
      .limit(20);

    const suggestions = [
      ...new Set(
        foodPrices.flatMap((foodPrice) => [foodPrice.item, foodPrice.restaurant, foodPrice.platform])
      ),
    ]
      .filter((value) => value.toLowerCase().includes(cleanQuery.toLowerCase()))
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
