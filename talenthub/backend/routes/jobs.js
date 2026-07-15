const express = require('express');
const router = express.Router();
const {
  getJobs,
  getJob,
  createJob,
  updateJob,
  deleteJob,
  getJobApplications,
  getJobStats,
  getDepartments,
} = require('../controllers/jobController');
const { protect } = require('../middleware/auth');

router.get('/departments', protect, getDepartments);

router.get('/', protect, getJobs);
router.post('/', protect, createJob);

router.get('/:id', protect, getJob);
router.put('/:id', protect, updateJob);
router.delete('/:id', protect, deleteJob);

router.get('/:id/applications', protect, getJobApplications);
router.get('/:id/stats', protect, getJobStats);

module.exports = router;
