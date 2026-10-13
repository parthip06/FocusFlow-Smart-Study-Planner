import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { scheduleAPI } from '../services/api';
import { sound } from '../services/sound';
import { 
  CalendarClock, 
  Sparkles, 
  Clock, 
  Calendar, 
  Coffee, 
  AlertTriangle, 
  CheckCircle2, 
  Save, 
  Lightbulb, 
  BookOpen, 
  Flame, 
  Zap,
  Info,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export default function Planner({ onStartFocus }) {
  const [targetDate, setTargetDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [availableMinutes, setAvailableMinutes] = useState(120);
  const [startTime, setStartTime] = useState('16:00');
  const [maxBlockMinutes, setMaxBlockMinutes] = useState(45);
  const [includeBreaks, setIncludeBreaks] = useState(true);
  const [breakDurationMinutes, setBreakDurationMinutes] = useState(10);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [scheduleData, setScheduleData] = useState(null);
  const [error, setError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');

  const handleGenerate = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError('');
    setSaveSuccess('');

    try {
      const res = await scheduleAPI.generateSchedule({
        targetDate,
        availableMinutes,
        startTime,
        maxBlockMinutes,
        includeBreaks,
        breakDurationMinutes
      });

      if (res.data.success) {
        setScheduleData(res.data);
        sound.playComplete();
      }
    } catch (err) {
      console.error('Schedule generation failed:', err);
      setError(err.response?.data?.message || 'Failed to generate study schedule.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToPlanner = async () => {
    if (!scheduleData || !scheduleData.schedule) return;
    setSaving(true);
    setSaveSuccess('');
    try {
      const res = await scheduleAPI.saveSchedule({
        sessions: scheduleData.schedule,
        targetDate
      });
      if (res.data.success) {
        setSaveSuccess(`Saved ${res.data.savedCount} sessions to your permanent planner!`);
        sound.playComplete();
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
    } catch (err) {
      console.error('Failed to save schedule:', err);
      setError('Failed to save study sessions to database.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-wrapper">
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--primary-light)', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.35rem' }}>
          <Zap size={18} />
          <span>DAILY STUDY PLANNER · AUTOMATIC SCHEDULER</span>
        </div>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.4rem' }}>Study Planner</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', maxWidth: '750px' }}>
          Organize a realistic, balanced daily study schedule based on deadlines, priorities, and your available study time.
        </p>
      </div>

      {/* Generator Configuration Card */}
      <div className="glass-card" style={{ marginBottom: '2.5rem', border: '1px solid #bbf7d0' }}>
        <h3 style={{ fontSize: '1.2rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Sparkles size={18} color="var(--primary-light)" />
          <span>Planner Parameters</span>
        </h3>

        <form onSubmit={handleGenerate}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
            {/* Target Date */}
            <div className="form-group">
              <label className="form-label" htmlFor="plan-date">Study Date</label>
              <input
                id="plan-date"
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                required
              />
            </div>

            {/* Available Study Time */}
            <div className="form-group">
              <label className="form-label" htmlFor="plan-avail-mins">
                Available Study Time: <strong style={{ color: 'var(--primary-light)' }}>{availableMinutes} mins</strong> ({Math.floor(availableMinutes / 60)}h {availableMinutes % 60}m)
              </label>
              <input
                id="plan-avail-mins"
                type="range"
                min="30"
                max="360"
                step="15"
                value={availableMinutes}
                onChange={(e) => setAvailableMinutes(Number(e.target.value))}
                style={{ accentColor: 'var(--primary)' }}
              />
              {/* Quick presets */}
              <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.35rem' }}>
                {[60, 90, 120, 180, 240].map(mins => (
                  <button
                    key={mins}
                    type="button"
                    className="btn btn-ghost btn-sm"
                    style={{
                      fontSize: '0.72rem',
                      padding: '0.15rem 0.45rem',
                      borderRadius: 'var(--radius-sm)',
                      background: availableMinutes === mins ? 'var(--primary-glow)' : 'rgba(255, 255, 255, 0.05)',
                      color: availableMinutes === mins ? '#fff' : 'var(--text-muted)'
                    }}
                    onClick={() => setAvailableMinutes(mins)}
                  >
                    {mins / 60}h
                  </button>
                ))}
              </div>
            </div>

            {/* Preferred Start Time */}
            <div className="form-group">
              <label className="form-label" htmlFor="plan-start-time">Session Start Time</label>
              <input
                id="plan-start-time"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              />
            </div>

            {/* Max Session Block */}
            <div className="form-group">
              <label className="form-label" htmlFor="plan-block">Session Block Size</label>
              <select
                id="plan-block"
                value={maxBlockMinutes}
                onChange={(e) => setMaxBlockMinutes(Number(e.target.value))}
              >
                <option value="25">25 min (Classic Pomodoro)</option>
                <option value="45">45 min (Deep Focus Chunk)</option>
                <option value="60">60 min (Extended Study Block)</option>
              </select>
            </div>
          </div>

          {/* Breaks Options */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            padding: '1rem',
            background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            marginBottom: '1.5rem',
            gap: '1rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <input
                type="checkbox"
                id="break-toggle"
                checked={includeBreaks}
                onChange={(e) => setIncludeBreaks(e.target.checked)}
                style={{ width: '18px', height: '18px', accentColor: 'var(--primary)' }}
              />
              <label htmlFor="break-toggle" style={{ fontSize: '0.9rem', cursor: 'pointer', fontWeight: 600 }}>
                Schedule restorative micro-breaks between sessions
              </label>
            </div>

            {includeBreaks && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                <Coffee size={16} color="var(--color-medium)" />
                <span>Break length:</span>
                <select
                  value={breakDurationMinutes}
                  onChange={(e) => setBreakDurationMinutes(Number(e.target.value))}
                  style={{ width: 'auto', padding: '0.35rem 0.75rem', fontSize: '0.85rem' }}
                >
                  <option value="5">5 minutes</option>
                  <option value="10">10 minutes</option>
                  <option value="15">15 minutes</option>
                </select>
              </div>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.95rem', fontSize: '1rem' }}
            disabled={loading}
          >
            {loading ? 'Generating Daily Schedule...' : (
              <>
                <Sparkles size={18} />
                <span>Generate Daily Schedule</span>
              </>
            )}
          </button>
        </form>
      </div>

      {error && (
        <div style={{
          padding: '1rem 1.25rem',
          borderRadius: 'var(--radius-md)',
          background: 'rgba(244, 63, 94, 0.12)',
          border: '1px solid rgba(244, 63, 94, 0.3)',
          color: 'var(--color-high)',
          marginBottom: '1.75rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      {saveSuccess && (
        <div style={{
          padding: '1rem 1.25rem',
          borderRadius: 'var(--radius-md)',
          background: 'rgba(16, 185, 129, 0.12)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          color: 'var(--color-low)',
          marginBottom: '1.75rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontWeight: 600
        }}>
          <CheckCircle2 size={18} />
          <span>{saveSuccess}</span>
        </div>
      )}

      {/* Generated Schedule Results */}
      {scheduleData && (
        <div>
          {/* Summary Banner */}
          <div className="glass-card" style={{
            background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)',
            border: '1px solid #bbf7d0',
            marginBottom: '2rem',
            boxShadow: '0 8px 24px -4px rgba(16, 185, 129, 0.08)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.35rem', marginBottom: '0.2rem', color: 'var(--text-main)' }}>
                  Generated Study Plan for {scheduleData.targetDate}
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  {scheduleData.summary.sessionsCount} study blocks · {scheduleData.summary.effectiveStudyMinutes}m total focus · {scheduleData.summary.totalBreakMinutes}m breaks
                </p>
              </div>

              <button
                className="btn btn-primary"
                onClick={handleSaveToPlanner}
                disabled={saving || scheduleData.schedule.length === 0}
              >
                <Save size={16} />
                <span>{saving ? 'Saving...' : 'Save Schedule to My Tasks'}</span>
              </button>
            </div>

            {/* Metrics Chips */}
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <div style={{ padding: '0.45rem 0.85rem', borderRadius: 'var(--radius-md)', background: '#dcfce7', color: '#047857', fontSize: '0.85rem', fontWeight: 700 }}>
                Effective Study: {scheduleData.summary.effectiveStudyMinutes}m
              </div>
              <div style={{ padding: '0.45rem 0.85rem', borderRadius: 'var(--radius-md)', background: '#ecfdf5', color: '#059669', fontSize: '0.85rem', fontWeight: 700 }}>
                Rest Periods: {scheduleData.summary.totalBreakMinutes}m
              </div>
              {scheduleData.overflowTasks.length > 0 && (
                <div style={{ padding: '0.45rem 0.85rem', borderRadius: 'var(--radius-md)', background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', fontSize: '0.85rem', fontWeight: 700 }}>
                  Overflow Held for Later: {scheduleData.overflowTasks.length} tasks
                </div>
              )}
            </div>
          </div>

          {/* Schedule Timeline */}
          <div style={{ marginBottom: '2.5rem' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Timeline & Focus Blocks</h3>

            {scheduleData.schedule.length === 0 ? (
              <div className="glass-card" style={{ textAlign: 'center', padding: '2.5rem' }}>
                <CheckCircle2 size={36} color="var(--color-low)" style={{ margin: '0 auto 0.75rem' }} />
                <h4>All Caught Up!</h4>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  No pending tasks found requiring study today. Great job staying ahead!
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {scheduleData.schedule.map((item, idx) => {
                  if (item.isBreak) {
                    return (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '1rem',
                          padding: '0.85rem 1.25rem',
                          borderRadius: 'var(--radius-lg)',
                          background: 'rgba(16, 185, 129, 0.08)',
                          border: '1px dashed #86efac',
                          color: '#15803d'
                        }}
                      >
                        <div style={{
                          minWidth: '130px',
                          fontWeight: 700,
                          fontSize: '0.9rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem'
                        }}>
                          <Clock size={15} />
                          <span>{item.startTimeStr} – {item.endTimeStr}</span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <Coffee size={18} />
                          <div>
                            <strong style={{ fontSize: '0.92rem' }}>{item.title}</strong>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: '0.75rem' }}>
                              ({item.durationMinutes} mins) · {item.focusTip}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={idx}
                      className="glass-card"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '1.1rem 1.4rem',
                        borderLeft: `4px solid ${
                          item.priority === 'High' ? 'var(--color-high)' :
                          item.priority === 'Medium' ? 'var(--color-medium)' :
                          'var(--color-low)'
                        }`,
                        flexWrap: 'wrap',
                        gap: '1rem'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.25rem', flex: 1, minWidth: '280px' }}>
                        {/* Time Slot Badge */}
                        <div style={{
                          minWidth: '140px',
                          padding: '0.5rem 0.75rem',
                          background: 'rgba(255, 255, 255, 0.04)',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--border-subtle)',
                          textAlign: 'center'
                        }}>
                          <div style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--text-main)' }}>
                            {item.startTimeStr} – {item.endTimeStr}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                            {item.durationMinutes} minutes
                          </div>
                        </div>

                        {/* Task Details */}
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
                            <span className={`badge badge-${item.taskType.toLowerCase()}`}>
                              {item.taskType}
                            </span>
                            <span className={`badge badge-${item.priority.toLowerCase()}`}>
                              {item.priority}
                            </span>
                            {item.subject && (
                              <span style={{ fontSize: '0.8rem', color: 'var(--color-subject)', background: 'var(--color-subject-bg)', padding: '0.15rem 0.5rem', borderRadius: 'var(--radius-sm)', fontWeight: 600 }}>
                                {item.subject}
                              </span>
                            )}
                          </div>

                          <h4 style={{ fontSize: '1.1rem', marginBottom: '0.35rem' }}>
                            {item.title}
                          </h4>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.82rem', color: 'var(--primary-light)' }}>
                            <Lightbulb size={14} />
                            <span>{item.focusTip}</span>
                          </div>
                        </div>
                      </div>

                      {/* Action */}
                      {onStartFocus && (
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => onStartFocus({ task_id: item.taskId, title: item.title, subject_name: item.subject })}
                        >
                          <Flame size={14} />
                          <span>Start Pomodoro</span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Overflow Warning Drawer */}
          {scheduleData.overflowTasks.length > 0 && (
            <div className="glass-card" style={{
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              marginBottom: '2rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', color: '#047857' }}>
                <AlertTriangle size={18} />
                <h4 style={{ fontSize: '1.05rem', color: '#047857' }}>
                  Tasks Saved for Upcoming Days ({scheduleData.overflowTasks.length} Tasks)
                </h4>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem', lineHeight: 1.45 }}>
                To keep your study session balanced and effective within your {availableMinutes} minutes, the following tasks are held for upcoming study sessions:
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.75rem' }}>
                {scheduleData.overflowTasks.map((ov, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '0.75rem 1rem',
                      background: 'rgba(255, 255, 255, 0.03)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-subtle)',
                      fontSize: '0.85rem'
                    }}
                  >
                    <div style={{ fontWeight: 600 }}>{ov.title}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                      {ov.subject || 'General'} · Due: {ov.dueDate ? ov.dueDate.split('T')[0] : 'Open'} · Priority: {ov.priority}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
