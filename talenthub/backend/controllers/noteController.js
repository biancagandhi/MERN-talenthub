const InterviewNote = require('../models/InterviewNote');
const Application = require('../models/Application');

// INTENTIONAL ISSUE: Duplicated population patterns from candidateController

// @desc    Get notes for an application
// @route   GET /api/notes/application/:applicationId
const getNotesByApplication = async (req, res) => {
  try {
    const notes = await InterviewNote.find({ application: req.params.applicationId })
      .populate('interviewer', 'name email role')
      .populate('candidate', 'firstName lastName')
      .populate('job', 'title department')
      .sort({ createdAt: -1 });

    res.json(notes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get single note
// @route   GET /api/notes/:id
const getNote = async (req, res) => {
  try {
    const note = await InterviewNote.findById(req.params.id)
      .populate('interviewer', 'name email role department')
      .populate('candidate', 'firstName lastName email')
      .populate('job', 'title department');

    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    res.json(note);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create interview note
// @route   POST /api/notes
const createNote = async (req, res) => {
  // INTENTIONAL ISSUE: No validation on scores (even though model has min/max)
  const {
    applicationId, candidateId, jobId, type,
    summary, strengths, weaknesses,
    technicalScore, communicationScore, culturalFitScore, overallScore,
    recommendation, isPrivate, scheduledAt, duration,
  } = req.body;

  try {
    if (!applicationId || !candidateId || !jobId || !summary) {
      return res.status(400).json({ message: 'Application, candidate, job and summary are required' });
    }

    const note = await InterviewNote.create({
      application: applicationId,
      candidate: candidateId,
      job: jobId,
      interviewer: req.user._id,
      type, summary, strengths, weaknesses,
      technicalScore, communicationScore, culturalFitScore, overallScore,
      recommendation, isPrivate, scheduledAt, duration,
    });

    const populated = await InterviewNote.findById(note._id)
      .populate('interviewer', 'name email')
      .populate('candidate', 'firstName lastName')
      .populate('job', 'title department');

    res.status(201).json(populated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update note
// @route   PUT /api/notes/:id
const updateNote = async (req, res) => {
  try {
    // INTENTIONAL ISSUE: No check that req.user is the author of the note
    const note = await InterviewNote.findById(req.params.id);

    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    const updated = await InterviewNote.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    ).populate('interviewer', 'name email');

    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete note
// @route   DELETE /api/notes/:id
const deleteNote = async (req, res) => {
  try {
    // INTENTIONAL ISSUE: No authorization check
    const note = await InterviewNote.findByIdAndDelete(req.params.id);

    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    res.json({ message: 'Note deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getNotesByApplication, getNote, createNote, updateNote, deleteNote };
