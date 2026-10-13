/**
 * FocusFlow Intelligent Study Schedule Algorithm
 * A priority-based greedy scheduling engine tailored for student academic workloads.
 */

// Helper to format date string YYYY-MM-DD
function toDateString(d) {
  if (!d) return null;
  const date = new Date(d);
  return date.toISOString().split('T')[0];
}

// Helper to calculate days between two dates
function getDaysDiff(targetDateStr, dueDateStr) {
  if (!dueDateStr) return 999;
  const target = new Date(targetDateStr);
  const due = new Date(dueDateStr);
  const diffTime = due.getTime() - target.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// Format time HH:MM
function formatTime(minutesFromMidnight) {
  const hours = Math.floor(minutesFromMidnight / 60) % 24;
  const mins = minutesFromMidnight % 60;
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 === 0 ? 12 : hours % 12;
  const displayMins = mins < 10 ? `0${mins}` : mins;
  return `${displayHours}:${displayMins} ${period}`;
}

// Convert "HH:MM" or "16:00" string to minutes from midnight
function parseTimeToMinutes(timeStr) {
  if (!timeStr) return 16 * 60; // default 4:00 PM
  const parts = timeStr.split(':');
  if (parts.length >= 2) {
    const h = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    if (!isNaN(h) && !isNaN(m)) {
      return h * 60 + m;
    }
  }
  return 16 * 60;
}

/**
 * Calculate urgency score based on deadline distance
 */
function calculateUrgencyScore(daysDiff) {
  if (daysDiff < 0) return 100; // Overdue task! Immediate attention
  if (daysDiff === 0) return 95; // Due today
  if (daysDiff === 1) return 85; // Due tomorrow
  if (daysDiff === 2) return 72; // Due in 2 days
  if (daysDiff <= 3) return 60;  // Due in 3 days
  if (daysDiff <= 5) return 48;  // Due this week
  if (daysDiff <= 7) return 35;  // Due within 7 days
  if (daysDiff <= 14) return 22; // Due within 2 weeks
  return 12;                     // Long term
}

/**
 * Priority multiplier
 */
const PRIORITY_MULTIPLIERS = {
  High: 1.8,
  Medium: 1.3,
  Low: 1.0
};

/**
 * Generate daily study schedule
 * @param {Array} pendingTasks - Array of pending/in-progress tasks
 * @param {Object} options - Configuration options
 */
function generateDailySchedule(pendingTasks, options = {}) {
  const {
    targetDate = new Date().toISOString().split('T')[0],
    availableMinutes = 120,
    startTime = '16:00', // 4:00 PM
    maxBlockMinutes = 45,
    minBlockMinutes = 20,
    includeBreaks = true,
    breakDurationMinutes = 10
  } = options;

  const totalAvailable = Math.max(30, parseInt(availableMinutes, 10) || 120);
  let currentClockMinutes = parseTimeToMinutes(startTime);
  let remainingTime = totalAvailable;

  // Filter out subjects (subjects represent courses, not individual sessions) and completed tasks
  const actionableTasks = pendingTasks.filter(
    t => t.task_type !== 'Subject' && t.status !== 'Completed'
  );

  // 1. Calculate Priority and Urgency Scores for each task
  const scoredTasks = actionableTasks.map(task => {
    const daysDiff = getDaysDiff(targetDate, task.due_date);
    const urgency = calculateUrgencyScore(daysDiff);
    const multiplier = PRIORITY_MULTIPLIERS[task.priority] || 1.2;
    
    // Exam preparation bonus: exams should be distributed across multiple days
    const isExam = task.task_type === 'Exam';
    const examBonus = isExam ? 15 : 0;

    // Remaining duration consideration
    const estimatedMinutes = task.duration_minutes || (isExam ? 60 : 45);
    const actualMinutesDone = task.actual_minutes || 0;
    const remainingEstimated = Math.max(minBlockMinutes, estimatedMinutes - actualMinutesDone);

    // Final priority score
    const finalScore = Math.round((urgency * multiplier) + examBonus);

    return {
      ...task,
      daysDiff,
      urgency,
      multiplier,
      remainingEstimated,
      finalScore
    };
  });

  // 2. Sort by Final Priority Score (Descending)
  scoredTasks.sort((a, b) => {
    if (b.finalScore !== a.finalScore) {
      return b.finalScore - a.finalScore;
    }
    // Tie-breaker: earlier due date first
    if (a.daysDiff !== b.daysDiff) {
      return a.daysDiff - b.daysDiff;
    }
    return b.duration_minutes - a.duration_minutes;
  });

  const allocatedSessions = [];
  const overflowTasks = [];
  let totalAllocatedMinutes = 0;
  let totalBreakMinutes = 0;

  // 3. Greedy Allocation
  for (const task of scoredTasks) {
    if (remainingTime < minBlockMinutes) {
      overflowTasks.push({
        taskId: task.task_id,
        title: task.title,
        subject: task.subject_name,
        taskType: task.task_type,
        dueDate: task.due_date,
        priority: task.priority,
        reason: 'Insufficient remaining time in the requested study window.',
        score: task.finalScore
      });
      continue;
    }

    // Determine session duration for this task
    let sessionDuration = Math.min(
      task.remainingEstimated,
      maxBlockMinutes,
      remainingTime
    );

    // Ensure it's at least minBlockMinutes if possible
    if (sessionDuration < minBlockMinutes && remainingTime >= minBlockMinutes) {
      sessionDuration = minBlockMinutes;
    }

    const sessionStartClock = currentClockMinutes;
    const sessionEndClock = currentClockMinutes + sessionDuration;

    allocatedSessions.push({
      taskId: task.task_id,
      title: task.title,
      subject: task.subject_name,
      taskType: task.task_type,
      priority: task.priority,
      dueDate: task.due_date,
      daysDiff: task.daysDiff,
      score: task.finalScore,
      durationMinutes: sessionDuration,
      startTimeStr: formatTime(sessionStartClock),
      endTimeStr: formatTime(sessionEndClock),
      startClockMinutes: sessionStartClock,
      endClockMinutes: sessionEndClock,
      isBreak: false,
      focusTip: getFocusTip(task)
    });

    remainingTime -= sessionDuration;
    totalAllocatedMinutes += sessionDuration;
    currentClockMinutes = sessionEndClock;

    // Check if break should be scheduled
    if (includeBreaks && remainingTime >= (breakDurationMinutes + minBlockMinutes)) {
      const breakStart = currentClockMinutes;
      const breakEnd = currentClockMinutes + breakDurationMinutes;

      allocatedSessions.push({
        taskId: null,
        title: 'Rest & Refresh Break',
        subject: 'Break',
        taskType: 'Break',
        priority: 'Normal',
        dueDate: null,
        daysDiff: null,
        score: 0,
        durationMinutes: breakDurationMinutes,
        startTimeStr: formatTime(breakStart),
        endTimeStr: formatTime(breakEnd),
        startClockMinutes: breakStart,
        endClockMinutes: breakEnd,
        isBreak: true,
        focusTip: 'Step away from screen, hydrate, and stretch.'
      });

      remainingTime -= breakDurationMinutes;
      totalBreakMinutes += breakDurationMinutes;
      currentClockMinutes = breakEnd;
    }
  }

  return {
    targetDate,
    summary: {
      totalAvailableMinutes: totalAvailable,
      totalAllocatedMinutes,
      totalBreakMinutes,
      effectiveStudyMinutes: totalAllocatedMinutes,
      remainingUnusedMinutes: remainingTime,
      sessionsCount: allocatedSessions.filter(s => !s.isBreak).length,
      breaksCount: allocatedSessions.filter(s => s.isBreak).length,
      overflowCount: overflowTasks.length
    },
    schedule: allocatedSessions,
    overflowTasks,
    algorithmExplanation: [
      {
        step: 1,
        title: 'Urgency & Weight Calculation',
        detail: 'Tasks are assigned urgency scores from 12 to 100 based on due date proximity (nearer deadlines and overdue tasks receive highest urgency).'
      },
      {
        step: 2,
        title: 'Priority & Exam Boosting',
        detail: 'High priority tasks receive a 1.8x multiplier; Medium receives 1.3x. Upcoming exams receive a multi-day pacing bonus to distribute preparation.'
      },
      {
        step: 3,
        title: 'Greedy Allocation with Micro-Breaks',
        detail: `Allocated available time (${totalAvailable} min) in descending score order into focused ${maxBlockMinutes}-minute chunks separated by ${breakDurationMinutes}-minute refreshing pauses.`
      },
      {
        step: 4,
        title: 'Overflow Protection',
        detail: overflowTasks.length > 0 
          ? `${overflowTasks.length} tasks flagged for tomorrow or later to avoid cognitive overload.`
          : 'All pending tasks successfully accommodated in the study window.'
      }
    ]
  };
}

function getFocusTip(task) {
  if (task.task_type === 'Exam') {
    return 'Active recall: Practice flashcards, summarize key theorems, or solve past paper questions.';
  }
  if (task.task_type === 'Assignment') {
    return 'Milestone focus: Break requirements into 2-3 manageable sub-goals before writing code/text.';
  }
  return 'Deep work: Put phone in do-not-disturb mode and focus on key concepts.';
}

module.exports = {
  generateDailySchedule,
  calculateUrgencyScore,
  PRIORITY_MULTIPLIERS
};
