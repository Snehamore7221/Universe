/**
 * UniVerse Campus Ecosystem - Seed & Reference Data
 * Clean, structured sample data for prototype simulation and testing
 */

export const CAMPUS_INFO = {
  name: 'UniVerse',
  tagline: 'Your campus, connected.',
  description:
    'A unified platform connecting student intelligence, sustainable computing, digital wellbeing, commuter micro-pooling, and responsible assessment monitoring.',
};

export const SAMPLE_CAMPUS_UPDATES = [
  {
    id: 'upd-1',
    title: 'Sample announcement — replace with an official campus notice',
    description: 'Transit corridor matching schedules and shuttle carpool pickup windows will be posted here.',
    date: 'Sample notice',
  },
  {
    id: 'upd-2',
    title: 'Sample announcement — replace with an official campus notice',
    description: 'Guidelines for campus computing energy benchmarks and solar window scheduling will appear here.',
    date: 'Sample notice',
  },
  {
    id: 'upd-3',
    title: 'Sample announcement — replace with an official campus notice',
    description: 'Academic collaborative study circle registration and peer mentoring schedules will be listed here.',
    date: 'Sample notice',
  },
];

export const MODULES = [
  {
    id: 'student-hub',
    name: 'Student Intelligence & Academic Hub',
    shortName: 'Academic Hub',
    icon: 'GraduationCap',
    description:
      'AI-assisted peer study matching, academic knowledge graph indexing, and collaborative milestone tracking across campus courses.',
    tags: ['Academic Support', 'Peer Matching', 'Course Graphs'],
    sampleStudyCircles: [
      { id: 'sc-101', course: 'CS 301: Distributed Systems', members: 4, nextSession: 'Tuesday 5:00 PM', topic: 'Consensus Protocols Review' },
      { id: 'sc-102', course: 'ENV 210: Renewable Energy Systems', members: 6, nextSession: 'Wednesday 10:00 AM', topic: 'Campus Microgrid Modeling' },
      { id: 'sc-103', course: 'MATH 240: Linear Algebra & Optimization', members: 3, nextSession: 'Friday 4:30 PM', topic: 'Matrix Factorization Prep' },
      { id: 'sc-104', course: 'BIO 150: Molecular Genetics', members: 5, nextSession: 'Monday 2:00 PM', topic: 'CRISPR Mechanism Analysis' },
    ],
  },
  {
    id: 'ride-pooling',
    name: 'Smart Campus Ride-Pooling',
    shortName: 'Ride-Pooling',
    icon: 'Car',
    description:
      'Algorithmic micro-pooling for campus commuters with corridor route bundling, institutional identity validation, and estimated carbon savings.',
    tags: ['Transit Corridors', 'Commute Pooling', 'Carbon Estimation'],
    sampleRoutes: [
      { id: 'rt-1', corridor: 'North Metro Transit -> West Campus Terminal', departsIn: '15 mins', availableSeats: 2, driverType: 'Student Commuter', estDistanceKm: 11.5 },
      { id: 'rt-2', corridor: 'East Residential District -> Engineering Hall', departsIn: '25 mins', availableSeats: 1, driverType: 'Staff Carpool', estDistanceKm: 8.2 },
      { id: 'rt-3', corridor: 'South Transit Circle -> Central Library Hub', departsIn: '35 mins', availableSeats: 3, driverType: 'Campus Shuttle Van', estDistanceKm: 14.0 },
      { id: 'rt-4', corridor: 'Innovation Park -> Science Quad', departsIn: '50 mins', availableSeats: 2, driverType: 'Student Commuter', estDistanceKm: 6.5 },
    ],
  },
  {
    id: 'sustainability',
    name: 'Sustainable Computing Observatory',
    shortName: 'Sustainability',
    icon: 'Leaf',
    description:
      'Telemetry simulation and carbon-aware workload modeling for campus computing clusters, GPU research servers, and teaching computer labs.',
    tags: ['Energy Telemetry', 'Carbon Modeling', 'Workload Scheduling'],
    simulatedClusters: [
      { id: 'node-ai-1', name: 'AI Research Rack A (4x Accelerators)', baseKw: 1.4, defaultUtil: 72, environment: 'Research Lab' },
      { id: 'node-sim-2', name: 'Engineering Modeling Server 2', baseKw: 0.85, defaultUtil: 48, environment: 'Simulation Cluster' },
      { id: 'node-lab-104', name: 'Computer Lab 104 (30 Workstations)', baseKw: 0.95, defaultUtil: 25, environment: 'Instructional Lab' },
      { id: 'node-cloud-edge', name: 'Campus Edge Inference Gateway', baseKw: 0.35, defaultUtil: 55, environment: 'Core Infrastructure' },
    ],
  },
  {
    id: 'digital-wellbeing',
    name: 'Privacy-Aware Digital Wellbeing',
    shortName: 'Digital Wellbeing',
    icon: 'ShieldCheck',
    description:
      'On-device study habits analysis, zero-egress screen rhythm indicators, and local mindful focus session tracking without centralized data collection.',
    tags: ['Local-First', 'Focus Rhythms', 'Zero-Egress Privacy'],
    sampleEvents: [
      { id: 'evt-1', category: 'Academic Research', title: 'Library Catalog & IEEE Xplore', durationMinutes: 45, timestamp: '10:15 AM', privacyMode: 'Local Processing Only' },
      { id: 'evt-2', category: 'Development', title: 'IDE Local Workspace & Terminal', durationMinutes: 60, timestamp: '11:30 AM', privacyMode: 'Local Processing Only' },
      { id: 'evt-3', category: 'Coursework', title: 'Course Assignment Portal', durationMinutes: 30, timestamp: '01:45 PM', privacyMode: 'Local Processing Only' },
      { id: 'evt-4', category: 'Reference & Reading', title: 'Course Syllabus & Reading PDF', durationMinutes: 25, timestamp: '03:10 PM', privacyMode: 'Local Processing Only' },
    ],
  },
  {
    id: 'exam-monitoring',
    name: 'Responsible Examination Monitoring',
    shortName: 'Exam Monitoring',
    icon: 'Eye',
    description:
      'Ethical assessment oversight protocols featuring local buffer processing, transparent student consent, and human-in-the-loop review mandates.',
    tags: ['Ethical Protocols', 'Consent Verification', 'Audit Receipts'],
    sampleSessions: [
      { id: 'EX-201', course: 'CS 202: Data Structures Midterm', duration: '90 mins', registeredCandidates: 85, protocolStatus: 'Consent Checklist Active', privacyBuffer: 'Local Ring Buffer' },
      { id: 'EX-104', course: 'MATH 101: Calculus Examination', duration: '120 mins', registeredCandidates: 110, protocolStatus: 'Consent Checklist Active', privacyBuffer: 'Local Ring Buffer' },
      { id: 'EX-315', course: 'PHYS 220: Electromagnetism Quiz', duration: '45 mins', registeredCandidates: 62, protocolStatus: 'Consent Checklist Active', privacyBuffer: 'Local Ring Buffer' },
    ],
  },
];


