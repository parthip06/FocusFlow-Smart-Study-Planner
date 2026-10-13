# FocusFlow — Smart Study Planner

> **Full-Stack Academic Productivity Application**  
> Built with **React 18**, **Express.js**, and **MySQL**.

FocusFlow is a student productivity platform designed to eliminate academic overwhelm. Unlike generic to-do lists, FocusFlow features an **intelligent greedy scheduling algorithm** that calculates priority scores based on deadline proximity, course weighting, and available daily hours to automatically generate structured, realistic study timetables.

---

## 🌟 Key Features

### Phase 1 — Core Functionality
- **Student Authentication & Data Isolation**: Secure registration and login using `bcryptjs` password hashing and `jsonwebtoken` (JWT) authentication. Every student query is strictly scoped to the authenticated `user_id`.
- **Subject & Course Management**: Organize enrolled courses (e.g., *Database Management Systems*, *Artificial Intelligence*, *Computer Networks*, *Mathematics*), track syllabus completion percentage, and group assignments.
- **Assignment Tracker**: Track deadlines, priorities (`High`, `Medium`, `Low`), estimated completion minutes, and progress states (`Pending`, `In Progress`, `Completed`).
- **Exam Countdown & Preparation Hub**: Dedicated examination calendar with dynamic countdown badges, priority weighting, and target study hours vs. actual revision time.
- **Intelligent Daily Study Planner**: Priority-based greedy scheduler that divides study workloads into focused 25–45 minute blocks with restorative breaks, ensuring students never over-commit.
- **Progress Dashboard**: At-a-glance metrics for completed tasks, pending work, actual vs. planned study hours, exam countdown radar, and overdue task alerts.

### Phase 2 — Enhancements
- **Interactive Calendar View**: Monthly calendar visualizing assignments, exams, and scheduled study sessions by date with day-by-day task inspection.
- **Integrated Pomodoro Study Timer**: 25m Focus / 5m Short Break / 15m Long Break timer with native Web Audio chime notifications, animated circular progress ring, and direct time-logging to specific tasks.
- **Imminent Deadline & Overdue Reminders**: Intelligent notification system flagging overdue work and upcoming exams due within 3 days.
- **Weekly Analytics & Workload Distribution**: Comparative Recharts visualizations comparing planned study time vs. actual completed focus time across days and courses.

---

## 🧠 The Automatic Study Scheduling Algorithm

The scheduling engine (`server/services/scheduler.js`) implements a **greedy heuristic algorithm** designed to maximize academic retention while preventing burnout.

### 1. Urgency Calculation
For each active task, the system calculates deadline distance:
$$\Delta \text{days} = \text{DueDate} - \text{TargetDate}$$

$$\text{Urgency Score} = \begin{cases} 
100 & \text{if } \Delta \text{days} < 0 \text{ (Overdue)} \\
95 & \text{if } \Delta \text{days} = 0 \text{ (Due Today)} \\
85 & \text{if } \Delta \text{days} = 1 \text{ (Due Tomorrow)} \\
72 & \text{if } \Delta \text{days} = 2 \\
60 & \text{if } \Delta \text{days} \le 3 \\
48 & \text{if } \Delta \text{days} \le 5 \\
35 & \text{if } \Delta \text{days} \le 7 \\
22 & \text{if } \Delta \text{days} \le 14 \\
12 & \text{otherwise}
\end{cases}$$

### 2. Priority Weighting & Exam Pacing
Tasks are scaled by user-defined importance multipliers:
- **High Priority**: $1.8\times$
- **Medium Priority**: $1.3\times$
- **Low Priority**: $1.0\times$
- **Exam Pacing Bonus**: $+15$ bonus points to distribute exam revision across multiple days leading up to the test.

$$\text{Final Score} = \text{round}(\text{Urgency Score} \times \text{Multiplier}) + \text{ExamBonus}$$

