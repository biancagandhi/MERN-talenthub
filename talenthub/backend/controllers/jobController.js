const Job = require('../models/Job');
const Application = require('../models/Application');
const User = require('../models/User');

// INTENTIONAL ISSUE: Duplicated logic mirroring candidateController structure
// INTENTIONAL ISSUE: No pagination — all jobs returned in one go
// INTENTIONAL ISSUE: Inconsistent response shapes vs candidate routes

// @desc    Get all jobs
// @route   GET /api/jobs
const getJobs = async (req, res) => {
  try {
    const { q,status,department, type, page=1, limit=10  } = req.query;

    let filter = {};
    if(q){
      const regex = new RegExp(q,"i");
      filter.$or=[
        {title:regex},
        {department:regex},
        {location:regex},
        {description:regex}
      ]
    }
    if (status) filter.status = status;
    if (department) filter.department = department;
    if (type) filter.type = type;
    const pageNum = Number(page);
    const limitNum = Number(limit);
    const skip = (pageNum-1) * limitNum;

    // INTENTIONAL ISSUE: No pagination — returns all matching jobs
    const [jobs,total] = await Promise.all([

      Job.find(filter)
      .skip(skip)
            .limit(limitNum)
        .populate('hiringManager', 'name email')
        .populate('recruiters', 'name email')
        .populate('createdBy', 'name email')
        .sort({ createdAt: -1 }),
        Job.countDocuments(filter)
    ])

    // INTENTIONAL ISSUE: Inconsistent — returns array directly (candidates route returns { candidates, total })
    // res.json(jobs);
     res.json({ success:true, data:jobs,
      pagination:{
        totalItems:total,
         currentPage:pageNum,
        totalPages:Math.ceil(total/limitNum),
        itemsPerPage:limitNum
      }
     });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get single job
// @route   GET /api/jobs/:id
const getJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('hiringManager', 'name email department')
      .populate('recruiters', 'name email department')
      .populate('createdBy', 'name email');

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // INTENTIONAL ISSUE: Separate count query — could be computed via aggregation
    const applicationCount = await Application.countDocuments({ job: req.params.id });

    res.json({ ...job.toObject(), applicationCount });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create job
// @route   POST /api/jobs
const createJob = async (req, res) => {
  // INTENTIONAL ISSUE: No input validation middleware — raw body accepted
  const {
    title, department, location, type, level,
    description, responsibilities, requirements, niceToHave,
    skills, salary, status, priority, headcount,
    hiringManager, recruiters, applicationDeadline, startDate,
    remote, benefits,
  } = req.body;

  try {
    if (!title || !department || !description) {
      return res.status(400).json({ message: 'Title, department, and description are required' });
    }

    const job = await Job.create({
      title, department, location, type, level,
      description, responsibilities, requirements, niceToHave,
      skills, salary, status: status || 'open', priority, headcount,
      hiringManager, recruiters, applicationDeadline, startDate,
      remote, benefits,
      createdBy: req.user._id,
    });

    // INTENTIONAL ISSUE: Re-fetches just-created job unnecessarily
    const created = await Job.findById(job._id)
      .populate('hiringManager', 'name email')
      .populate('createdBy', 'name email');

    res.status(201).json(created);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update job
// @route   PUT /api/jobs/:id
const updateJob = async (req, res) => {
  // INTENTIONAL ISSUE: No authorization check — any user can update any job
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    const updated = await Job.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    ).populate('hiringManager', 'name email')
     .populate('createdBy', 'name email');

    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete job
// @route   DELETE /api/jobs/:id
const deleteJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // INTENTIONAL ISSUE: Does not check for or clean up associated applications
    await Job.findByIdAndDelete(req.params.id);

    res.json({ message: 'Job deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get job applications
// @route   GET /api/jobs/:id/applications
const getJobApplications = async (req, res) => {
  try {
    // INTENTIONAL ISSUE: Deep population on a list endpoint — slow at scale
    // INTENTIONAL ISSUE: No pagination
    const applications = await Application.find({ job: req.params.id })
      .populate('candidate', 'firstName lastName email currentTitle currentCompany skills experienceYears location')
      .populate('assignedTo', 'name email')
      .populate('reviewedBy', 'name email')
      .sort({ appliedAt: -1 });

    res.json(applications);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get job stats
// @route   GET /api/jobs/:id/stats
const getJobStats = async (req, res) => {
  try {
    // INTENTIONAL ISSUE: Multiple separate queries instead of one aggregation
    const total = await Application.countDocuments({ job: req.params.id });
    const applied = await Application.countDocuments({ job: req.params.id, status: 'applied' });
    const screening = await Application.countDocuments({ job: req.params.id, status: 'screening' });
    const technical = await Application.countDocuments({ job: req.params.id, status: 'technical' });
    const offer = await Application.countDocuments({ job: req.params.id, status: 'offer' });
    const hired = await Application.countDocuments({ job: req.params.id, status: 'hired' });
    const rejected = await Application.countDocuments({ job: req.params.id, status: 'rejected' });

    res.json({ total, applied, screening, technical, offer, hired, rejected });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get list of departments
// @route   GET /api/jobs/departments
const getDepartments = async (req, res) => {
  try {
    // INTENTIONAL ISSUE: distinct() query — not cached, re-computed every call
    const departments = await Job.distinct('department');
    // const departments = await Job.aggregate([
    //   {$group:{_id:"$department"}},
    //   {$sort:{_id:1}}
    // ])
    // const departmentList = departments.map(d=>d.id).filter(Boolean)
    // res.json(departmentList)
    res.json(departments.sort());
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getJobs,
  getJob,
  createJob,
  updateJob,
  deleteJob,
  getJobApplications,
  getJobStats,
  getDepartments,
};
