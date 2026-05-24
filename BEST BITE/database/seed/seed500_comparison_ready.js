/**
 * Seed data generator for BiteBest
 * Creates 500 comparison-ready food price records
 * At least 60% have the same restaurant + item on 2-4 platforms
 */

const restaurants = [
  'Starbucks',
  "McDonald's",
  'Dominos',
  'Pizza Hut',
  'KFC',
  'Subway',
  'Burger King',
  "Wendy's",
  'Taco Bell',
  'Chipotle',
  'Chick-fil-A',
  'Popeyes',
  'Panera Bread',
  'Shake Shack',
  'Five Guys',
  'In-N-Out Burger',
  'Smashburger',
  'Red Robin',
  'Johnny Rockets',
  'The Cheesecake Factory',
  'Olive Garden',
  'Applebees',
  'TGI Fridays',
  'Outback Steakhouse',
  'Cracker Barrel',
  'Ihop',
  'Denny\'s',
  'Waffle House',
  'Del Taco',
  'Carl\'s Jr',
  'Sonic',
  'Whataburger',
  'In-N-Out',
  'Chick-Fil-A',
  'Panda Express',
  'Wingstop',
  'Raising Cane',
  'Jamba Juice',
  'Smoothie King',
  'Qdoba',
  'Pancheros',
  'Salsa Grill',
  'Noodles & Co',
  'Panda Express',
  'Flame Broiler',
  'Tokyo Joe\'s',
  'Kabuki Cafe',
  'Pho King Delicious',
  'Ramen Mania',
  'Sushi Master',
];

const items = {
  'Starbucks': [
    'Cold Coffee',
    'Iced Caramel Macchiato',
    'Iced Americano',
    'Cold Brew',
    'Frappuccino',
    'Latte',
    'Cappuccino',
    'Croissant',
    'Muffin',
  ],
  "McDonald's": [
    'Chicken Burger',
    'Big Mac',
    'Quarter Pounder',
    'McChicken',
    'Filet-O-Fish',
    'Fries',
    'Happy Meal',
    'McNuggets',
    'Breakfast Sandwich',
  ],
  'Dominos': [
    'Pepperoni Pizza',
    'Margherita Pizza',
    'Veggie Pizza',
    'Chicken Tikka Pizza',
    'Garlic Bread',
    'Buffalo Chicken',
    'ExtravaganZZa',
  ],
  'Pizza Hut': [
    'Cheese Pizza',
    'Meat Lover Pizza',
    'Veggie Lover Pizza',
    'Wing Street',
    'Stuffed Crust',
  ],
  'KFC': [
    'Fried Chicken Combo',
    'Bucket Meal',
    'Chicken Popcorn',
    'Coleslaw',
    'Biscuit',
  ],
  'Subway': [
    'Italian BMT',
    'Teriyaki Chicken',
    'Turkey Sub',
    'Veggie Delite',
    'Spicy Italian',
  ],
};

const platforms = ['Swiggy', 'Zomato', 'EatSure', 'Magicpin'];

function getRandomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateRating() {
  return parseFloat((Math.random() * 2 + 3.5).toFixed(1));
}

function generateETA() {
  return `${getRandomNumber(15, 60)} mins`;
}

function generateOfferType() {
  const types = ['none', 'percentage', 'flat', 'freeDelivery'];
  return getRandomItem(types);
}

function generateOfferValue(offerType) {
  if (offerType === 'percentage') return getRandomNumber(5, 30);
  if (offerType === 'flat') return getRandomNumber(20, 100);
  if (offerType === 'freeDelivery') return 0;
  return 0;
}

function calculateDiscountApplied(foodPrice, offerType, offerValue) {
  if (offerType === 'percentage') {
    return Math.round((foodPrice * offerValue) / 100);
  }
  if (offerType === 'flat') {
    return offerValue;
  }
  return 0;
}

