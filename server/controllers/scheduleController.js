const pool = require('../config/db');
const { generateDailySchedule } = require('../services/scheduler');

// POST /api/schedule/generate
exports.generateSchedule = async (req, res) => {
  try {
    const userId = req.user.userId;
    const {
      targetDate = new Date().toISOString().split('T')[0],
      availableMinutes = 120,
      startTime = '16:00',
      maxBlockMinutes = 45,
      includeBreaks = true,
      breakDurationMinutes = 10
    } = req.body;

    // Fetch active non-completed tasks for this user
    const [tasks] = await pool.query(
      `SELECT * FROM study_tasks 
       WHERE user_id = ? AND status != 'Completed' AND task_type != 'Subject'
       ORDER BY due_date ASC`,
      [userId]
    );

    if (tasks.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No pending assignments or exams found to schedule. You are all caught up!',
        schedule: [],
        summary: {
          totalAvailableMinutes: Number(availableMinutes),
          totalAllocatedMinutes: 0,
          totalBreakMinutes: 0,
          sessionsCount: 0
        },
        overflowTasks: [],
        algorithmExplanation: []
      });
    }

    const scheduleResult = generateDailySchedule(tasks, {
      targetDate,
      availableMinutes: Number(availableMinutes),
      startTime,
      maxBlockMinutes: Number(maxBlockMinutes),
      includeBreaks: Boolean(includeBreaks),
      breakDurationMinutes: Number(breakDurationMinutes)
    });

    return res.status(200).json({
      success: true,
      ...scheduleResult
    });
  } catch (error) {
    console.error('Error generating schedule:', error);
    return res.status(500).json({ success: false, message: 'Server error generating study schedule.' });
  }
};

// POST /api/schedule/save - Save generated schedule slots to study_tasks
exports.saveSchedule = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { sessions, targetDate } = req.body;

    if (!Array.isArray(sessions) || sessions.length === 0) {
      return res.status(400).json({ success: false, message: 'No sessions provided to save.' });
    }

    const savedTasks = [];
    const dateStr = targetDate || new Date().toISOString().split('T')[0];

    for (const session of sessions) {
      // Don't save break sessions as tasks unless desired, or save as rest
      if (session.isBreak) continue;

      const title = session.title ? `Study Session: ${session.title}` : 'Study Session';
      
      // Calculate datetime if startClockMinutes is provided
      let startDateTime = null;
      if (session.startClockMinutes !== undefined) {
        const hours = Math.floor(session.startClockMinutes / 60);
        const mins = session.startClockMinutes % 60;
        const pad = (n) => String(n).padStart(2, '0');
        startDateTime = `${dateStr} ${pad(hours)}:${pad(mins)}:00`;
      }

      const [result] = await pool.query(
        `INSERT INTO study_tasks 
          (user_id, title, task_type, description, subject_name, due_date, start_time, duration_minutes, priority, status)
         VALUES (?, ?, 'Study', ?, ?, ?, ?, ?, ?, 'Pending')`,
        [
          userId,
          title,
          `Generated study session for ${session.subject || 'general coursework'}. Focus: ${session.focusTip || 'Deep work'}`,
          session.subject || null,
          dateStr,
          startDateTime,
          session.durationMinutes || 30,
          session.priority || 'Medium'
        ]
      );

      savedTasks.push(result.insertId);
    }

    return res.status(201).json({
      success: true,
      message: `Successfully saved ${savedTasks.length} study sessions into your planner!`,
      savedCount: savedTasks.length
    });
  } catch (error) {
    console.error('Error saving schedule sessions:', error);
    return res.status(500).json({ success: false, message: 'Server error saving study schedule.' });
  }
};

// GET /api/schedule/today - View today's schedule
exports.getTodaySchedule = async (req, res) => {
  try {
    const userId = req.user.userId;
    const today = new Date().toISOString().split('T')[0];

    // Get study sessions scheduled for today
    const [todayStudySessions] = await pool.query(
      `SELECT * FROM study_tasks 
       WHERE user_id = ? AND (due_date = ? OR DATE(start_time) = ?)
       ORDER BY start_time ASC, FIELD(priority, 'High', 'Medium', 'Low')`,
      [userId, today, today]
    );

    return res.status(200).json({
      success: true,
      date: today,
      count: todayStudySessions.length,
      tasks: todayStudySessions
    });
  } catch (error) {
    console.error('Error fetching today schedule:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving today schedule.' });
  }
};
