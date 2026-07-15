const express = require('express');
const router = express.Router();
const {
  getApplications,
  getApplication,
  createApplication,
  updateApplicationStatus,
  updateApplication,
  deleteApplication,
} = require('../controllers/applicationController');
const { protect } = require('../middleware/auth');

router.get('/', protect, getApplications);
router.post('/', protect, createApplication);

router.get('/:id', protect, getApplication);
router.put('/:id', protect, updateApplication);
router.delete('/:id', protect, deleteApplication);

router.patch('/:id/status', protect, updateApplicationStatus);

module.exports = router;
