require('dotenv').config();
const connectDB = require('./utils/db');
const FoodPrice = require('./models/FoodPrice');
const normalizeSearch = require('./utils/normalizeSearch');

const platforms = ['Swiggy', 'Zomato', 'Magicpin'];

const combos = [
  { restaurant: "McDonald's", item: 'Chicken Burger' },
  { restaurant: "McDonald's", item: 'French Fries' },
  { restaurant: 'Burger King', item: 'Crispy Veg Burger' },
  { restaurant: "Domino's", item: 'Margherita Pizza' },
  { restaurant: 'Meghana Foods', item: 'Chicken Biryani' },
  { restaurant: 'KFC', item: 'Fried Chicken Combo' },
  { restaurant: 'Subway', item: 'Veggie Delite' },
  { restaurant: 'Pizza Hut', item: 'Cheese Pizza' },
  { restaurant: 'Starbucks', item: 'Latte' },
];

const makeRecord = (restaurant, item, platform, basePrice) => {
  const offerTypes = ['none', 'percentage', 'flat', 'freeDelivery'];
  const offerType = offerTypes[Math.floor(Math.random() * offerTypes.length)];
  const offerValue = offerType === 'percentage' ? Math.floor(Math.random() * 25) + 5 : offerType === 'flat' ? Math.floor(Math.random() * 60) + 10 : 0;
  const deliveryFee = Math.floor(Math.random() * 50);
  const packagingFee = Math.floor(Math.random() * 30);
  const rating = parseFloat((Math.random() * 1.3 + 3.7).toFixed(1));
  const eta = `${Math.floor(Math.random() * 30) + 20} mins`;
  const minOrder = Math.floor(Math.random() * 200);

  return {
    restaurant,
    normalizedRestaurant: normalizeSearch(restaurant),
    item,
    normalizedItem: normalizeSearch(item),
    platform,
    foodPrice: basePrice,
    deliveryFee,
    packagingFee,
    offerType,
    offerValue,
    minOrder,
    eta,
    rating,
  };
};

const generateSeed = () => {
  const records = [];

  combos.forEach((c, idx) => {
    // pick a base price varying by index
    const base = 100 + idx * 40;
    platforms.forEach((p, pi) => {
      // small variation per platform
      const price = Math.max(80, base + (pi - 1) * 10 + (Math.floor(Math.random() * 20) - 10));
      records.push(makeRecord(c.restaurant, c.item, p, price));
    });
  });

  // ensure duplicates of some popular items across platforms (extra safety)
  records.push(...platforms.map((p) => makeRecord("McDonald's", 'Chicken Burger', p, 189)));
  records.push(...platforms.map((p) => makeRecord("McDonald's", 'French Fries', p, 79)));

  return records;
};

const run = async () => {
  try {
    await connectDB();
    console.log('MongoDB connected');

    // Clear existing
    await FoodPrice.deleteMany({});

    const seedData = generateSeed();

    await FoodPrice.insertMany(seedData);

    console.log('Seed data inserted successfully');
    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  }
};

run();
