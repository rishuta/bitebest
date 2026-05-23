const SearchAnalytics = require('../models/SearchAnalytics');

const getTopSearches = async (req, res, next) => {
  try {
    const limit = Number(req.query.limit) || 5;

    const topSearches = await SearchAnalytics.aggregate([
      {
        $group: {
          _id: { $toLower: '$searchTerm' },
          searchTerm: { $first: '$searchTerm' },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1, searchTerm: 1 } },
      { $limit: limit },
      {
        $project: {
          _id: 0,
          searchTerm: 1,
          count: 1,
        },
      },
    ]);

    res.json(topSearches);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTopSearches,
};
