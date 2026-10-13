const pool = require('../config/db');

// GET /api/tasks (filter by type, status, priority, subject, search)
exports.getTasks = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { task_type, status, priority, subject, search, date } = req.query;

    let query = 'SELECT * FROM study_tasks WHERE user_id = ?';
    const params = [userId];

    if (task_type) {
      query += ' AND task_type = ?';
      params.push(task_type);
    }

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    if (priority) {
      query += ' AND priority = ?';
      params.push(priority);
    }

    if (subject) {
      query += ' AND (subject_name = ? OR (task_type = "Subject" AND title = ?))';
      params.push(subject, subject);
    }

    if (date) {
      query += ' AND (due_date = ? OR DATE(start_time) = ?)';
      params.push(date, date);
    }

    if (search) {
      query += ' AND (title LIKE ? OR description LIKE ? OR subject_name LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s, s);
    }

    // Sort order:
    // When viewing exams or assignments: nearest due_date first, nulls last
    // Priority order: High > Medium > Low
    query += ` ORDER BY 
      CASE WHEN due_date IS NULL THEN 1 ELSE 0 END, 
      due_date ASC, 
      FIELD(priority, 'High', 'Medium', 'Low'), 
      created_at DESC`;

    const [tasks] = await pool.query(query, params);

    return res.status(200).json({
      success: true,
      count: tasks.length,
      tasks
    });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving tasks.' });
  }
};

// GET /api/tasks/subjects - List of unique subjects
exports.getSubjects = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Retrieve subjects defined as task_type='Subject' or assigned in subject_name
    const [subjectEntities] = await pool.query(
      `SELECT task_id, title AS name, description, priority, status, created_at 
       FROM study_tasks 
       WHERE user_id = ? AND task_type = 'Subject'
       ORDER BY title ASC`,
      [userId]
    );

    const [allSubjectNames] = await pool.query(
      `SELECT DISTINCT subject_name 
       FROM study_tasks 
       WHERE user_id = ? AND subject_name IS NOT NULL AND subject_name != ''`,
      [userId]
    );

    // Merge names
    const namesSet = new Set();
    subjectEntities.forEach(s => namesSet.add(s.name));
    allSubjectNames.forEach(s => namesSet.add(s.subject_name));

    return res.status(200).json({
      success: true,
      subjects: subjectEntities,
      subjectNames: Array.from(namesSet)
    });
  } catch (error) {
    console.error('Error getting subjects:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving subjects.' });
  }
};

