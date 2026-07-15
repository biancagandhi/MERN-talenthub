const express = require('express');
const router = express.Router();
const {
  getCandidates,
  getCandidate,
  createCandidate,
  updateCandidate,
  deleteCandidate,
  getCandidateApplications,
  getCandidateNotes,
  searchCandidates,
  bulkUpdateCandidates,
} = require('../controllers/candidateController');
const { protect } = require('../middleware/auth');

// INTENTIONAL ISSUE: protect applied to each route individually instead of router.use(protect)
router.get('/search', protect, searchCandidates);
router.post('/bulk-update', protect, bulkUpdateCandidates);

router.get('/', protect, getCandidates);
router.post('/', protect, createCandidate);

router.get('/:id', protect, getCandidate);
router.put('/:id', protect, updateCandidate);
router.delete('/:id', protect, deleteCandidate);

router.get('/:id/applications', protect, getCandidateApplications);
router.get('/:id/notes', protect, getCandidateNotes);

module.exports = router;
