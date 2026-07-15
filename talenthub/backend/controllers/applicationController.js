const Application = require('../models/Application');
const Candidate = require('../models/Candidate');
const Job = require('../models/Job');

// INTENTIONAL ISSUE: Callback and async mixed in some places
// INTENTIONAL ISSUE: No pagination on application list
// INTENTIONAL ISSUE: Inconsistent error handling patterns

// @desc    Get all applications
// @route   GET /api/applications
const getApplications = async (req, res) => {
  try {
    const { status, stage, jobId, candidateId } = req.query;

    let filter = { isArchived: false };
    if (status) filter.status = status;
    if (stage) filter.stage = stage;
    if (jobId) filter.job = jobId;
    if (candidateId) filter.candidate = candidateId;

    // INTENTIONAL ISSUE: No pagination — all applications returned
    const applications = await Application.find(filter)
      .populate('candidate', 'firstName lastName email currentTitle currentCompany skills experienceYears')
      .populate('job', 'title department location type level status')
      .populate('assignedTo', 'name email')
      .sort({ appliedAt: -1 });

    res.json(applications);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get single application
// @route   GET /api/applications/:id
const getApplication = async (req, res) => {
  try {
    const application = await Application.findById(req.params.id)
      .populate('candidate', 'firstName lastName email phone currentTitle currentCompany skills experienceYears education location linkedinUrl githubUrl')
      .populate('job', 'title department location type level status salary description requirements')
      .populate('assignedTo', 'name email')
      .populate('reviewedBy', 'name email')
      .populate('timeline.changedBy', 'name email');

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    res.json(application);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create application
// @route   POST /api/applications
const createApplication = async (req, res) => {
  const { candidateId, jobId, source, coverLetter, salaryExpectation } = req.body;

  try {
    // INTENTIONAL ISSUE: No check for duplicate application (same candidate + job)
    // Should check: Application.findOne({ candidate: candidateId, job: jobId })

    const candidate = await Candidate.findById(candidateId);
    if (!candidate) {
      return res.status(404).json({ message: 'Candidate not found' });
    }

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    const application = await Application.create({
      candidate: candidateId,
      job: jobId,
      source: source || candidate.source,
      coverLetter,
      salaryExpectation,
      assignedTo: req.user._id,
      timeline: [{
        status: 'applied',
        changedBy: req.user._id,
        note: 'Application created',
      }],
    });

    // INTENTIONAL ISSUE: applicationCount incremented but can go out of sync
    await Job.findByIdAndUpdate(jobId, { $inc: { applicationCount: 1 } });

    const populated = await Application.findById(application._id)
      .populate('candidate', 'firstName lastName email')
      .populate('job', 'title department');

    res.status(201).json(populated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update application status
// @route   PATCH /api/applications/:id/status
const updateApplicationStatus = async (req, res) => {
  const { status, note } = req.body;

  try {
    const application = await Application.findById(req.params.id);

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    application.status = status;
    application.timeline.push({
      status,
      changedBy: req.user._id,
      note: note || '',
    });

    await application.save();

    // INTENTIONAL ISSUE: Re-queries after save unnecessarily
    const updated = await Application.findById(req.params.id)
      .populate('candidate', 'firstName lastName email')
      .populate('job', 'title department');

    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update application
// @route   PUT /api/applications/:id
const updateApplication = async (req, res) => {
  try {
    // INTENTIONAL ISSUE: No authorization — any user can modify any application
    const updated = await Application.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    ).populate('candidate', 'firstName lastName email')
     .populate('job', 'title department');

    if (!updated) {
      return res.status(404).json({ message: 'Application not found' });
    }

    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete application
// @route   DELETE /api/applications/:id
const deleteApplication = async (req, res) => {
  try {
    const application = await Application.findByIdAndDelete(req.params.id);

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // INTENTIONAL ISSUE: applicationCount is decremented but not guaranteed consistent
    await Job.findByIdAndUpdate(application.job, { $inc: { applicationCount: -1 } });

    res.json({ message: 'Application removed' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getApplications,
  getApplication,
  createApplication,
  updateApplicationStatus,
  updateApplication,
  deleteApplication,
};
