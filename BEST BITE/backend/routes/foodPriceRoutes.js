const express = require('express');
const {
  getFoodPrices,
  searchFoodPrices,
  getSearchSuggestions,
  createFoodPrice,
  updateFoodPrice,
  deleteFoodPrice,
} = require('../controllers/foodPriceController');
const protectAdminRoute = require('../middleware/adminAuth');

const router = express.Router();

router.get('/', getFoodPrices);
router.get('/search', searchFoodPrices);
router.get('/suggestions', getSearchSuggestions);
router.post('/', protectAdminRoute, createFoodPrice);
router.put('/:id', protectAdminRoute, updateFoodPrice);
router.delete('/:id', protectAdminRoute, deleteFoodPrice);

module.exports = router;