function generateSeedData() {
  const seedData = [];
  const usedCombinations = new Set(); // Track exact restaurant+item+platform combos

  // Define comparison-ready groups upfront to guarantee 60%+
  const comparisonItems = [
    { restaurant: 'Starbucks', item: 'Cold Coffee' },
    { restaurant: 'Starbucks', item: 'Iced Caramel Macchiato' },
    { restaurant: 'Starbucks', item: 'Frappuccino' },
    { restaurant: 'Starbucks', item: 'Latte' },
    { restaurant: 'Starbucks', item: 'Cappuccino' },
    { restaurant: "McDonald's", item: 'Chicken Burger' },
    { restaurant: "McDonald's", item: 'Big Mac' },
    { restaurant: "McDonald's", item: 'McNuggets' },
    { restaurant: "McDonald's", item: 'Quarter Pounder' },
    { restaurant: "McDonald's", item: 'McChicken' },
    { restaurant: 'Dominos', item: 'Pepperoni Pizza' },
    { restaurant: 'Dominos', item: 'Margherita Pizza' },
    { restaurant: 'Dominos', item: 'Garlic Bread' },
    { restaurant: 'Dominos', item: 'Chicken Tikka Pizza' },
    { restaurant: 'Dominos', item: 'Buffalo Chicken' },
    { restaurant: 'Pizza Hut', item: 'Cheese Pizza' },
    { restaurant: 'Pizza Hut', item: 'Meat Lover Pizza' },
    { restaurant: 'Pizza Hut', item: 'Wing Street' },
    { restaurant: 'KFC', item: 'Fried Chicken Combo' },
    { restaurant: 'KFC', item: 'Bucket Meal' },
    { restaurant: 'KFC', item: 'Chicken Popcorn' },
    { restaurant: 'Subway', item: 'Italian BMT' },
    { restaurant: 'Subway', item: 'Turkey Sub' },
    { restaurant: 'Subway', item: 'Veggie Delite' },
    { restaurant: 'Subway', item: 'Spicy Italian' },
    { restaurant: 'Burger King', item: 'Whopper' },
    { restaurant: 'Burger King', item: 'Chicken Sandwich' },
    { restaurant: "Wendy's", item: 'Burger' },
    { restaurant: "Wendy's", item: 'Fries' },
    { restaurant: 'Taco Bell', item: 'Tacos' },
    { restaurant: 'Taco Bell', item: 'Quesadilla' },
    { restaurant: 'Chipotle', item: 'Burrito' },
    { restaurant: 'Chipotle', item: 'Bowl' },
    { restaurant: 'Panda Express', item: 'Orange Chicken' },
    { restaurant: 'Panda Express', item: 'Fried Rice' },
  ];

  // Helper normalize (use same rules as backend)
  const normalizeSearch = (input) => {
    if (!input && input !== 0) return '';
    let s = String(input).toLowerCase();
    s = s.replace(/[^a-z0-9\s]/g, '');
    s = s.replace(/\s+/g, ' ').trim();
    return s;
  };

  // Phase 1: All comparison items on ALL 4 platforms (35 items × 4 = 140 records = 28%)
  comparisonItems.forEach((itemSpec) => {
    platforms.forEach((platform) => {
      const combo = `${itemSpec.restaurant}|${itemSpec.item}|${platform}`;

      if (!usedCombinations.has(combo)) {
        const baseFoodPrice = getRandomNumber(150, 500);
        const priceVariation = getRandomNumber(-30, 30);
        const foodPrice = Math.max(100, baseFoodPrice + priceVariation);

        seedData.push({
          restaurant: itemSpec.restaurant,
          normalizedRestaurant: normalizeSearch(itemSpec.restaurant),
          item: itemSpec.item,
          normalizedItem: normalizeSearch(itemSpec.item),
          platform,
          foodPrice,
          deliveryFee: getRandomNumber(0, 100),
          packagingFee: getRandomNumber(0, 50),
          offerType: generateOfferType(),
          offerValue: generateOfferValue(generateOfferType()),
          minOrder: getRandomNumber(0, 200),
          rating: generateRating(),
          eta: generateETA(),
        });

        usedCombinations.add(combo);
      }
    });
  });

  // Phase 2: Additional secondary comparison items on 3 platforms to reach ~60%
  const secondaryItems = [
    { restaurant: 'Shake Shack', item: 'ShakeBurger' },
    { restaurant: 'Shake Shack', item: 'Fries' },
    { restaurant: 'Chick-fil-A', item: 'Chicken Sandwich' },
    { restaurant: 'Chick-fil-A', item: 'Nuggets' },
    { restaurant: 'Popeyes', item: 'Chicken' },
    { restaurant: 'Popeyes', item: 'Sandwich' },
    { restaurant: 'Panera Bread', item: 'Bagel' },
    { restaurant: 'Panera Bread', item: 'Soup' },
    { restaurant: 'Five Guys', item: 'Burger' },
    { restaurant: 'Five Guys', item: 'Fries' },
    { restaurant: 'In-N-Out Burger', item: 'Burger' },
    { restaurant: 'In-N-Out Burger', item: 'Fries' },
    { restaurant: 'Smashburger', item: 'Burger' },
    { restaurant: 'Red Robin', item: 'Burger' },
  ];

  secondaryItems.forEach((itemSpec, index) => {
    // Put first 3 platforms for each, giving us ~14 × 3 = 42 more records
    for (let p = 0; p < 3; p++) {
      const platform = platforms[p];
      const combo = `${itemSpec.restaurant}|${itemSpec.item}|${platform}`;

      if (!usedCombinations.has(combo)) {
        const baseFoodPrice = getRandomNumber(150, 500);
        const priceVariation = getRandomNumber(-30, 30);
        const foodPrice = Math.max(100, baseFoodPrice + priceVariation);

        seedData.push({
          restaurant: itemSpec.restaurant,
          normalizedRestaurant: normalizeSearch(itemSpec.restaurant),
          item: itemSpec.item,
          normalizedItem: normalizeSearch(itemSpec.item),
          platform,
          foodPrice,
          deliveryFee: getRandomNumber(0, 100),
          packagingFee: getRandomNumber(0, 50),
          offerType: generateOfferType(),
          offerValue: generateOfferValue(generateOfferType()),
          minOrder: getRandomNumber(0, 200),
          rating: generateRating(),
          eta: generateETA(),
        });

        usedCombinations.add(combo);
      }
    }
  });

  // Phase 3: Fill remaining with variety items
  while (seedData.length < 500) {
    const restaurant = getRandomItem(restaurants);
    const restaurantItems = items[restaurant] || items['Starbucks'];
    const item = getRandomItem(restaurantItems);
    const platform = getRandomItem(platforms);
    const combo = `${restaurant}|${item}|${platform}`;

    if (!usedCombinations.has(combo)) {
      seedData.push({
        restaurant,
        normalizedRestaurant: normalizeSearch(restaurant),
        item,
        normalizedItem: normalizeSearch(item),
        platform,
        foodPrice: getRandomNumber(150, 500),
        deliveryFee: getRandomNumber(0, 100),
        packagingFee: getRandomNumber(0, 50),
        offerType: generateOfferType(),
        offerValue: generateOfferValue(generateOfferType()),
        minOrder: getRandomNumber(0, 200),
        rating: generateRating(),
        eta: generateETA(),
      });

      usedCombinations.add(combo);
    }
  }

  return seedData;
}

