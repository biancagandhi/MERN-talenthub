require('dotenv').config();
const mongoose = require('mongoose');

const User = require('../models/User');
const Candidate = require('../models/Candidate');
const Job = require('../models/Job');
const Application = require('../models/Application');
const InterviewNote = require('../models/InterviewNote');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/talenthub';

// ─── Data pools ─────────────────────────────────────────────────────────────

const firstNames = [
  'James','Mary','Robert','Patricia','John','Jennifer','Michael','Linda','David','Barbara',
  'William','Elizabeth','Richard','Susan','Joseph','Jessica','Thomas','Sarah','Charles','Karen',
  'Christopher','Lisa','Daniel','Nancy','Matthew','Betty','Anthony','Margaret','Mark','Sandra',
  'Donald','Ashley','Steven','Emily','Paul','Dorothy','Andrew','Kimberly','Joshua','Helen',
  'Kenneth','Donna','Kevin','Carol','Brian','Michelle','George','Amanda','Timothy','Melissa',
  'Ronald','Deborah','Edward','Stephanie','Jason','Rebecca','Jeffrey','Sharon','Ryan','Laura',
  'Jacob','Cynthia','Gary','Kathleen','Nicholas','Amy','Eric','Angela','Jonathan','Shirley',
  'Stephen','Anna','Larry','Brenda','Justin','Pamela','Scott','Emma','Brandon','Nicole',
  'Benjamin','Helen','Samuel','Katherine','Raymond','Christine','Gregory','Samantha','Frank','Virginia',
  'Alexander','Debra','Patrick','Rachel','Jack','Janet','Dennis','Catherine','Jerry','Carolyn',
  'Wei','Priya','Carlos','Aisha','Mohammed','Yuki','Ana','Ivan','Fatima','Raj',
  'Sofia','Liang','Elena','Omar','Isabella','Dmitri','Laila','Chen','Amara','Pablo',
  'Mei','Sanjay','Valentina','Andre','Zara','Hiroshi','Nadia','Diego','Leila','Alexei',
  'Camille','Kwame','Ingrid','Hassan','Astrid','Kenji','Amelia','Felix','Hana','Bruno',
];

const lastNames = [
  'Smith','Johnson','Williams','Brown','Jones','Garcia','Miller','Davis','Rodriguez','Martinez',
  'Hernandez','Lopez','Gonzalez','Wilson','Anderson','Thomas','Taylor','Moore','Jackson','Martin',
  'Lee','Perez','Thompson','White','Harris','Sanchez','Clark','Ramirez','Lewis','Robinson',
  'Walker','Young','Allen','King','Wright','Scott','Torres','Nguyen','Hill','Flores',
  'Green','Adams','Nelson','Baker','Hall','Rivera','Campbell','Mitchell','Carter','Roberts',
  'Patel','Kim','Chen','Wang','Li','Zhang','Liu','Yang','Huang','Wu',
  'Sharma','Gupta','Singh','Kumar','Shah','Mehta','Joshi','Reddy','Verma','Nair',
  'Müller','Schmidt','Schneider','Fischer','Weber','Meyer','Wagner','Becker','Schulz','Hoffmann',
  'Dubois','Martin','Bernard','Thomas','Robert','Richard','Petit','Durand','Leroy','Moreau',
  'Nakamura','Tanaka','Suzuki','Sato','Watanabe','Yamamoto','Kobayashi','Ito','Kato','Yamada',
  'Okafor','Diallo','Traoré','Konaté','Mensah','Asante','Osei','Agyei','Boateng','Owusu',
];

