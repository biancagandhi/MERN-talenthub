const Candidate = require('../models/Candidate');
const Job = require('../models/Job');
const Application = require('../models/Application');

// INTENTIONAL ISSUE: Dashboard stats use 10+ separate queries instead of aggregation pipelines
// This is extremely slow under load — should use Promise.all at minimum, ideally aggregations

// @desc    Get dashboard stats
// @route   GET /api/dashboard/stats
const getDashboardStats = async (req, res) => {
  try {
    // INTENTIONAL ISSUE: Sequential awaits — not parallelized
    const totalCandidates = await Candidate.countDocuments({});
    const activeCandidates = await Candidate.countDocuments({ status: 'active' });
    const hiredCandidates = await Candidate.countDocuments({ status: 'hired' });

    const totalJobs = await Job.countDocuments({});
    const openJobs = await Job.countDocuments({ status: 'open' });
    const closedJobs = await Job.countDocuments({ status: 'closed' });
    const filledJobs = await Job.countDocuments({ status: 'filled' });

    const totalApplications = await Application.countDocuments({});
    const newApplications = await Application.countDocuments({ status: 'applied' });
    const inReview = await Application.countDocuments({ status: 'screening' });
    const offers = await Application.countDocuments({ status: 'offer' });
    const hiredApplications = await Application.countDocuments({ status: 'hired' });
    const rejected = await Application.countDocuments({ status: 'rejected' });

    // INTENTIONAL ISSUE: Fetches recent applications with full population — overkill for a stat card
    const recentApplications = await Application.find({})
      .populate('candidate', 'firstName lastName email currentTitle')
      .populate('job', 'title department')
      .sort({ appliedAt: -1 })
      .limit(10);

    const recentCandidates = await Candidate.find({})
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      candidates: {
        total: totalCandidates,
        active: activeCandidates,
        hired: hiredCandidates,
      },
      jobs: {
        total: totalJobs,
        open: openJobs,
        closed: closedJobs,
        filled: filledJobs,
      },
      applications: {
        total: totalApplications,
        new: newApplications,
        inReview,
        offers,
        hired: hiredApplications,
        rejected,
      },
      recentApplications,
      recentCandidates,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get hiring funnel data
// @route   GET /api/dashboard/funnel
const getHiringFunnel = async (req, res) => {
  try {
    // INTENTIONAL ISSUE: Could be one $group aggregation — instead it's 8 separate queries
    const applied = await Application.countDocuments({ status: 'applied' });
    const screening = await Application.countDocuments({ status: 'screening' });
    const phone_screen = await Application.countDocuments({ status: 'phone_screen' });
    const technical = await Application.countDocuments({ status: 'technical' });
    const onsite = await Application.countDocuments({ status: 'onsite' });
    const offer = await Application.countDocuments({ status: 'offer' });
    const hired = await Application.countDocuments({ status: 'hired' });
    const rejected = await Application.countDocuments({ status: 'rejected' });

    res.json({ applied, screening, phone_screen, technical, onsite, offer, hired, rejected });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get top departments by application count
// @route   GET /api/dashboard/departments
const getTopDepartments = async (req, res) => {
  try {
    const departments = await Application.aggregate([
      {
        $lookup: {
          from: 'jobs',
          localField: 'job',
          foreignField: '_id',
          as: 'jobData',
        },
      },
      { $unwind: '$jobData' },
      {
        $group: {
          _id: '$jobData.department',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 8 },
    ]);

    res.json(departments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getDashboardStats, getHiringFunnel, getTopDepartments };
