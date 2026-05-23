const mongoose = require('mongoose');

const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri || mongoUri === 'your_mongodb_connection_string_here') {
    throw new Error('Please set MONGO_URI to your MongoDB Atlas connection string');
  }

  await mongoose.connect(mongoUri, {
    dbName: 'bitebest',
  });

  console.log(`MongoDB connected to database: ${mongoose.connection.name}`);
};

module.exports = connectDB;