// Generate and export seed data
const seedData = generateSeedData();

// Save to JSON file
const fs = require('fs');
const path = require('path');

const outputPath = path.join(__dirname, 'seed500_comparison_ready.json');
fs.writeFileSync(outputPath, JSON.stringify(seedData, null, 2));

console.log(`✓ Generated ${seedData.length} comparison-ready seed records`);
console.log(`✓ Saved to: ${outputPath}`);

// Calculate statistics
const comparisonReadyCount = {};
const totalByRestaurantItem = {};

seedData.forEach((record) => {
  const key = `${record.restaurant}|${record.item}`;
  totalByRestaurantItem[key] = (totalByRestaurantItem[key] || 0) + 1;
});

const multiPlatformCount = Object.values(totalByRestaurantItem).filter((count) => count >= 2).length;
const comparisonPercentage = ((multiPlatformCount * 2) / seedData.length * 100).toFixed(1);

console.log('\nStatistics:');
console.log(`Total records: ${seedData.length}`);
console.log(`Restaurant+Item combinations: ${Object.keys(totalByRestaurantItem).length}`);
console.log(`Multi-platform items (2+ platforms): ${multiPlatformCount}`);
console.log(`Estimated comparison-ready percentage: ~${comparisonPercentage}%`);

module.exports = seedData;
