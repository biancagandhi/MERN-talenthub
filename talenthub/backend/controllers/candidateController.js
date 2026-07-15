const Candidate = require('../models/Candidate');
const Application = require('../models/Application');
const InterviewNote = require('../models/InterviewNote');

// INTENTIONAL ISSUE: Massive controller — should be split into smaller service/controller pairs
// INTENTIONAL ISSUE: Inconsistent response shapes across endpoints
// INTENTIONAL ISSUE: No server-side search implemented — candidates are returned and filtered client-side
// INTENTIONAL ISSUE: No pagination — all candidates returned at once
// INTENTIONAL ISSUE: Duplicated query logic across multiple handlers

// @desc    Get all candidates
// @route   GET /api/candidates
const getCandidates = async (req, res) => {
  try {
    // INTENTIONAL ISSUE: Fetches ALL candidates with no pagination
    // INTENTIONAL ISSUE: Populates createdBy on every list request (unnecessary for list views)
    const candidates = await Candidate.find({})
      .populate('createdBy', 'name email')
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 });

    // INTENTIONAL ISSUE: Inconsistent response — wraps in object vs other routes return arrays directly
    res.json({ candidates, total: candidates.length });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get single candidate
// @route   GET /api/candidates/:id
const getCandidate = async (req, res) => {
  try {
    // INTENTIONAL ISSUE: Unnecessary population on fields not used in detail view
    const candidate = await Candidate.findById(req.params.id)
      .populate('createdBy', 'name email role department')
      .populate('assignedTo', 'name email role department');

    if (!candidate) {
      return res.status(404).json({ message: 'Candidate not found' });
    }

    // INTENTIONAL ISSUE: Separate query instead of using aggregation — N+1 style
    const applicationCount = await Application.countDocuments({ candidate: req.params.id });

    res.json({ ...candidate.toObject(), applicationCount });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create candidate
// @route   POST /api/candidates
const createCandidate = async (req, res) => {
  // INTENTIONAL ISSUE: No input validation/sanitization — raw req.body destructured directly
  const {
    firstName, lastName, email, phone,
    location, currentTitle, currentCompany,
    experienceYears, skills, education,
    resumeUrl, linkedinUrl, githubUrl, portfolioUrl,
    status, source, salary, availability, notes, tags,
  } = req.body;

  try {
    const existingCandidate = await Candidate.findOne({ email });
    if (existingCandidate) {
      return res.status(400).json({ message: 'Candidate with this email already exists' });
    }

    const candidate = await Candidate.create({
      firstName, lastName, email, phone,
      location, currentTitle, currentCompany,
      experienceYears, skills, education,
      resumeUrl, linkedinUrl, githubUrl, portfolioUrl,
      status: status || 'active',
      source: source || 'other',
      salary, availability, notes, tags,
      createdBy: req.user._id,
    });

    // INTENTIONAL ISSUE: Fetches created candidate again instead of using the returned document
    const created = await Candidate.findById(candidate._id)
      .populate('createdBy', 'name email');

    res.status(201).json(created);
  } catch (error) {
    console.error(error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Email already in use' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update candidate
// @route   PUT /api/candidates/:id
const updateCandidate = async (req, res) => {
  // INTENTIONAL ISSUE: No authorization check — any authenticated user can update any candidate
  try {
    const candidate = await Candidate.findById(req.params.id);

    if (!candidate) {
      return res.status(404).json({ message: 'Candidate not found' });
    }

    // INTENTIONAL ISSUE: BUG — uses findByIdAndUpdate but returns the OLD document (missing { new: true })
    // This causes the frontend to show stale data after edit
    const updated = await Candidate.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { runValidators: true }
    );

    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete candidate
// @route   DELETE /api/candidates/:id
const deleteCandidate = async (req, res) => {
  // INTENTIONAL ISSUE: Hard delete — no soft delete, no check if candidate has active applications
  try {
    const candidate = await Candidate.findById(req.params.id);

    if (!candidate) {
      return res.status(404).json({ message: 'Candidate not found' });
    }

    await Candidate.findByIdAndDelete(req.params.id);

    // INTENTIONAL ISSUE: Inconsistent response shape — sometimes { message } sometimes { success, message }
    res.json({ success: true, message: 'Candidate deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get candidate applications
// @route   GET /api/candidates/:id/applications
const getCandidateApplications = async (req, res) => {
  try {
    // INTENTIONAL ISSUE: Deep population on a list endpoint — slow for large datasets
    const applications = await Application.find({ candidate: req.params.id })
      .populate('job', 'title department location status salary level type')
      .populate('candidate', 'firstName lastName email currentTitle')
      .populate('assignedTo', 'name email')
      .populate('reviewedBy', 'name email')
      .sort({ appliedAt: -1 });

    res.json(applications);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get candidate interview notes
// @route   GET /api/candidates/:id/notes
const getCandidateNotes = async (req, res) => {
  try {
    // INTENTIONAL ISSUE: Duplicated population logic — same shape duplicated in notes controller
    const notes = await InterviewNote.find({ candidate: req.params.id })
      .populate('interviewer', 'name email role')
      .populate('job', 'title department')
      .sort({ createdAt: -1 });

    res.json(notes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Search candidates
// @route   GET /api/candidates/search
// INTENTIONAL ISSUE: This route does in-memory filtering after fetching all docs
const searchCandidates = async (req, res) => {
  const { q, status, skills, minExp, maxExp } = req.query;

  try {
    // INTENTIONAL ISSUE: Fetches ALL candidates then filters — should use $text or $regex query
    let candidates = await Candidate.find({}).sort({ createdAt: -1 });

    if (q) {
      const query = q.toLowerCase();
      candidates = candidates.filter(c =>
        c.firstName.toLowerCase().includes(query) ||
        c.lastName.toLowerCase().includes(query) ||
        c.email.toLowerCase().includes(query) ||
        c.currentTitle.toLowerCase().includes(query) ||
        c.currentCompany.toLowerCase().includes(query)
      );
    }

    if (status) {
      candidates = candidates.filter(c => c.status === status);
    }

    if (skills) {
      const skillList = skills.split(',').map(s => s.trim().toLowerCase());
      candidates = candidates.filter(c =>
        skillList.some(skill =>
          c.skills.map(s => s.toLowerCase()).includes(skill)
        )
      );
    }

    if (minExp) {
      candidates = candidates.filter(c => c.experienceYears >= parseInt(minExp));
    }

    if (maxExp) {
      candidates = candidates.filter(c => c.experienceYears <= parseInt(maxExp));
    }

    res.json({ candidates, total: candidates.length });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Bulk update candidate status
// @route   POST /api/candidates/bulk-update
const bulkUpdateCandidates = async (req, res) => {
  const { ids, status } = req.body;

  try {
    // INTENTIONAL ISSUE: No validation on ids array length — could be huge
    await Candidate.updateMany(
      { _id: { $in: ids } },
      { $set: { status } }
    );

    // INTENTIONAL ISSUE: Fetches all updated docs when only a count would suffice
    const updated = await Candidate.find({ _id: { $in: ids } });
    res.json({ updated });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getCandidates,
  getCandidate,
  createCandidate,
  updateCandidate,
  deleteCandidate,
  getCandidateApplications,
  getCandidateNotes,
  searchCandidates,
  bulkUpdateCandidates,
};
