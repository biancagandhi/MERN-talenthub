const mongoose = require('mongoose');

// INTENTIONAL ISSUE: No index on application or candidate for fast lookups
const interviewNoteSchema = new mongoose.Schema({
  application: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Application',
    required: true,
  },
  candidate: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Candidate',
    required: true,
  },
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true,
  },
  interviewer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  type: {
    type: String,
    enum: ['phone_screen', 'technical', 'cultural_fit', 'final', 'reference', 'general'],
    default: 'general',
  },
  summary: {
    type: String,
    required: true,
  },
  strengths: {
    type: [String],
    default: [],
  },
  weaknesses: {
    type: [String],
    default: [],
  },
  technicalScore: {
    type: Number,
    min: 1,
    max: 10,
  },
  communicationScore: {
    type: Number,
    min: 1,
    max: 10,
  },
  culturalFitScore: {
    type: Number,
    min: 1,
    max: 10,
  },
  overallScore: {
    type: Number,
    min: 1,
    max: 10,
  },
  recommendation: {
    type: String,
    enum: ['strong_yes', 'yes', 'neutral', 'no', 'strong_no'],
  },
  isPrivate: {
    type: Boolean,
    default: false,
  },
  scheduledAt: {
    type: Date,
  },
  duration: {
    type: Number, // in minutes
    default: 60,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('InterviewNote', interviewNoteSchema);
