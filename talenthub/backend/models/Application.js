const mongoose = require('mongoose');

// INTENTIONAL ISSUE: No compound index on (candidate, job), no index on status or stage
const applicationSchema = new mongoose.Schema({
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
  status: {
    type: String,
    enum: [
      'applied',
      'screening',
      'phone_screen',
      'technical',
      'onsite',
      'offer',
      'hired',
      'rejected',
      'withdrawn',
    ],
    default: 'applied',
  },
  stage: {
    type: String,
    enum: [
      'new',
      'in_review',
      'shortlisted',
      'interviewing',
      'offer_extended',
      'closed',
    ],
    default: 'new',
  },
  appliedAt: {
    type: Date,
    default: Date.now,
  },
  source: {
    type: String,
    enum: ['linkedin', 'referral', 'website', 'job_board', 'agency', 'other'],
    default: 'other',
  },
  coverLetter: {
    type: String,
    default: '',
  },
  resumeSnapshot: {
    type: String,
    default: '',
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
  },
  feedback: {
    type: String,
    default: '',
  },
  rejectionReason: {
    type: String,
    default: '',
  },
  salaryExpectation: {
    type: Number,
  },
  offerAmount: {
    type: Number,
  },
  offerDate: {
    type: Date,
  },
  startDate: {
    type: Date,
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  timeline: [{
    status: String,
    changedAt: { type: Date, default: Date.now },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    note: String,
  }],
  isArchived: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

// INTENTIONAL ISSUE: Missing compound unique index on candidate+job to prevent duplicate applications
// Should be: applicationSchema.index({ candidate: 1, job: 1 }, { unique: true });

module.exports = mongoose.model('Application', applicationSchema);
