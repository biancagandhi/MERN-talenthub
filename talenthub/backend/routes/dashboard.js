const express = require('express');
const router = express.Router();
const { getDashboardStats, getHiringFunnel, getTopDepartments } = require('../controllers/dashboardController');
const { protect } = require('../middleware/auth');

router.get('/stats', protect, getDashboardStats);
router.get('/funnel', protect, getHiringFunnel);
router.get('/departments', protect, getTopDepartments);

module.exports = router;