export const STUDENT_PROFILE = {
  name: 'Aarya Sharma',
  year: 'Third Year',
  branch: 'Computer Engineering',
  skills: ['C++', 'DSA', 'React', 'SQL'],
  interests: ['Software Engineering', 'FinTech'],
  careerGoal: 'Software Development Engineer',
};

export const PLACEMENT_TASKS = [
  { id: 'task-1', title: 'Practice array and string problems', category: 'DSA', completed: true },
  { id: 'task-2', title: 'Revise OOP concepts', category: 'Core CS', completed: true },
  { id: 'task-3', title: 'Study DBMS and SQL', category: 'Core CS', completed: false },
  { id: 'task-4', title: 'Complete a mock interview', category: 'Interview Prep', completed: false },
  { id: 'task-5', title: 'Update project descriptions on resume', category: 'Career', completed: false },
];

export const SAMPLE_MENTORS = [
  {
    id: 'mentor-1',
    name: 'Riya Mehta',
    year: 'Final Year',
    skills: ['DSA', 'C++', 'Interview Prep'],
    domain: 'Software Engineering',
    description: 'Helps juniors prepare for coding rounds and technical interviews.',
  },
  {
    id: 'mentor-2',
    name: 'Arjun Shah',
    year: 'Final Year',
    skills: ['React', 'Node.js', 'MongoDB'],
    domain: 'Full-Stack Development',
    description: 'Guidance on web development projects and portfolio building.',
  },
  {
    id: 'mentor-3',
    name: 'Neha Patil',
    year: 'Final Year',
    skills: ['SQL', 'Python', 'Finance'],
    domain: 'FinTech',
    description: 'Explores software careers at the intersection of technology and finance.',
  },
];

export const SAMPLE_ACADEMIC_RESOURCES = [
  {
    id: 'resource-1',
    title: 'Data Structures and Algorithms Notes',
    subject: 'DSA',
    type: 'Notes',
    semester: 'Semester 5',
    url: 'https://www.geeksforgeeks.org/data-structures/',
  },
  {
    id: 'resource-2',
    title: 'Database Management Systems Reference',
    subject: 'DBMS',
    type: 'Notes',
    semester: 'Semester 5',
    url: 'https://www.geeksforgeeks.org/dbms/',
  },
  {
    id: 'resource-3',
    title: 'Operating Systems Previous-Year Practice',
    subject: 'Operating Systems',
    type: 'Question Paper',
    semester: 'Semester 5',
    url: 'https://www.geeksforgeeks.org/operating-systems/',
  },
  {
    id: 'resource-4',
    title: 'Technical Interview Preparation',
    subject: 'Interview Preparation',
    type: 'Interview Prep',
    semester: 'Placement',
    url: 'https://www.geeksforgeeks.org/interview-prep/',
  },
];

