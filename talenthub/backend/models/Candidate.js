const mongoose = require('mongoose');

// INTENTIONAL ISSUE: No indexes on name, email, status, skills — all commonly queried fields
const candidateSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
    trim: true,
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  phone: {
    type: String,
    trim: true,
    default: '',
  },
  location: {
    city: { type: String, default: '' },
    state: { type: String, default: '' },
    country: { type: String, default: 'USA' },
  },
  currentTitle: {
    type: String,
    default: '',
  },
  currentCompany: {
    type: String,
    default: '',
  },
  experienceYears: {
    type: Number,
    default: 0,
    min: 0,
    max: 50,
  },
  skills: {
    type: [String],
    default: [],
  },
  education: {
    degree: { type: String, default: '' },
    field: { type: String, default: '' },
    institution: { type: String, default: '' },
    graduationYear: { type: Number },
  },
  resumeUrl: {
    type: String,
    default: '',
  },
  linkedinUrl: {
    type: String,
    default: '',
  },
  githubUrl: {
    type: String,
    default: '',
  },
  portfolioUrl: {
    type: String,
    default: '',
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'hired', 'rejected', 'blacklisted'],
    default: 'active',
  },
  source: {
    type: String,
    enum: ['linkedin', 'referral', 'website', 'job_board', 'agency', 'other'],
    default: 'other',
  },
  salary: {
    expected: { type: Number, default: 0 },
    current: { type: Number, default: 0 },
    currency: { type: String, default: 'USD' },
  },
  availability: {
    type: String,
    enum: ['immediate', '2_weeks', '1_month', '3_months', 'negotiable'],
    default: 'negotiable',
  },
  notes: {
    type: String,
    default: '',
  },
  tags: {
    type: [String],
    default: [],
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
});

// INTENTIONAL ISSUE: No compound text index for search, no index on status, skills, experienceYears

module.exports = mongoose.model('Candidate', candidateSchema);
