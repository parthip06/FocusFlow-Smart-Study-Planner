import React from 'react';
import confetti from 'canvas-confetti';
import { sound } from '../services/sound';
import { 
  Check, 
  Calendar, 
  Clock, 
  Tag, 
  Edit3, 
  Trash2, 
  Play, 
  AlertTriangle,
  GraduationCap,
  BookOpen
} from 'lucide-react';

export default function TaskCard({ 
  task, 
  onToggleComplete, 
  onEdit, 
  onDelete, 
  onStartFocus 
}) {
  const isCompleted = task.status === 'Completed';

  // Calculate due date distance
  const getDueStatus = () => {
    if (!task.due_date) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(task.due_date);
    due.setHours(0, 0, 0, 0);

    const diffDays = Math.ceil((due - today) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { label: `Overdue (${Math.abs(diffDays)}d)`, level: 'overdue' };
    }
    if (diffDays === 0) {
      return { label: 'Due Today', level: 'today' };
    }
    if (diffDays === 1) {
      return { label: 'Due Tomorrow', level: 'tomorrow' };
    }
    if (diffDays <= 4) {
      return { label: `In ${diffDays} days`, level: 'soon' };
    }
    return { label: task.due_date.split('T')[0], level: 'normal' };
  };

  const dueStatus = getDueStatus();

  const handleCheckboxClick = () => {
    if (!isCompleted) {
      sound.playComplete();
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 }
      });
    }
    onToggleComplete(task);
  };

  return (
    <div 
      className={`glass-card glass-card-interactive ${isCompleted ? 'task-completed-card' : ''}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        opacity: isCompleted ? 0.75 : 1,
        transition: 'all 0.2s ease',
        borderLeft: `4px solid ${
          task.priority === 'High' 
            ? 'var(--color-high)' 
            : task.priority === 'Medium' 
            ? 'var(--color-medium)' 
            : 'var(--color-low)'
        }`
      }}
    >
      <div>
        {/* Header row with badges */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.4rem' }}>
          <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
            <span className={`badge badge-${task.task_type.toLowerCase()}`}>
              {task.task_type === 'Exam' && <GraduationCap size={12} />}
              {task.task_type}
            </span>

            <span className={`badge badge-${task.priority.toLowerCase()}`}>
              {task.priority}
            </span>
          </div>

          {dueStatus && (
            <span style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              padding: '0.2rem 0.6rem',
              borderRadius: 'var(--radius-full)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem',
              background: 
                dueStatus.level === 'overdue' ? 'rgba(4, 120, 87, 0.14)' :
                dueStatus.level === 'today' ? '#dcfce7' :
                dueStatus.level === 'tomorrow' ? '#f0fdf4' :
                '#f1f5f9',
              color: 
                dueStatus.level === 'overdue' ? '#047857' :
                dueStatus.level === 'today' ? '#059669' :
                dueStatus.level === 'tomorrow' ? '#10b981' :
                'var(--text-muted)'
            }}>
              <Calendar size={12} />
              {dueStatus.label}
            </span>
          )}
        </div>

        {/* Title & Checkbox */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '0.6rem' }}>
          <button
            onClick={handleCheckboxClick}
            aria-label={isCompleted ? 'Mark as incomplete' : 'Mark as complete'}
            style={{
              width: '22px',
              height: '22px',
              borderRadius: '6px',
              border: `2px solid ${isCompleted ? 'var(--color-low)' : '#cbd5e1'}`,
              background: isCompleted ? 'var(--color-low)' : 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: '3px',
              flexShrink: 0,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            {isCompleted && <Check size={14} color="#fff" strokeWidth={3} />}
          </button>

          <h4 style={{
            fontSize: '1.05rem',
            fontWeight: 700,
            lineHeight: 1.35,
            textDecoration: isCompleted ? 'line-through' : 'none',
            color: isCompleted ? 'var(--text-muted)' : 'var(--text-main)'
          }}>
            {task.title}
          </h4>
        </div>

        {/* Subject tag & Description */}
        {task.subject_name && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem', color: 'var(--color-subject)', background: 'var(--color-subject-bg)', padding: '0.2rem 0.55rem', borderRadius: 'var(--radius-sm)', marginBottom: '0.6rem' }}>
            <BookOpen size={13} />
            <span>{task.subject_name}</span>
          </div>
        )}

        {task.description && (
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.8rem', lineHeight: 1.45 }}>
            {task.description}
          </p>
        )}
      </div>

      {/* Footer with study time logged and actions */}
      <div style={{
        paddingTop: '0.75rem',
        borderTop: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: '0.5rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          <Clock size={14} />
          <span>
            {task.actual_minutes > 0 ? (
              <strong style={{ color: 'var(--color-low)' }}>{task.actual_minutes}m</strong>
            ) : '0m'} / {task.duration_minutes || 30}m
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          {!isCompleted && onStartFocus && (
            <button
              className="btn btn-primary btn-sm"
              onClick={() => onStartFocus(task)}
              title="Start Pomodoro Study Session"
              style={{ padding: '0.35rem 0.7rem', fontSize: '0.8rem' }}
            >
              <Play size={13} />
              <span>Focus</span>
            </button>
          )}

          <button
            className="btn-icon btn-ghost btn-sm"
            onClick={() => onEdit(task)}
            title="Edit Task"
            aria-label="Edit Task"
          >
            <Edit3 size={15} />
          </button>

          <button
            className="btn-icon btn-ghost btn-sm"
            onClick={() => onDelete(task.task_id)}
            title="Delete Task"
            aria-label="Delete Task"
            style={{ color: 'var(--text-dim)' }}
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
