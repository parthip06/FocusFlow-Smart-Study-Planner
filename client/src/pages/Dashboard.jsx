import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { dashboardAPI, taskAPI } from '../services/api';
import TaskCard from '../components/TaskCard';
import TaskModal from '../components/TaskModal';
import { 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  GraduationCap, 
  CalendarClock, 
  Plus, 
  ArrowUpRight, 
  Flame, 
  BookOpen, 
  Sparkles,
  Play
} from 'lucide-react';


export default function Dashboard({ onStartFocus }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await dashboardAPI.getStats();
      if (res.data.success) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Failed to load dashboard:', err);
      setError('Failed to fetch dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleToggleComplete = async (task) => {
    try {
      await taskAPI.completeTask(task.task_id);
      fetchDashboardData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await taskAPI.deleteTask(taskId);
        fetchDashboardData();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleSaveTask = async (formData, taskId) => {
    if (taskId) {
      await taskAPI.updateTask(taskId, formData);
    } else {
      await taskAPI.createTask(formData);
    }
    fetchDashboardData();
  };

  if (loading) {
    return (
      <div className="page-wrapper" style={{ textAlign: 'center', padding: '5rem 0' }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '3px solid rgba(16, 185, 129, 0.2)',
          borderTopColor: 'var(--primary)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 1rem'
        }} />
        <p style={{ color: 'var(--text-muted)' }}>Loading your academic dashboard...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const stats = data?.stats || {};
  const todaySchedule = data?.todaySchedule || [];
  const upcomingAssignments = data?.upcomingAssignments || [];
  const upcomingExams = data?.upcomingExams || [];
  const weeklyAnalytics = data?.weeklyAnalytics || [];
  const overdueTasks = data?.overdueTasks || [];

  return (
    <div className="page-wrapper">
      {/* Hero Welcome Banner */}
      <div className="glass-card" style={{
        background: 'var(--gradient-hero)',
        border: '1px solid #bbf7d0',
        padding: '2rem 2.25rem',
        marginBottom: '2rem',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 8px 24px -4px rgba(16, 185, 129, 0.1)'
      }}>
        <div style={{
          position: 'absolute',
          top: '-40px',
          right: '-40px',
          width: '200px',
          height: '200px',
          background: 'radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, transparent 70%)',
          borderRadius: '50%',
          filter: 'blur(30px)',
          pointerEvents: 'none'
        }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.25rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary-light)', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.35rem' }}>
              <Sparkles size={16} />
              <span>ACADEMIC OVERVIEW · SEMESTER PROGRESS</span>
            </div>
            <h1 style={{ fontSize: '1.85rem', marginBottom: '0.4rem' }}>
              Welcome back, {user?.name || 'Student'}! 👋
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', maxWidth: '600px' }}>
              You have completed <strong style={{ color: 'var(--color-low)' }}>{stats.completedTasks || 0} tasks</strong> with an overall completion rate of <strong style={{ color: 'var(--primary-light)' }}>{stats.completionRate || 0}%</strong>.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button 
              className="btn btn-secondary"
              onClick={() => {
                setTaskToEdit(null);
                setIsModalOpen(true);
              }}
            >
              <Plus size={16} />
              <span>Add Task</span>
            </button>

            <Link to="/planner" className="btn btn-primary">
              <CalendarClock size={16} />
              <span>Study Planner</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Overdue Warning Alert */}
      {overdueTasks.length > 0 && (
        <div style={{
          padding: '1rem 1.25rem',
          borderRadius: 'var(--radius-lg)',
          background: 'rgba(244, 63, 94, 0.1)',
          border: '1px solid rgba(244, 63, 94, 0.3)',
          marginBottom: '2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: 'rgba(244, 63, 94, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-high)'
            }}>
              <AlertTriangle size={20} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-high)' }}>
                {overdueTasks.length} Overdue {overdueTasks.length === 1 ? 'Task' : 'Tasks'} Require Attention
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                {overdueTasks.map(t => t.title).slice(0, 2).join(', ')}
                {overdueTasks.length > 2 && ` and ${overdueTasks.length - 2} more`}
              </div>
            </div>
          </div>

          <Link to="/tasks?status=Pending" className="btn btn-danger btn-sm">
            Review Overdue Tasks
          </Link>
        </div>
      )}

      {/* 4 Core Stat Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '1.25rem',
        marginBottom: '2rem'
      }}>
        {/* Card 1: Completed Tasks */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Completed Work</span>
            <div style={{
              padding: '0.4rem',
              borderRadius: '8px',
              background: 'var(--color-low-bg)',
              color: 'var(--color-low)'
            }}>
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem' }}>
            {stats.completedTasks || 0}
          </div>
          <div className="progress-container" style={{ marginBottom: '0.4rem' }}>
            <div className="progress-bar-fill" style={{ width: `${stats.completionRate || 0}%` }} />
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            {stats.completionRate || 0}% syllabus items done
          </div>
        </div>

        {/* Card 2: Pending Tasks */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Pending Tasks</span>
            <div style={{
              padding: '0.4rem',
              borderRadius: '8px',
              background: 'var(--color-assignment-bg)',
              color: 'var(--color-assignment)'
            }}>
              <BookOpen size={18} />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem' }}>
            {stats.pendingTasks || 0}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            {stats.inProgressTasks || 0} in progress · {stats.totalAssignments || 0} assignments
          </div>
        </div>

        {/* Card 3: Study Hours Logged */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Study Hours</span>
            <div style={{
              padding: '0.4rem',
              borderRadius: '8px',
              background: 'var(--color-study-bg)',
              color: 'var(--color-study)'
            }}>
              <Clock size={18} />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem' }}>
            {stats.totalActualHours || 0}h
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            of {stats.totalPlannedHours || 0}h planned duration
          </div>
        </div>

        {/* Card 4: Upcoming Exams */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Upcoming Exams</span>
            <div style={{
              padding: '0.4rem',
              borderRadius: '8px',
              background: 'var(--color-exam-bg)',
              color: 'var(--color-exam)'
            }}>
              <GraduationCap size={18} />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem' }}>
            {stats.totalExams || 0}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            {upcomingExams.length > 0 
              ? `Next: ${upcomingExams[0].title.slice(0, 18)}...` 
              : 'No upcoming exams'}
          </div>
        </div>
      </div>

      {/* Today's Schedule Section */}
      <div style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem' }}>Today's Study Plan</h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Scheduled sessions allocated for today
            </p>
          </div>

          <Link to="/planner" className="btn btn-secondary btn-sm">
            <span>Open Generator</span>
            <ArrowUpRight size={14} />
          </Link>
        </div>

        {todaySchedule.length === 0 ? (
          <div className="glass-card" style={{ textAlign: 'center', padding: '2.5rem 1.5rem' }}>
            <CalendarClock size={36} color="var(--primary-light)" style={{ margin: '0 auto 0.75rem', opacity: 0.8 }} />
            <h4 style={{ fontSize: '1.1rem', marginBottom: '0.35rem' }}>No Study Sessions Scheduled for Today</h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: '480px', margin: '0 auto 1.25rem' }}>
              Let FocusFlow calculate optimal study intervals based on your deadlines, exam schedules, and available hours!
            </p>
            <Link to="/planner" className="btn btn-primary btn-sm">
              <Sparkles size={14} />
              <span>Generate Today's Study Plan</span>
            </Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
            {todaySchedule.map(task => (
              <TaskCard
                key={task.task_id}
                task={task}
                onToggleComplete={handleToggleComplete}
                onEdit={(t) => {
                  setTaskToEdit(t);
                  setIsModalOpen(true);
                }}
                onDelete={handleDeleteTask}
                onStartFocus={onStartFocus}
              />
            ))}
          </div>
        )}
      </div>

      {/* Two Column Layout: Upcoming Assignments & Exams */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
        {/* Left Column: Upcoming Assignments */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.15rem' }}>Upcoming Assignments</h3>
            <Link to="/tasks?type=Assignment" style={{ fontSize: '0.8rem', color: 'var(--primary-light)', fontWeight: 600 }}>
              View all ({stats.totalAssignments || 0})
            </Link>
          </div>

          {upcomingAssignments.length === 0 ? (
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No pending assignments! Good job!</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {upcomingAssignments.map(task => (
                <div
                  key={task.task_id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--border-subtle)'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.92rem' }}>{task.title}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                      {task.subject_name || 'General'} · Due: {task.due_date ? task.due_date.split('T')[0] : 'No date'}
                    </div>
                  </div>
                  <span className={`badge badge-${task.priority.toLowerCase()}`}>
                    {task.priority}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Upcoming Exams */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.15rem' }}>Upcoming Exams</h3>
            <Link to="/exams" style={{ fontSize: '0.8rem', color: 'var(--primary-light)', fontWeight: 600 }}>
              View details
            </Link>
          </div>

          {upcomingExams.length === 0 ? (
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No exams scheduled. Add your first exam!</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {upcomingExams.map(exam => (
                <div
                  key={exam.task_id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    background: '#f0fdf4',
                    border: '1px solid #bbf7d0'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.92rem' }}>{exam.title}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {exam.subject_name || 'Exam'} · Date: {exam.due_date ? exam.due_date.split('T')[0] : 'TBD'}
                    </div>
                  </div>
                  <div style={{
                    padding: '0.25rem 0.65rem',
                    borderRadius: 'var(--radius-full)',
                    background: exam.days_remaining <= 3 ? 'var(--color-high-bg)' : '#dcfce7',
                    color: exam.days_remaining <= 3 ? 'var(--color-high)' : '#047857',
                    fontWeight: 700,
                    fontSize: '0.78rem'
                  }}>
                    {exam.days_remaining !== null 
                      ? (exam.days_remaining < 0 ? 'Passed' : exam.days_remaining === 0 ? 'Today!' : `${exam.days_remaining}d left`)
                      : 'Scheduled'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <TaskModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setTaskToEdit(null);
        }}
        onSave={handleSaveTask}
        taskToEdit={taskToEdit}
      />
    </div>
  );
}
