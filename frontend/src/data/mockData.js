export const mentors = [
  { id: 1, name: "Priya Sharma", role: "Senior Backend Engineer", experience: "8 yrs experience", rating: 4.9, reviews: 42, rate: 800, skills: ["Spring Boot", "Java", "REST APIs"], tone: "rose", availability: "Available" },
  { id: 2, name: "Arjun Mehta", role: "AI Platform Mentor", experience: "5 yrs experience", rating: 4.7, reviews: 28, rate: 600, skills: ["ML / AI", "Python", "TensorFlow"], tone: "blue", availability: "Available" },
  { id: 3, name: "Neha Kapoor", role: "Frontend Architect", experience: "6 yrs experience", rating: 4.8, reviews: 35, rate: 750, skills: ["React", "Node.js", "TypeScript"], tone: "emerald", availability: "Available" },
  { id: 4, name: "Rahul Gupta", role: "Interview Coach", experience: "4 yrs experience", rating: 4.6, reviews: 19, rate: 500, skills: ["DSA", "Java", "LeetCode"], tone: "violet", availability: "Available" },
  { id: 5, name: "Sanjay Kumar", role: "Cloud Engineer", experience: "10 yrs experience", rating: 4.9, reviews: 87, rate: 950, skills: ["Microservices", "Docker", "AWS"], tone: "amber", availability: "Busy" },
  { id: 6, name: "Divya Verma", role: "Angular Specialist", experience: "7 yrs experience", rating: 4.7, reviews: 31, rate: 700, skills: ["Angular", "RxJS", "NgRx"], tone: "emerald", availability: "Available" },
];

export const learnerSessions = [
  { id: 101, mentor: "Priya Sharma", topic: "Spring Boot REST APIs", date: "Mar 15", time: "10:00 AM", duration: "60 min", status: "Accepted" },
  { id: 102, mentor: "Arjun Mehta", topic: "ML Fundamentals", date: "Mar 17", time: "3:00 PM", duration: "60 min", status: "Pending" },
  { id: 103, mentor: "Neha Kapoor", topic: "React Architecture", date: "Mar 21", time: "5:30 PM", duration: "90 min", status: "Requested" },
];

export const groups = [
  { id: 1, title: "Spring Boot Beginners", mentor: "Priya Sharma", members: 48, posts: 128, status: "Active 2h ago", description: "A group for Java developers learning Spring Boot from scratch with weekly practice sessions and code reviews.", skills: ["Java", "Spring Boot", "REST APIs", "JPA"], joined: false },
  { id: 2, title: "Machine Learning Study Circle", mentor: "Arjun Mehta", members: 72, posts: 95, status: "Active 5h ago", description: "Weekly discussions on ML algorithms, research papers, and hands-on implementation labs.", skills: ["Python", "TensorFlow", "Scikit-learn", "Statistics"], joined: false },
  { id: 3, title: "DSA Interview Preparation", mentor: "Rahul Gupta", members: 103, posts: 210, status: "Active now", description: "Daily LeetCode problems, mock interviews, and optimal solutions for arrays, trees, graphs, and DP.", skills: ["Data Structures", "Algorithms", "LeetCode"], joined: true },
];

export const mentorRequests = [
  { id: 201, learner: "Rahul S.", topic: "Spring Security JWT", date: "Mar 18", time: "11:00 AM", status: "Pending", fee: 800 },
  { id: 202, learner: "Aisha Patel", topic: "JPA Relationships", date: "Mar 19", time: "4:30 PM", status: "Pending", fee: 800 },
  { id: 203, learner: "Karan Shah", topic: "REST API Review", date: "Mar 22", time: "9:00 AM", status: "Accepted", fee: 800 },
];

export const adminUsers = [
  { id: 1, name: "Rahul Sharma", email: "rahul.sharma@example.com", role: "Learner", status: "Active" },
  { id: 2, name: "Priya Sharma", email: "priya@example.com", role: "Mentor", status: "Approved" },
  { id: 3, name: "Sneha Patel", email: "sneha@example.com", role: "Mentor", status: "Pending" },
  { id: 4, name: "Admin User", email: "admin@skillsync.com", role: "Admin", status: "Active" },
];

export const activity = [
  "Mentor Divya Verma approved",
  "New session booked by Rahul S.",
  "Group DSA Prep reached 100 members",
  "Priya Sharma received a 5-star review",
  "14 new users registered today",
];
