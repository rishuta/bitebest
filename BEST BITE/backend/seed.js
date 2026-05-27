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

  const southIndianRecords = [
    {
      restaurant: 'CTR',
      item: 'Masala Dosa',
      prices: {
        Swiggy: { foodPrice: 95, deliveryFee: 22, packagingFee: 8, offerType: 'flat', offerValue: 15, minOrder: 80, eta: '24 mins', rating: 4.7 },
        Zomato: { foodPrice: 105, deliveryFee: 18, packagingFee: 10, offerType: 'none', offerValue: 0, minOrder: 80, eta: '28 mins', rating: 4.6 },
        Magicpin: { foodPrice: 90, deliveryFee: 20, packagingFee: 7, offerType: 'percentage', offerValue: 10, minOrder: 80, eta: '26 mins', rating: 4.8 },
      },
    },
    {
      restaurant: 'MTR',
      item: 'Plain Dosa',
      prices: {
        Swiggy: { foodPrice: 80, deliveryFee: 20, packagingFee: 8, offerType: 'none', offerValue: 0, minOrder: 70, eta: '25 mins', rating: 4.5 },
        Zomato: { foodPrice: 85, deliveryFee: 24, packagingFee: 9, offerType: 'flat', offerValue: 10, minOrder: 70, eta: '29 mins', rating: 4.6 },
        Magicpin: { foodPrice: 78, deliveryFee: 18, packagingFee: 7, offerType: 'percentage', offerValue: 8, minOrder: 70, eta: '27 mins', rating: 4.4 },
      },
    },
    {
      restaurant: 'A2B',
      item: 'Idli Vada Combo',
      prices: {
        Swiggy: { foodPrice: 110, deliveryFee: 25, packagingFee: 10, offerType: 'flat', offerValue: 20, minOrder: 100, eta: '30 mins', rating: 4.3 },
        Zomato: { foodPrice: 115, deliveryFee: 22, packagingFee: 12, offerType: 'none', offerValue: 0, minOrder: 100, eta: '32 mins', rating: 4.4 },
        Magicpin: { foodPrice: 105, deliveryFee: 20, packagingFee: 9, offerType: 'percentage', offerValue: 10, minOrder: 100, eta: '28 mins', rating: 4.5 },
      },
    },
    {
      restaurant: 'Udupi Grand',
      item: 'Medu Vada',
      prices: {
        Swiggy: { foodPrice: 70, deliveryFee: 18, packagingFee: 6, offerType: 'none', offerValue: 0, minOrder: 60, eta: '22 mins', rating: 4.2 },
        Zomato: { foodPrice: 75, deliveryFee: 20, packagingFee: 7, offerType: 'flat', offerValue: 8, minOrder: 60, eta: '26 mins', rating: 4.3 },
        Magicpin: { foodPrice: 68, deliveryFee: 16, packagingFee: 6, offerType: 'percentage', offerValue: 5, minOrder: 60, eta: '24 mins', rating: 4.4 },
      },
    },
  ];

  southIndianRecords.forEach(({ restaurant, item, prices }) => {
    platforms.forEach((platform) => {
      const platformRecord = prices[platform];

      records.push({
        restaurant,
        normalizedRestaurant: normalizeSearch(restaurant),
        item,
        normalizedItem: normalizeSearch(item),
        platform,
        foodPrice: platformRecord.foodPrice,
        deliveryFee: platformRecord.deliveryFee,
        packagingFee: platformRecord.packagingFee,
        offerType: platformRecord.offerType,
        offerValue: platformRecord.offerValue,
        minOrder: platformRecord.minOrder,
        eta: platformRecord.eta,
        rating: platformRecord.rating,
      });
    });
  });

  // Add Chicken Shawarma records with exact specifications
  records.push({
    restaurant: 'Shawarma House',
    normalizedRestaurant: normalizeSearch('Shawarma House'),
    item: 'Chicken Shawarma',
    normalizedItem: normalizeSearch('Chicken Shawarma'),
    platform: 'Swiggy',
    foodPrice: 120,
    deliveryFee: 25,
    packagingFee: 10,
    offerType: 'flat',
    offerValue: 20,
    minOrder: 100,
    eta: '28 mins',
    rating: 4.4,
  });

  records.push({
    restaurant: 'Shawarma House',
    normalizedRestaurant: normalizeSearch('Shawarma House'),
    item: 'Chicken Shawarma',
    normalizedItem: normalizeSearch('Chicken Shawarma'),
    platform: 'Zomato',
    foodPrice: 125,
    deliveryFee: 30,
    packagingFee: 10,
    offerType: 'none',
    offerValue: 0,
    minOrder: 100,
    eta: '32 mins',
    rating: 4.2,
  });

  records.push({
    restaurant: 'Shawarma House',
    normalizedRestaurant: normalizeSearch('Shawarma House'),
    item: 'Chicken Shawarma',
    normalizedItem: normalizeSearch('Chicken Shawarma'),
    platform: 'Magicpin',
    foodPrice: 115,
    deliveryFee: 20,
    packagingFee: 8,
    offerType: 'percentage',
    offerValue: 10,
    minOrder: 100,
    eta: '25 mins',
    rating: 4.5,
  });

  return records;
};

const run = async () => {
  try {
    await connectDB();
    console.log('MongoDB connected');

    const seedData = generateSeed();

    const upsertOperations = seedData.map((record) => ({
      updateOne: {
        filter: {
          restaurant: record.restaurant,
          item: record.item,
          platform: record.platform,
        },
        update: {
          $set: {
            ...record,
            normalizedRestaurant: normalizeSearch(record.restaurant),
            normalizedItem: normalizeSearch(record.item),
            lastUpdated: new Date(),
          },
        },
        upsert: true,
      },
    }));

    const result = await FoodPrice.bulkWrite(upsertOperations);

    console.log(
      `Seed data upserted successfully: ${result.upsertedCount || 0} inserted, ${result.modifiedCount || 0} updated`
    );
    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  }
};

run();