const techSkills = [
  'JavaScript','TypeScript','React','Vue.js','Angular','Node.js','Python','Java','Go','Rust',
  'C#','C++','PHP','Ruby','Swift','Kotlin','Scala','Elixir','Clojure','Haskell',
  'PostgreSQL','MySQL','MongoDB','Redis','Elasticsearch','DynamoDB','Cassandra','SQLite','Oracle','MSSQL',
  'AWS','GCP','Azure','Docker','Kubernetes','Terraform','Ansible','Jenkins','GitHub Actions','CircleCI',
  'REST API','GraphQL','gRPC','WebSockets','Kafka','RabbitMQ','NATS','Celery','Redis Pub/Sub',
  'React Native','Flutter','iOS','Android','Xamarin','Ionic','Electron',
  'TensorFlow','PyTorch','scikit-learn','Pandas','NumPy','Spark','Hadoop','Airflow','dbt','Looker',
  'Figma','Sketch','Adobe XD','Storybook','Tailwind CSS','Material UI','Bootstrap','Sass',
  'Git','Linux','Bash','PowerShell','Nginx','Apache','HAProxy','Istio','Envoy',
  'Agile','Scrum','Kanban','TDD','BDD','DDD','Microservices','Event-Driven','CQRS','Event Sourcing',
];

const nonTechSkills = [
  'Project Management','Team Leadership','Stakeholder Management','Communication','Problem Solving',
  'Critical Thinking','Data Analysis','Product Strategy','UX Research','Technical Writing',
  'Recruiting','Talent Acquisition','HR Strategy','People Operations','Compensation & Benefits',
  'Sales','Account Management','Business Development','Marketing','Content Strategy',
  'Financial Analysis','Budgeting','Forecasting','SQL','Excel','Tableau','Power BI',
];

const allSkills = [...techSkills, ...nonTechSkills];

const companies = [
  'Google','Meta','Amazon','Apple','Microsoft','Netflix','Stripe','Airbnb','Uber','Lyft',
  'Salesforce','ServiceNow','Workday','Snowflake','Databricks','Confluent','HashiCorp','MongoDB Inc',
  'Shopify','Square','Twilio','SendGrid','Okta','Datadog','PagerDuty','New Relic','Splunk',
  'Slack','Zoom','Atlassian','GitHub','GitLab','Notion','Linear','Figma','Canva','Vercel',
  'TechCorp Solutions','Accenture','Deloitte Digital','IBM','Oracle','SAP','Cisco','VMware',
  'FinTech Dynamics','DataPulse AI','CloudEdge Systems','NexGenSoft','IterateHQ','BuildSpace',
  'StartupX','GrowthLabs','PivotPoint','Moonshot Inc','Stealth Startup','Bootstrapped LLC',
  'InfraScale','DevOps United','PlatformCo','APIFirst','MeshWorks','GridIQ',
];

const titles = [
  'Software Engineer','Senior Software Engineer','Staff Software Engineer','Principal Engineer',
  'Frontend Engineer','Backend Engineer','Full Stack Engineer','Platform Engineer','Infrastructure Engineer',
  'DevOps Engineer','Site Reliability Engineer','Data Engineer','Machine Learning Engineer',
  'Engineering Manager','Director of Engineering','VP of Engineering','CTO',
  'Product Manager','Senior Product Manager','Director of Product','VP Product','CPO',
  'Designer','Senior Designer','UX Researcher','Design Manager','Head of Design',
  'Data Analyst','Senior Data Analyst','Data Scientist','Senior Data Scientist','Head of Data',
  'Recruiter','Senior Recruiter','Technical Recruiter','Head of Talent','VP People',
  'Sales Engineer','Account Executive','Solutions Architect','Customer Success Manager',
  'Marketing Manager','Content Strategist','Growth Engineer','Head of Marketing',
  'Finance Manager','Financial Analyst','Head of Finance','Controller','CFO',
  'Operations Manager','Chief of Staff','Business Operations Analyst','Head of Ops',
];

const degrees = ['Bachelor\'s','Master\'s','PhD','Associate\'s','MBA','Bootcamp Certificate'];
const fields = [
  'Computer Science','Software Engineering','Information Technology','Data Science',
  'Electrical Engineering','Mathematics','Statistics','Physics','Business Administration',
  'Human-Computer Interaction','Information Systems','Cybersecurity','Product Design',
  'Marketing','Finance','Economics','Psychology','Communication',
];
const universities = [
  'MIT','Stanford University','Carnegie Mellon University','UC Berkeley','Georgia Tech',
  'University of Washington','Cornell University','University of Michigan','UT Austin','Purdue University',
  'Harvard University','Columbia University','UCLA','USC','NYU','Boston University',
  'Imperial College London','ETH Zurich','Toronto University','Waterloo University',
  'IIT Bombay','IIT Delhi','NUS Singapore','Peking University','Tsinghua University',
  'General Assembly','Hack Reactor','Lambda School','App Academy','Flatiron School',
  'State University','Community College','Online University',
];

