/*
  Run this script to migrate existing FoodPrice documents and populate
  `normalizedRestaurant` and `normalizedItem` fields.

  Usage:
    MONGO_URI="your-mongo-uri" node migrateAddNormalizedFields.js
*/
const connectDB = require('./db');
const mongoose = require('mongoose');
const FoodPrice = require('../models/FoodPrice');
const normalizeSearch = require('./normalizeSearch');

async function migrate() {
  try {
    await connectDB();

    const cursor = FoodPrice.find().cursor();
    let count = 0;

    for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
      const normalizedRestaurant = normalizeSearch(doc.restaurant);
      const normalizedItem = normalizeSearch(doc.item);

      let needsUpdate = false;
      if (doc.normalizedRestaurant !== normalizedRestaurant) {
        doc.normalizedRestaurant = normalizedRestaurant;
        needsUpdate = true;
      }
      if (doc.normalizedItem !== normalizedItem) {
        doc.normalizedItem = normalizedItem;
        needsUpdate = true;
      }

      if (needsUpdate) {
        await doc.save();
        count += 1;
      }
    }

    console.log(`Migration complete. Updated ${count} documents.`);
    mongoose.disconnect();
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

migrate();
