const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const generateToken = (user) => {
  return jwt.sign(
    { userId: user.user_id, email: user.email, name: user.name },
    process.env.JWT_SECRET || 'focusflow_super_secret_jwt_key_2026_secure',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// Register student
exports.register = async (req, res) => {
  try {
    const { name, email, password, seedSampleData = true } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide name, email, and password.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
    }

    const emailNormalized = email.trim().toLowerCase();

    // Check if user already exists
    const [existing] = await pool.query('SELECT user_id FROM users WHERE email = ?', [emailNormalized]);
    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Insert user
    const [result] = await pool.query(
      'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
      [name.trim(), emailNormalized, passwordHash]
    );

    const userId = result.insertId;

    // Pre-populate sample academic workload so students immediately see the power of FocusFlow
    if (seedSampleData) {
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
        [userId, 'AI Assignment 3: Heuristic Search & Minimax', 'Assignment', 'Implement A* search algorithm and Alpha-Beta pruning in Python.', 'Artificial Intelligence', formatOffsetDate(1), null, 60, 0, 'High', 'Pending'],
        [userId, 'DBMS Lab: SQL Queries & Normalization', 'Assignment', 'Solve complex JOIN queries and 3NF/BCNF normalization problems.', 'DBMS', formatOffsetDate(3), null, 45, 0, 'High', 'Pending'],
        [userId, 'Computer Networks: Packet Sniffer Analysis', 'Assignment', 'Capture and document Wireshark packet traces for HTTP/DNS requests.', 'Computer Networks', formatOffsetDate(5), null, 40, 0, 'Medium', 'Pending'],
        [userId, 'Math Problem Set: Matrix Eigenvalues', 'Assignment', 'Complete exercise set 4.2 on eigenvalues and eigenvectors.', 'Mathematics', formatOffsetDate(7), null, 50, 0, 'Low', 'Pending'],

        // Exams
        [userId, 'DBMS Mid-Semester Exam', 'Exam', 'Syllabus: Chapters 1-5 (ER models, Relational Algebra, SQL, Normalization).', 'DBMS', formatOffsetDate(4), null, 90, 30, 'High', 'In Progress'],
        [userId, 'AI Final Assessment', 'Exam', 'Complete examination covering search algorithms, logic, and neural networks.', 'Artificial Intelligence', formatOffsetDate(10), null, 120, 0, 'High', 'Pending'],

        // Completed sample
        [userId, 'Install MySQL Workbench and Setup Schema', 'Assignment', 'Configure local MySQL development environment for semester project.', 'DBMS', formatOffsetDate(-2), null, 30, 30, 'Medium', 'Completed']
      ];

      for (const task of sampleTasks) {
        await pool.query(
          `INSERT INTO study_tasks 
            (user_id, title, task_type, description, subject_name, due_date, start_time, duration_minutes, actual_minutes, priority, status) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          task
        );
      }
    }

    const token = generateToken({ user_id: userId, email: emailNormalized, name });

    return res.status(201).json({
      success: true,
      message: 'Account created successfully!',
      token,
      user: {
        userId,
        name,
        email: emailNormalized
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ success: false, message: 'Server error during registration.' });
  }
};

// Login student
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide both email and password.' });
    }

    const emailNormalized = email.trim().toLowerCase();

    // Find student
    const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [emailNormalized]);
    if (users.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const user = users[0];

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const token = generateToken(user);

    return res.status(200).json({
      success: true,
      message: 'Logged in successfully!',
      token,
      user: {
        userId: user.user_id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, message: 'Server error during login.' });
  }
};

// Get current student profile
exports.getMe = async (req, res) => {
  try {
    const [users] = await pool.query(
      'SELECT user_id, name, email, created_at FROM users WHERE user_id = ?',
      [req.user.userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    return res.status(200).json({
      success: true,
      user: users[0]
    });
  } catch (error) {
    console.error('GetMe error:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching user profile.' });
  }
};