### 3. Greedy Slot Allocation & Rest Breaks
1. Sort active tasks in descending order of $\text{Final Score}$.
2. In each iteration, allocate a block of time (capped at user's preferred session length, e.g., 45 mins).
3. If breaks are enabled, insert a 5–10 minute restorative pause between sessions.
4. **Cognitive Overload Protection**: Once available daily hours are exhausted, remaining lower-priority tasks are flagged in an *Overflow Drawer* for subsequent days rather than forcing an unachievable schedule.

---

## 🗄️ Database Architecture (MySQL)

To maintain simplicity and optimal performance, the application utilizes two primary relational tables:

```
+-----------------------------------+        +-----------------------------------+
|               users               |        |            study_tasks            |
+-----------------------------------+        +-----------------------------------+
| user_id (PK, INT AUTO_INCREMENT)  |<---1:N-| task_id (PK, INT AUTO_INCREMENT)  |
| name (VARCHAR 100)                |        | user_id (FK, INT)                 |
| email (VARCHAR 150, UNIQUE)       |        | title (VARCHAR 150)               |
| password_hash (VARCHAR 255)       |        | task_type (VARCHAR 20)            |
| created_at (TIMESTAMP)            |        | description (TEXT)                |
+-----------------------------------+        | subject_name (VARCHAR 100)        |
                                             | due_date (DATE)                   |
                                             | start_time (DATETIME)             |
                                             | duration_minutes (INT)            |
                                             | actual_minutes (INT)              |
                                             | priority (VARCHAR 20)             |
                                             | status (VARCHAR 20)               |
                                             | created_at (TIMESTAMP)            |
                                             +-----------------------------------+
```

---

## 🔌 REST API Endpoints

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `POST` | `/api/auth/register` | Register new student (supports auto-seeding sample courses) | No |
| `POST` | `/api/auth/login` | Authenticate student and issue JWT token | No |
| `GET` | `/api/auth/me` | Fetch authenticated student profile | Yes |
| `GET` | `/api/tasks` | Fetch student tasks (filters: `type`, `status`, `priority`, `subject`, `search`) | Yes |
| `GET` | `/api/tasks/subjects` | Fetch unique subject entities and enrolled course names | Yes |
| `POST` | `/api/tasks` | Create assignment, exam, subject, or study session | Yes |
| `GET` | `/api/tasks/:id` | Fetch specific task by ID | Yes |
| `PUT` | `/api/tasks/:id` | Update task details | Yes |
| `DELETE` | `/api/tasks/:id` | Remove task | Yes |
| `PATCH` | `/api/tasks/:id/complete`| Toggle completion status | Yes |
| `POST` | `/api/tasks/:id/log-time`| Log focused study minutes from Pomodoro timer | Yes |
| `POST` | `/api/schedule/generate`| Run greedy algorithm to generate daily study timetable | Yes |
| `POST` | `/api/schedule/save` | Commit generated study schedule blocks to planner | Yes |
| `GET` | `/api/schedule/today` | Retrieve today's scheduled study sessions | Yes |
| `GET` | `/api/dashboard` | Retrieve comprehensive progress metrics and weekly analytics | Yes |

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js** (v18+)
- **MySQL** (v8.0+)

### 2. Database Initialization
Ensure your MySQL server is running, then execute the schema:
```bash
mysql -u root -p < server/config/schema.sql
```

### 3. Server Configuration
Create or inspect `server/.env`:
```env
PORT=5001
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=root
DB_NAME=focusflow
DB_PORT=3306
JWT_SECRET=focusflow_super_secret_jwt_key_2026_secure
JWT_EXPIRES_IN=7d
```

### 4. Running the Application

**Start Backend Server:**
```bash
cd server
npm install
npm run dev
```
*Backend runs on `http://localhost:5001`.*

**Start Frontend Client:**
```bash
cd client
npm install
npm run dev
```
*Frontend runs on `http://localhost:3000` (proxies `/api` to port 5001).*

---

## 🎓 Demo Credentials
A sample demo student account with pre-populated coursework and sample tasks is available:
- **Email**: `alex.student@focusflow.edu`
- **Password**: `student123`
*(Or simply click the **"⚡ Try Demo Account"** button on the login screen).*

---

## 💼 Resume & Viva Highlights
- **Engineered an algorithmic study scheduler** utilizing a priority-based greedy heuristic that factors in deadline decay, course weightings, and Pomodoro-style interval chunking.
- **Designed a normalized 2-table relational schema** with index-optimized lookups and strict multi-tenant authorization (`user_id` scoped queries).
- **Constructed a glassmorphism design system** in Vanilla CSS with responsive dashboards, Recharts progress graphs, and a custom Web Audio API sound generator.
- **Implemented end-to-end task lifecycle management** with live Pomodoro session logging and planned vs. actual weekly analytics.
