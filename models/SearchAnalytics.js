const mongoose = require('mongoose');

const searchAnalyticsSchema = new mongoose.Schema(
  {
    searchTerm: {
      type: String,
      required: true,
      trim: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    collection: 'searchanalytics',
  }
);

module.exports = mongoose.model('SearchAnalytics', searchAnalyticsSchema);
