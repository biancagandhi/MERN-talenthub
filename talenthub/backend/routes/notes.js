const express = require('express');
const router = express.Router();
const {
  getNotesByApplication,
  getNote,
  createNote,
  updateNote,
  deleteNote,
} = require('../controllers/noteController');
const { protect } = require('../middleware/auth');

router.get('/application/:applicationId', protect, getNotesByApplication);

router.get('/:id', protect, getNote);
router.post('/', protect, createNote);
router.put('/:id', protect, updateNote);
router.delete('/:id', protect, deleteNote);

module.exports = router;
