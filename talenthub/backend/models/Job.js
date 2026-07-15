const mongoose = require('mongoose');

// INTENTIONAL ISSUE: No indexes on department, status, or createdAt
const jobSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  department: {
    type: String,
    required: true,
    trim: true,
  },
  location: {
    type: String,
    default: 'Remote',
  },
  type: {
    type: String,
    enum: ['full-time', 'part-time', 'contract', 'internship', 'freelance'],
    default: 'full-time',
  },
  level: {
    type: String,
    enum: ['intern', 'junior', 'mid', 'senior', 'lead', 'principal', 'director', 'vp'],
    default: 'mid',
  },
  description: {
    type: String,
    required: true,
  },
  responsibilities: {
    type: [String],
    default: [],
  },
  requirements: {
    type: [String],
    default: [],
  },
  niceToHave: {
    type: [String],
    default: [],
  },
  skills: {
    type: [String],
    default: [],
  },
  salary: {
    min: { type: Number, default: 0 },
    max: { type: Number, default: 0 },
    currency: { type: String, default: 'USD' },
    isPublic: { type: Boolean, default: true },
  },
  status: {
    type: String,
    enum: ['draft', 'open', 'paused', 'closed', 'filled'],
    default: 'open',
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
  },
  headcount: {
    type: Number,
    default: 1,
    min: 1,
  },
  hiringManager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  recruiters: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  applicationDeadline: {
    type: Date,
  },
  startDate: {
    type: Date,
  },
  remote: {
    type: Boolean,
    default: false,
  },
  benefits: {
    type: [String],
    default: [],
  },
  applicationCount: {
    type: Number,
    default: 0,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Job', jobSchema);