const cities = [
  'San Francisco, CA','New York, NY','Seattle, WA','Austin, TX','Boston, MA',
  'Chicago, IL','Los Angeles, CA','Denver, CO','Atlanta, GA','Miami, FL',
  'Portland, OR','San Diego, CA','Raleigh, NC','Nashville, TN','Phoenix, AZ',
  'London','Berlin','Amsterdam','Toronto','Vancouver','Sydney','Singapore','Dublin',
  'Remote',
];

const sources = ['linkedin','referral','website','job_board','agency','other'];
const statuses = ['active','active','active','active','inactive','hired','rejected'];
const availability = ['immediate','2_weeks','1_month','3_months','negotiable'];

const departments = [
  'Engineering','Product','Design','Data','DevOps','Security',
  'Marketing','Sales','Finance','HR','Legal','Operations','Customer Success',
];

const jobTitles = {
  Engineering: [
    'Senior Software Engineer','Staff Software Engineer','Principal Engineer','Frontend Engineer',
    'Backend Engineer','Full Stack Engineer','Platform Engineer','iOS Engineer','Android Engineer',
    'Security Engineer','Junior Software Engineer','Engineering Manager',
  ],
  Product: [
    'Product Manager','Senior Product Manager','Principal Product Manager',
    'Director of Product','Group Product Manager','Associate Product Manager',
  ],
  Design: [
    'Product Designer','Senior Product Designer','UX Researcher',
    'Design Manager','Head of Design','Motion Designer',
  ],
  Data: [
    'Data Engineer','Senior Data Engineer','Data Scientist','ML Engineer',
    'Analytics Engineer','Data Analyst','Head of Data Engineering',
  ],
  DevOps: [
    'DevOps Engineer','Site Reliability Engineer','Platform Engineer',
    'Infrastructure Engineer','Cloud Architect','Senior SRE',
  ],
  Security: [
    'Security Engineer','Application Security Engineer','Security Analyst','CISO',
    'Penetration Tester','Security Architect',
  ],
  Marketing: [
    'Marketing Manager','Growth Engineer','Content Strategist','SEO Manager',
    'Demand Generation Manager','Brand Manager','VP Marketing',
  ],
  Sales: [
    'Account Executive','Enterprise Sales Engineer','Solutions Architect',
    'Sales Development Representative','VP Sales','Regional Sales Manager',
  ],
  Finance: [
    'Financial Analyst','Senior Financial Analyst','Controller','FP&A Manager','CFO',
  ],
  HR: [
    'Technical Recruiter','Senior Recruiter','People Operations Manager',
    'Head of Talent Acquisition','HRBP','VP People',
  ],
  Legal: ['General Counsel','Legal Counsel','Compliance Manager','IP Attorney'],
  Operations: ['Operations Manager','Chief of Staff','Business Operations Analyst','Head of Ops'],
  'Customer Success': [
    'Customer Success Manager','Senior CSM','Head of Customer Success',
    'Technical Account Manager','Onboarding Specialist',
  ],
};

const benefits = [
  'Health Insurance','Dental & Vision','401(k) with matching','Unlimited PTO',
  'Remote Work','Stock Options','Annual Bonus','Learning & Development Budget',
  'Home Office Stipend','Gym Membership','Mental Health Support','Parental Leave',
  'Commuter Benefits','Company Equity','Performance Bonuses','Wellness Stipend',
];

const applicationStatuses = [
  'applied','applied','applied','screening','phone_screen','technical',
  'onsite','offer','hired','rejected','rejected','withdrawn',
];

