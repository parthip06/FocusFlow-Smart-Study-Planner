-- FocusFlow Database Schema
CREATE DATABASE IF NOT EXISTS focusflow;
USE focusflow;

-- Table 1: users
CREATE TABLE IF NOT EXISTS users (
  user_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table 2: study_tasks
CREATE TABLE IF NOT EXISTS study_tasks (
  task_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(150) NOT NULL,
  task_type VARCHAR(20) NOT NULL, -- 'Subject', 'Assignment', 'Exam', 'Study'
  description TEXT,
  subject_name VARCHAR(100) DEFAULT NULL,
  due_date DATE NULL,
  start_time DATETIME NULL,
  duration_minutes INT DEFAULT 30,
  actual_minutes INT DEFAULT 0,
  priority VARCHAR(20) DEFAULT 'Medium', -- 'Low', 'Medium', 'High'
  status VARCHAR(20) DEFAULT 'Pending', -- 'Pending', 'In Progress', 'Completed'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
