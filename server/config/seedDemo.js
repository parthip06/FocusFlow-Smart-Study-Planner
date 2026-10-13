const bcrypt = require('bcryptjs');
const pool = require('./db');

async function seedDemoUser() {
  try {
    const email = 'alex.student@focusflow.edu';
    const [existing] = await pool.query('SELECT user_id FROM users WHERE email = ?', [email]);
    
    if (existing.length > 0) {
      console.log(' Demo user already exists:', email);
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('student123', salt);

    const [res] = await pool.query(
      'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
      ['Alex Morgan', email, passwordHash]
    );

    const userId = res.insertId;

    const today = new Date();
    const formatOffsetDate = (days) => {
      const d = new Date(today);
      d.setDate(d.getDate() + days);
      return d.toISOString().split('T')[0];
    };

    const sampleTasks = [
      // Subjects
      [userId, 'Database Management Systems', 'Subject', 'Core computer science subject covering SQL, indexing, and normalization.', 'DBMS', null, null, 0, 0, 'Medium', 'In Progress'],
      [userId, 'Artificial Intelligence', 'Subject', 'Heuristic search, machine learning fundamentals, and neural nets.', 'Artificial Intelligence', null, null, 0, 0, 'High', 'In Progress'],
      [userId, 'Computer Networks', 'Subject', 'OSI model, TCP/IP protocols, and routing algorithms.', 'Computer Networks', null, null, 0, 0, 'Medium', 'In Progress'],
      [userId, 'Engineering Mathematics', 'Subject', 'Linear algebra, calculus, and probability theory.', 'Mathematics', null, null, 0, 0, 'High', 'In Progress'],

      // Assignments
      [userId, 'AI Assignment 3: Heuristic Search & Minimax', 'Assignment', 'Implement A* search algorithm and Alpha-Beta pruning in Python.', 'Artificial Intelligence', formatOffsetDate(1), null, 60, 25, 'High', 'In Progress'],
      [userId, 'DBMS Lab: SQL Queries & Normalization', 'Assignment', 'Solve complex JOIN queries and 3NF/BCNF normalization problems.', 'DBMS', formatOffsetDate(3), null, 45, 0, 'High', 'Pending'],
      [userId, 'Computer Networks: Packet Sniffer Analysis', 'Assignment', 'Capture and document Wireshark packet traces for HTTP/DNS requests.', 'Computer Networks', formatOffsetDate(5), null, 40, 0, 'Medium', 'Pending'],
      [userId, 'Math Problem Set: Matrix Eigenvalues', 'Assignment', 'Complete exercise set 4.2 on eigenvalues and eigenvectors.', 'Mathematics', formatOffsetDate(7), null, 50, 0, 'Low', 'Pending'],

      // Exams
      [userId, 'DBMS Mid-Semester Exam', 'Exam', 'Syllabus: Chapters 1-5 (ER models, Relational Algebra, SQL, Normalization).', 'DBMS', formatOffsetDate(4), null, 90, 45, 'High', 'In Progress'],
      [userId, 'AI Final Assessment', 'Exam', 'Complete examination covering search algorithms, logic, and neural networks.', 'Artificial Intelligence', formatOffsetDate(10), null, 120, 0, 'High', 'Pending'],

      // Completed sample
      [userId, 'Install MySQL Workbench & Configure Schema', 'Assignment', 'Setup local development environment for semester project.', 'DBMS', formatOffsetDate(-2), null, 30, 30, 'Medium', 'Completed'],
      
      // Study session for today
      [userId, 'Study Session: AI Search Heuristics', 'Study', 'Review admissible heuristics for A* search and branch pruning.', 'Artificial Intelligence', formatOffsetDate(0), `${formatOffsetDate(0)} 16:00:00`, 45, 45, 'High', 'Completed'],
      [userId, 'Study Session: DBMS Relational Calculus', 'Study', 'Tuple and domain relational calculus revision.', 'DBMS', formatOffsetDate(0), `${formatOffsetDate(0)} 17:00:00`, 40, 0, 'High', 'Pending']
    ];

    for (const task of sampleTasks) {
      await pool.query(
        `INSERT INTO study_tasks 
          (user_id, title, task_type, description, subject_name, due_date, start_time, duration_minutes, actual_minutes, priority, status) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        task
      );
    }

    console.log('✅ Demo user and sample academic workload created successfully!');
  } catch (err) {
    console.error('Error seeding demo user:', err);
  } finally {
    process.exit(0);
  }
}

seedDemoUser();
