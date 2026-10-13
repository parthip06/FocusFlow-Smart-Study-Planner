import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { sound } from '../services/sound';
import { taskAPI } from '../services/api';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  X, 
  CheckCircle2, 
  BookOpen, 
  Coffee, 
  Flame,
  Volume2
} from 'lucide-react';

export default function PomodoroTimer({ isOpen, onClose, tasks = [], onTimeLogged }) {
  const MODES = {
    focus: { label: 'Focus Study', duration: 25 * 60, color: '#059669' },
    shortBreak: { label: 'Short Break', duration: 5 * 60, color: '#10b981' },
    longBreak: { label: 'Long Break', duration: 15 * 60, color: '#047857' }
  };

  const [mode, setMode] = useState('focus');
  const [timeLeft, setTimeLeft] = useState(MODES.focus.duration);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState('');
  const [isLogging, setIsLogging] = useState(false);
  const [logSuccessMessage, setLogSuccessMessage] = useState('');

  const timerRef = useRef(null);

  // Set default selected task
  useEffect(() => {
    if (!isOpen) return;
    if (tasks.length > 0 && !selectedTaskId) {
      const activeTask = tasks.find(t => t.task_type !== 'Subject' && t.status !== 'Completed');
      if (activeTask) setSelectedTaskId(activeTask.task_id);
    }
  }, [isOpen, tasks, selectedTaskId]);

  // Timer countdown loop
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setIsRunning(false);
            handleSessionCompleted();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isRunning, mode]);

  const switchMode = (newMode) => {
    setIsRunning(false);
    setMode(newMode);
    setTimeLeft(MODES[newMode].duration);
    setLogSuccessMessage('');
  };

  const toggleTimer = () => {
    sound.playTick();
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(MODES[mode].duration);
    setLogSuccessMessage('');
  };

  const handleSessionCompleted = () => {
    sound.playComplete();
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    });

    if (mode === 'focus' && selectedTaskId) {
      logMinutes(25);
    }
  };

  const logMinutes = async (minutesToLog = 25) => {
    if (!selectedTaskId) return;
    setIsLogging(true);
    try {
      await taskAPI.logStudyTime(selectedTaskId, minutesToLog);
      setLogSuccessMessage(`Logged +${minutesToLog} minutes to your task!`);
      if (onTimeLogged) onTimeLogged();
      setTimeout(() => setLogSuccessMessage(''), 4000);
    } catch (err) {
      console.error('Failed to log study time:', err);
    } finally {
      setIsLogging(false);
    }
  };

  if (!isOpen) return null;

  const currentTotal = MODES[mode].duration;
  const progressPercent = ((currentTotal - timeLeft) / currentTotal) * 100;
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  // SVG circular properties
  const radius = 95;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '440px', textAlign: 'center' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Flame size={20} color="var(--primary-light)" />
            <h3 style={{ fontSize: '1.15rem' }}>Pomodoro Study Timer</h3>
          </div>
          <button className="btn-icon btn-ghost" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <div className="modal-body" style={{ alignItems: 'center', padding: '1.5rem 1.5rem 2rem' }}>
          {/* Mode Selector Tabs */}
          <div style={{
            display: 'flex',
            background: '#f1f5f9',
            padding: '0.3rem',
            borderRadius: 'var(--radius-full)',
            gap: '0.3rem',
            width: '100%',
            maxWidth: '340px'
          }}>
            <button
              className={`btn btn-sm ${mode === 'focus' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ flex: 1, borderRadius: 'var(--radius-full)' }}
              onClick={() => switchMode('focus')}
            >
              25m Focus
            </button>
            <button
              className={`btn btn-sm ${mode === 'shortBreak' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ flex: 1, borderRadius: 'var(--radius-full)', background: mode === 'shortBreak' ? 'var(--gradient-green)' : 'transparent', color: mode === 'shortBreak' ? '#fff' : 'inherit' }}
              onClick={() => switchMode('shortBreak')}
            >
              5m Break
            </button>
            <button
              className={`btn btn-sm ${mode === 'longBreak' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ flex: 1, borderRadius: 'var(--radius-full)', background: mode === 'longBreak' ? 'var(--gradient-accent)' : 'transparent', color: mode === 'longBreak' ? '#fff' : 'inherit' }}
              onClick={() => switchMode('longBreak')}
            >
              15m Long
            </button>
          </div>

          {/* Circular Countdown Display */}
          <div style={{ position: 'relative', width: '220px', height: '220px', margin: '1rem 0' }}>
            <svg width="220" height="220" style={{ transform: 'rotate(-90deg)' }}>
              <circle
                cx="110"
                cy="110"
                r={radius}
                stroke="#e2e8f0"
                strokeWidth="10"
                fill="none"
              />
              <circle
                cx="110"
                cy="110"
                r={radius}
                stroke={MODES[mode].color}
                strokeWidth="10"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="none"
                style={{ transition: 'stroke-dashoffset 0.6s ease' }}
              />
            </svg>

            {/* Time readout */}
            <div style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <span style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '3rem',
                fontWeight: 800,
                letterSpacing: '-0.03em'
              }}>
                {formattedTime}
              </span>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                {MODES[mode].label}
              </span>
            </div>
          </div>

          {/* Controls */}
          <div style={{ display: 'flex', gap: '0.8rem', justifyContent: 'center', width: '100%' }}>
            <button
              className="btn btn-primary"
              style={{ minWidth: '130px', padding: '0.85rem 1.5rem', borderRadius: 'var(--radius-full)' }}
              onClick={toggleTimer}
            >
              {isRunning ? <><Pause size={18} /> Pause</> : <><Play size={18} /> Start</>}
            </button>
            <button
              className="btn btn-secondary"
              style={{ borderRadius: 'var(--radius-full)', padding: '0.85rem 1.2rem' }}
              onClick={resetTimer}
              title="Reset Timer"
            >
              <RotateCcw size={18} />
            </button>
          </div>

          {/* Task Link selector */}
          <div style={{ width: '100%', marginTop: '1.25rem', textAlign: 'left' }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.35rem' }}>
              <BookOpen size={14} color="var(--primary-light)" />
              <span>Assign focus time to:</span>
            </label>
            <select
              value={selectedTaskId}
              onChange={(e) => setSelectedTaskId(e.target.value)}
              style={{ fontSize: '0.85rem' }}
            >
              <option value="">-- No specific task (Free focus) --</option>
              {tasks.filter(t => t.task_type !== 'Subject').map(task => (
                <option key={task.task_id} value={task.task_id}>
                  [{task.task_type}] {task.title} ({task.subject_name || 'General'})
                </option>
              ))}
            </select>
          </div>

          {/* Quick manual log button */}
          {selectedTaskId && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => logMinutes(25)}
              disabled={isLogging}
              style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--primary-light)' }}
            >
              + Quick Log 25 Mins to Task
            </button>
          )}

          {logSuccessMessage && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              color: 'var(--color-low)',
              fontSize: '0.82rem',
              fontWeight: 600,
              marginTop: '0.5rem',
              animation: 'fadeIn 0.2s ease-out'
            }}>
              <CheckCircle2 size={16} />
              <span>{logSuccessMessage}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