// POST /api/tasks
exports.createTask = async (req, res) => {
  try {
    const userId = req.user.userId;
    const {
      title,
      task_type = 'Assignment',
      description = '',
      subject_name = null,
      due_date = null,
      start_time = null,
      duration_minutes = 30,
      priority = 'Medium',
      status = 'Pending'
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Title is required.' });
    }

    const validTypes = ['Subject', 'Assignment', 'Exam', 'Study'];
    const validPriorities = ['Low', 'Medium', 'High'];
    const validStatuses = ['Pending', 'In Progress', 'Completed'];

    const sanitizedType = validTypes.includes(task_type) ? task_type : 'Assignment';
    const sanitizedPriority = validPriorities.includes(priority) ? priority : 'Medium';
    const sanitizedStatus = validStatuses.includes(status) ? status : 'Pending';

    const [result] = await pool.query(
      `INSERT INTO study_tasks 
        (user_id, title, task_type, description, subject_name, due_date, start_time, duration_minutes, priority, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        title.trim(),
        sanitizedType,
        description || null,
        subject_name || null,
        due_date || null,
        start_time || null,
        Number(duration_minutes) || 30,
        sanitizedPriority,
        sanitizedStatus
      ]
    );

    const [newTask] = await pool.query('SELECT * FROM study_tasks WHERE task_id = ?', [result.insertId]);

    return res.status(201).json({
      success: true,
      message: `${sanitizedType} created successfully!`,
      task: newTask[0]
    });
  } catch (error) {
    console.error('Error creating task:', error);
    return res.status(500).json({ success: false, message: 'Server error creating task.' });
  }
};

// GET /api/tasks/:id
exports.getTaskById = async (req, res) => {
  try {
    const userId = req.user.userId;
    const taskId = req.params.id;

    const [tasks] = await pool.query(
      'SELECT * FROM study_tasks WHERE task_id = ? AND user_id = ?',
      [taskId, userId]
    );

    if (tasks.length === 0) {
      return res.status(404).json({ success: false, message: 'Task not found or access denied.' });
    }

    return res.status(200).json({
      success: true,
      task: tasks[0]
    });
  } catch (error) {
    console.error('Error getting task by ID:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving task.' });
  }
};

// PUT /api/tasks/:id
exports.updateTask = async (req, res) => {
  try {
    const userId = req.user.userId;
    const taskId = req.params.id;
    const {
      title,
      task_type,
      description,
      subject_name,
      due_date,
      start_time,
      duration_minutes,
      actual_minutes,
      priority,
      status
    } = req.body;

    const [existing] = await pool.query(
      'SELECT * FROM study_tasks WHERE task_id = ? AND user_id = ?',
      [taskId, userId]
    );

    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Task not found or unauthorized.' });
    }

    const current = existing[0];

    const updatedTitle = title !== undefined ? title.trim() : current.title;
    const updatedType = task_type !== undefined ? task_type : current.task_type;
    const updatedDesc = description !== undefined ? description : current.description;
    const updatedSubject = subject_name !== undefined ? subject_name : current.subject_name;
    const updatedDueDate = due_date !== undefined ? due_date : current.due_date;
    const updatedStartTime = start_time !== undefined ? start_time : current.start_time;
    const updatedDuration = duration_minutes !== undefined ? Number(duration_minutes) : current.duration_minutes;
    const updatedActual = actual_minutes !== undefined ? Number(actual_minutes) : current.actual_minutes;
    const updatedPriority = priority !== undefined ? priority : current.priority;
    const updatedStatus = status !== undefined ? status : current.status;

    await pool.query(
      `UPDATE study_tasks 
       SET title = ?, task_type = ?, description = ?, subject_name = ?, due_date = ?, 
           start_time = ?, duration_minutes = ?, actual_minutes = ?, priority = ?, status = ?
       WHERE task_id = ? AND user_id = ?`,
      [
        updatedTitle,
        updatedType,
        updatedDesc,
        updatedSubject,
        updatedDueDate || null,
        updatedStartTime || null,
        updatedDuration,
        updatedActual,
        updatedPriority,
        updatedStatus,
        taskId,
        userId
      ]
    );

    const [updated] = await pool.query('SELECT * FROM study_tasks WHERE task_id = ?', [taskId]);

    return res.status(200).json({
      success: true,
      message: 'Task updated successfully!',
      task: updated[0]
    });
  } catch (error) {
    console.error('Error updating task:', error);
    return res.status(500).json({ success: false, message: 'Server error updating task.' });
  }
};

// DELETE /api/tasks/:id
exports.deleteTask = async (req, res) => {
  try {
    const userId = req.user.userId;
    const taskId = req.params.id;

    const [result] = await pool.query(
      'DELETE FROM study_tasks WHERE task_id = ? AND user_id = ?',
      [taskId, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Task not found or unauthorized.' });
    }

    return res.status(200).json({
      success: true,
      message: 'Task deleted successfully!'
    });
  } catch (error) {
    console.error('Error deleting task:', error);
    return res.status(500).json({ success: false, message: 'Server error deleting task.' });
  }
};

// PATCH /api/tasks/:id/complete
exports.completeTask = async (req, res) => {
  try {
    const userId = req.user.userId;
    const taskId = req.params.id;
    const { status, actual_minutes } = req.body;

    const [tasks] = await pool.query(
      'SELECT * FROM study_tasks WHERE task_id = ? AND user_id = ?',
      [taskId, userId]
    );

    if (tasks.length === 0) {
      return res.status(404).json({ success: false, message: 'Task not found or unauthorized.' });
    }

    const currentTask = tasks[0];
    const newStatus = status || (currentTask.status === 'Completed' ? 'Pending' : 'Completed');
    
    // If completed and no actual_minutes given, set actual_minutes to duration_minutes if zero
    let newActualMinutes = currentTask.actual_minutes;
    if (actual_minutes !== undefined) {
      newActualMinutes = Number(actual_minutes);
    } else if (newStatus === 'Completed' && newActualMinutes === 0 && currentTask.duration_minutes > 0) {
      newActualMinutes = currentTask.duration_minutes;
    }

    await pool.query(
      'UPDATE study_tasks SET status = ?, actual_minutes = ? WHERE task_id = ? AND user_id = ?',
      [newStatus, newActualMinutes, taskId, userId]
    );

    return res.status(200).json({
      success: true,
      message: `Task marked as ${newStatus}`,
      status: newStatus,
      actual_minutes: newActualMinutes
    });
  } catch (error) {
    console.error('Error completing task:', error);
    return res.status(500).json({ success: false, message: 'Server error updating task status.' });
  }
};

// POST /api/tasks/:id/log-time (for Pomodoro study session tracking)
exports.logStudyTime = async (req, res) => {
  try {
    const userId = req.user.userId;
    const taskId = req.params.id;
    const { minutes } = req.body;

    const studyMinutes = Number(minutes) || 25;

    const [result] = await pool.query(
      `UPDATE study_tasks 
       SET actual_minutes = COALESCE(actual_minutes, 0) + ?,
           status = CASE WHEN status = 'Pending' THEN 'In Progress' ELSE status END
       WHERE task_id = ? AND user_id = ?`,
      [studyMinutes, taskId, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Task not found or unauthorized.' });
    }

    const [updated] = await pool.query('SELECT * FROM study_tasks WHERE task_id = ?', [taskId]);

    return res.status(200).json({
      success: true,
      message: `Logged ${studyMinutes} study minutes successfully!`,
      task: updated[0]
    });
  } catch (error) {
    console.error('Error logging study time:', error);
    return res.status(500).json({ success: false, message: 'Server error logging study time.' });
  }
};