const interviewTypes = ['phone_screen','technical','cultural_fit','final','general'];
const recommendations = ['strong_yes','yes','neutral','no','strong_no'];
const noteStrengths = [
  'Strong problem solver','Clear communicator','Great culture fit','Solid technical foundation',
  'Good systems thinking','Fast learner','Led complex projects','Strong leadership potential',
  'Excellent code quality','Deep domain expertise','Collaborative mindset','Entrepreneurial drive',
];
const noteWeaknesses = [
  'Limited experience with distributed systems','Communication could be clearer',
  'Needs more ownership experience','Technical depth in X is thin',
  'Hasn\'t scaled teams before','Limited exposure to production incidents',
  'Could improve estimation skills','Needs mentorship in architecture decisions',
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randSkills = (n = 5) => {
  const shuffled = [...allSkills].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, n);
};
const randBenefits = (n = 5) => {
  const shuffled = [...benefits].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, n);
};

const generateEmail = (firstName, lastName, idx) => {
  const domains = ['gmail.com','yahoo.com','hotmail.com','outlook.com','icloud.com','protonmail.com'];
  const clean = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
  return `${clean(firstName)}.${clean(lastName)}${idx}@${rand(domains)}`;
};

// ─── Seed ─────────────────────────────────────────────────────────────────────

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  await User.deleteMany({})
  await Candidate.deleteMany({})
  await Job.deleteMany({})
  await Application.deleteMany({})
  await InterviewNote.deleteMany({})
  console.log('Cleared existing data');

  // Clear existing data
  await Promise.all([
    User.deleteMany({}),
    Candidate.deleteMany({}),
    Job.deleteMany({}),
    Application.deleteMany({}),
    InterviewNote.deleteMany({}),
  ]);
  console.log('Cleared existing data');

  const adminUser = await User.create({
    name: 'Admin User',
    email: 'admin@example.com',
    password: 'password123',
    role: 'admin',
    department: 'HR',
    isActive: true,
  });

  const recruiterUsers = await User.create([
    { name: 'Sarah Mitchell', email: 'sarah.mitchell@talenthub.io', password: 'password123', role: 'recruiter', department: 'HR' },
    { name: 'James Carter', email: 'james.carter@talenthub.io', password: 'password123', role: 'recruiter', department: 'HR' },
    { name: 'Lisa Park', email: 'lisa.park@talenthub.io', password: 'password123', role: 'recruiter', department: 'HR' },
  ])

  const interviewerUsers = await User.create([
    { name: 'Tom Bradley', email: 'tom.bradley@talenthub.io', password: 'password123', role: 'interviewer', department: 'Engineering' },
    { name: 'Nina Patel', email: 'nina.patel@talenthub.io', password: 'password123', role: 'interviewer', department: 'Engineering' },
    { name: 'Chris Okafor', email: 'chris.okafor@talenthub.io', password: 'password123', role: 'interviewer', department: 'Product' },
    { name: 'Dana Hoffmann', email: 'dana.hoffmann@talenthub.io', password: 'password123', role: 'interviewer', department: 'Design' },
  ])

  const allUsers = [adminUser, ...recruiterUsers, ...interviewerUsers];
  console.log(`Created ${allUsers.length} users`);

  // ── Candidates ──
  console.log('Seeding 2000 candidates...');
  const candidateDocs = [];

  for (let i = 0; i < 2000; i++) {
    const firstName = rand(firstNames);
    const lastName = rand(lastNames);
    const expYears = randInt(0, 18);
    const gradYear = new Date().getFullYear() - expYears - randInt(0, 4);
    const city = rand(cities);

    candidateDocs.push({
      firstName,
      lastName,
      email: generateEmail(firstName, lastName, i),
      phone: `+1-${randInt(200,999)}-${randInt(100,999)}-${randInt(1000,9999)}`,
      location: {
        city: city.split(',')[0].trim(),
        state: city.includes(',') ? city.split(',')[1].trim() : '',
        country: city === 'Remote' ? 'Remote' : (city.match(/\b[A-Z]{2}\b/) ? 'USA' : 'International'),
      },
      currentTitle: rand(titles),
      currentCompany: rand(companies),
      experienceYears: expYears,
      skills: randSkills(randInt(3, 10)),
      education: {
        degree: rand(degrees),
        field: rand(fields),
        institution: rand(universities),
        graduationYear: gradYear,
      },
      linkedinUrl: `https://linkedin.com/in/${firstName.toLowerCase()}-${lastName.toLowerCase()}-${randInt(100,999)}`,
      githubUrl: Math.random() > 0.4 ? `https://github.com/${firstName.toLowerCase()}${lastName.toLowerCase()}${randInt(1,99)}` : '',
      status: rand(statuses),
      source: rand(sources),
      salary: {
        expected: randInt(60, 250) * 1000,
        current: randInt(50, 220) * 1000,
        currency: 'USD',
      },
      availability: rand(availability),
      tags: randSkills(randInt(0, 3)),
      createdBy: rand(allUsers)._id,
      assignedTo: Math.random() > 0.5 ? rand(recruiterUsers)._id : undefined,
      createdAt: new Date(Date.now() - randInt(0, 365 * 2) * 24 * 60 * 60 * 1000),
    });
  }

  const candidates = await Candidate.insertMany(candidateDocs);
  console.log(`Created ${candidates.length} candidates`);

  // ── Jobs ──
  console.log('Seeding 100 jobs...');
  const jobDocs = [];

  for (let i = 0; i < 100; i++) {
    const dept = rand(departments);
    const deptTitles = jobTitles[dept] || jobTitles['Engineering'];
    const title = rand(deptTitles);
    const minSalary = randInt(60, 180) * 1000;

    jobDocs.push({
      title,
      department: dept,
      location: rand(cities),
      type: rand(['full-time','full-time','full-time','part-time','contract']),
      level: rand(['junior','mid','mid','senior','senior','lead','principal']),
      description: `We are looking for a talented ${title} to join our ${dept} team. You will work on challenging problems at scale, collaborate with cross-functional teams, and have a direct impact on our product and customers. This role offers an opportunity to grow technically and professionally within a fast-paced startup environment.`,
      responsibilities: [
        `Lead development of key ${dept.toLowerCase()} initiatives`,
        'Collaborate with cross-functional teams to define requirements',
        'Mentor junior team members and conduct code reviews',
        'Contribute to architectural decisions and technical roadmap',
        'Drive continuous improvement of processes and tools',
        'Participate in on-call rotation as needed',
      ],
      requirements: [
        `${randInt(2, 7)}+ years of relevant experience`,
        `Strong proficiency in ${rand(techSkills)} and ${rand(techSkills)}`,
        'Experience with distributed systems and microservices',
        'Excellent communication and collaboration skills',
        'BS/MS in Computer Science or equivalent experience',
      ],
      niceToHave: [
        `Experience with ${rand(techSkills)}`,
        'Prior startup experience',
        'Open source contributions',
        'Experience with high-traffic production systems',
      ],
      skills: randSkills(randInt(4, 8)),
      salary: {
        min: minSalary,
        max: minSalary + randInt(20, 60) * 1000,
        currency: 'USD',
        isPublic: Math.random() > 0.3,
      },
      status: rand(['open','open','open','open','paused','closed','filled','draft']),
      priority: rand(['low','medium','medium','high','urgent']),
      headcount: randInt(1, 4),
      hiringManager: rand(allUsers)._id,
      recruiters: [rand(recruiterUsers)._id],
      remote: Math.random() > 0.4,
      benefits: randBenefits(randInt(4, 8)),
      applicationCount: 0,
      createdBy: adminUser._id,
      createdAt: new Date(Date.now() - randInt(0, 180) * 24 * 60 * 60 * 1000),
    });
  }

  const jobs = await Job.insertMany(jobDocs);
  console.log(`Created ${jobs.length} jobs`);

  // ── Applications ──
  console.log('Seeding 5000 applications...');

  const appDocs = [];
  const usedPairs = new Set();

  let attempts = 0;
  while (appDocs.length < 5000 && attempts < 30000) {
    attempts++;
    const candidate = rand(candidates);
    const job = rand(jobs);
    const key = `${candidate._id}-${job._id}`;
    if (usedPairs.has(key)) continue;
    usedPairs.add(key);

    const status = rand(applicationStatuses);
    const appliedAt = new Date(Date.now() - randInt(0, 120) * 24 * 60 * 60 * 1000);

    appDocs.push({
      candidate: candidate._id,
      job: job._id,
      status,
      stage: rand(['new','in_review','shortlisted','interviewing','offer_extended','closed']),
      appliedAt,
      source: rand(sources),
      coverLetter: Math.random() > 0.6 ? `Dear Hiring Team,\n\nI am excited to apply for the ${job.title} position at your company. With ${candidate.experienceYears} years of experience, I believe I would be a strong fit for this role.\n\nBest regards,\n${candidate.firstName} ${candidate.lastName}` : '',
      rating: Math.random() > 0.5 ? randInt(1, 5) : undefined,
      feedback: Math.random() > 0.7 ? 'Candidate shows strong technical skills and good cultural alignment.' : '',
      rejectionReason: ['rejected','withdrawn'].includes(status) ? rand(['Not enough experience','Salary mismatch','Culture fit concerns','Position filled','Candidate withdrew','Better candidates available']) : '',
      salaryExpectation: candidate.salary.expected,
      assignedTo: rand(recruiterUsers)._id,
      reviewedBy: Math.random() > 0.5 ? rand(allUsers)._id : undefined,
      isArchived: Math.random() > 0.95,
      timeline: [{
        status: 'applied',
        changedBy: adminUser._id,
        note: 'Application received',
      }],
      createdAt: appliedAt,
    });
  }

  const BATCH = 500;
  let totalApps = 0;
  for (let i = 0; i < appDocs.length; i += BATCH) {
    const batch = await Application.insertMany(appDocs.slice(i, i + BATCH));
    totalApps += batch.length;
    process.stdout.write(`\r  Created ${totalApps} applications...`);
  }
  console.log(`\nCreated ${totalApps} applications`);

  // Update job applicationCounts
  const appsByJob = {};
  for (const app of appDocs) {
    const jobId = app.job.toString();
    appsByJob[jobId] = (appsByJob[jobId] || 0) + 1;
  }
  const updateOps = Object.entries(appsByJob).map(([jobId, count]) =>
    Job.findByIdAndUpdate(jobId, { applicationCount: count })
  );
  await Promise.all(updateOps);
  console.log('Updated job application counts');

  // ── Interview Notes ──
  console.log('Seeding interview notes...');
  const applications = await Application.find({
    status: { $in: ['technical','onsite','offer','hired'] }
  }).limit(500);

  const noteDocs = [];
  for (const app of applications) {
    const numNotes = randInt(1, 3);
    for (let n = 0; n < numNotes; n++) {
      const techScore = randInt(4, 10);
      const commScore = randInt(4, 10);
      const cultureScore = randInt(4, 10);
      noteDocs.push({
        application: app._id,
        candidate: app.candidate,
        job: app.job,
        interviewer: rand(interviewerUsers)._id,
        type: rand(interviewTypes),
        summary: `Interview conducted for this candidate. ${rand(['Strong performance overall.','Candidate demonstrated solid fundamentals.','Mixed results — some areas of concern.','Excellent communication and technical depth.','Below expectations in certain technical areas.'])} ${rand(['Recommend moving forward.','Would like a second opinion from another interviewer.','Strong hire.','Borderline — team should discuss.','Not a fit for this role.'])}`,
        strengths: [rand(noteStrengths), rand(noteStrengths)],
        weaknesses: [rand(noteWeaknesses)],
        technicalScore: techScore,
        communicationScore: commScore,
        culturalFitScore: cultureScore,
        overallScore: Math.round((techScore + commScore + cultureScore) / 3),
        recommendation: rand(recommendations),
        isPrivate: Math.random() > 0.8,
        duration: rand([30, 45, 60, 60, 90, 120]),
        scheduledAt: new Date(Date.now() - randInt(0, 60) * 24 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - randInt(0, 60) * 24 * 60 * 60 * 1000),
      });
    }
  }

  await InterviewNote.insertMany(noteDocs);
  console.log(`Created ${noteDocs.length} interview notes`);

  console.log('\n✅ Seed complete!');
  console.log('Login: admin@example.com / password123');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
