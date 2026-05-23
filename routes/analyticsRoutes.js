const express = require('express');
const { getTopSearches } = require('../controllers/analyticsController');
const protectAdminRoute = require('../middleware/adminAuth');

const router = express.Router();

router.get('/top-searches', protectAdminRoute, getTopSearches);

module.exports = router;
