const pool = require('../config/db');

// GET /api/dashboard
exports.getDashboardStats = async (req, res) => {
  try {
    const userId = req.user.userId;
    const today = new Date().toISOString().split('T')[0];

    // 1. Overall counts by status & type
    const [counts] = await pool.query(
      `SELECT 
        COUNT(*) AS total_items,
        SUM(CASE WHEN task_type = 'Assignment' THEN 1 ELSE 0 END) AS total_assignments,
        SUM(CASE WHEN task_type = 'Exam' THEN 1 ELSE 0 END) AS total_exams,
        SUM(CASE WHEN task_type = 'Subject' THEN 1 ELSE 0 END) AS total_subjects,
        SUM(CASE WHEN task_type = 'Study' THEN 1 ELSE 0 END) AS total_study_sessions,
        SUM(CASE WHEN status = 'Completed' AND task_type != 'Subject' THEN 1 ELSE 0 END) AS completed_tasks,
        SUM(CASE WHEN status = 'Pending' AND task_type != 'Subject' THEN 1 ELSE 0 END) AS pending_tasks,
        SUM(CASE WHEN status = 'In Progress' AND task_type != 'Subject' THEN 1 ELSE 0 END) AS in_progress_tasks,
        SUM(CASE WHEN task_type != 'Subject' THEN duration_minutes ELSE 0 END) AS total_planned_minutes,
        SUM(CASE WHEN task_type != 'Subject' THEN actual_minutes ELSE 0 END) AS total_actual_minutes
       FROM study_tasks 
       WHERE user_id = ?`,
      [userId]
    );

    const stats = counts[0] || {};
    const actionableTotal = (Number(stats.completed_tasks) || 0) + (Number(stats.pending_tasks) || 0) + (Number(stats.in_progress_tasks) || 0);
    const completionRate = actionableTotal > 0 ? Math.round(((Number(stats.completed_tasks) || 0) / actionableTotal) * 100) : 0;

    // 2. Overdue tasks
    const [overdueTasks] = await pool.query(
      `SELECT * FROM study_tasks 
       WHERE user_id = ? AND status != 'Completed' AND task_type != 'Subject' AND due_date < ?
       ORDER BY due_date ASC`,
      [userId, today]
    );

    // 3. Upcoming assignments (due next 7 days or pending)
    const [upcomingAssignments] = await pool.query(
      `SELECT * FROM study_tasks 
       WHERE user_id = ? AND task_type = 'Assignment' AND status != 'Completed'
       ORDER BY due_date ASC 
       LIMIT 5`,
      [userId]
    );

    // 4. Upcoming exams (all future exams or pending exams)
    const [upcomingExams] = await pool.query(
      `SELECT task_id, title, subject_name, due_date, priority, status, duration_minutes, actual_minutes,
              DATEDIFF(due_date, ?) AS days_remaining
       FROM study_tasks 
       WHERE user_id = ? AND task_type = 'Exam' AND status != 'Completed'
       ORDER BY due_date ASC 
       LIMIT 5`,
      [today, userId]
    );

    // 5. Today's schedule / study sessions
    const [todaySchedule] = await pool.query(
      `SELECT * FROM study_tasks 
       WHERE user_id = ? AND (due_date = ? OR DATE(start_time) = ?)
       ORDER BY start_time ASC, FIELD(priority, 'High', 'Medium', 'Low')`,
      [userId, today, today]
    );

    // 6. Subject-wise distribution
    const [subjectStats] = await pool.query(
      `SELECT 
        COALESCE(subject_name, 'General') AS subject,
        COUNT(*) AS total,
        SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) AS completed,
        SUM(duration_minutes) AS total_minutes,
        SUM(actual_minutes) AS actual_minutes
       FROM study_tasks 
       WHERE user_id = ? AND task_type != 'Subject'
       GROUP BY COALESCE(subject_name, 'General')
       ORDER BY total DESC`,
      [userId]
    );

    // 7. Weekly activity (last 7 days: planned vs actual study time)
    const [weeklyRaw] = await pool.query(
      `SELECT 
        due_date AS date,
        SUM(duration_minutes) AS planned_minutes,
        SUM(actual_minutes) AS completed_minutes
       FROM study_tasks 
       WHERE user_id = ? AND due_date >= DATE_SUB(?, INTERVAL 6 DAY) AND due_date <= ?
       GROUP BY due_date
       ORDER BY due_date ASC`,
      [userId, today, today]
    );

    // Build complete 7-day array even if days have 0 records
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weeklyAnalytics = [];
    const dateMap = new Map();
    weeklyRaw.forEach(r => {
      const dStr = r.date instanceof Date ? r.date.toISOString().split('T')[0] : String(r.date);
      dateMap.set(dStr, r);
    });

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dStr = d.toISOString().split('T')[0];
      const dayName = daysOfWeek[d.getDay()];
      const match = dateMap.get(dStr);

      weeklyAnalytics.push({
        date: dStr,
        day: dayName,
        plannedMinutes: match ? Number(match.planned_minutes) || 0 : 0,
        completedMinutes: match ? Number(match.completed_minutes) || 0 : 0
      });
    }

    // 8. Priority breakdown
    const [priorityStats] = await pool.query(
      `SELECT 
        priority,
        COUNT(*) AS count 
       FROM study_tasks 
       WHERE user_id = ? AND task_type != 'Subject'
       GROUP BY priority`,
      [userId]
    );

    return res.status(200).json({
      success: true,
      stats: {
        totalAssignments: Number(stats.total_assignments) || 0,
        totalExams: Number(stats.total_exams) || 0,
        totalSubjects: Number(stats.total_subjects) || 0,
        totalStudySessions: Number(stats.total_study_sessions) || 0,
        completedTasks: Number(stats.completed_tasks) || 0,
        pendingTasks: Number(stats.pending_tasks) || 0,
        inProgressTasks: Number(stats.in_progress_tasks) || 0,
        completionRate,
        totalPlannedHours: Math.round(((Number(stats.total_planned_minutes) || 0) / 60) * 10) / 10,
        totalActualHours: Math.round(((Number(stats.total_actual_minutes) || 0) / 60) * 10) / 10,
        overdueCount: overdueTasks.length
      },
      overdueTasks,
      upcomingAssignments,
      upcomingExams,
      todaySchedule,
      subjectStats,
      weeklyAnalytics,
      priorityStats
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving dashboard statistics.' });
  }
};
