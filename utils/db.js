const mongoose = require('mongoose');

const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    throw new Error('Please set MONGO_URI to your MongoDB Atlas connection string');
  }

  await mongoose.connect(mongoUri);

  console.log(`MongoDB connected to database: ${mongoose.connection.name}`);
};

module.exports = connectDB;
