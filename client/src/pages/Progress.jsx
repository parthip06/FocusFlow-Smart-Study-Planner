import React, { useState, useEffect } from 'react';
import { dashboardAPI } from '../services/api';
import { 
  Clock, 
  CheckCircle2, 
  Flame, 
  TrendingUp, 
  Award, 
  BookOpen,
  Calendar
} from 'lucide-react';

export default function Progress() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await dashboardAPI.getStats();
        if (res.data.success) {
          setData(res.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="page-wrapper" style={{ textAlign: 'center', padding: '5rem 0', color: 'var(--text-muted)' }}>
        Loading your academic progress...
      </div>
    );
  }

  const stats = data?.stats || {};
  const weeklyAnalytics = data?.weeklyAnalytics || [];
  const subjectStats = data?.subjectStats || [];

  return (
    <div className="page-wrapper">
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary-light)', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.35rem' }}>
          <TrendingUp size={18} />
          <span>STUDY SUMMARY · COURSE OVERVIEW</span>
        </div>
        <h1 style={{ fontSize: '1.85rem', marginBottom: '0.3rem' }}>Academic Study Progress</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Track total study hours, monitor course completion rates, and review past daily study sessions.
        </p>
      </div>

      {/* 4 Summary Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1.25rem',
        marginBottom: '2rem'
      }}>
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Total Hours Studied</span>
            <Clock size={18} color="var(--color-low)" />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800 }}>
            {stats.totalActualHours || 0} hrs
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-low)', marginTop: '0.3rem' }}>
            Logged across Pomodoro & focus sessions
          </div>
        </div>

        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Completion Rate</span>
            <CheckCircle2 size={18} color="var(--primary-light)" />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800 }}>
            {stats.completionRate || 0}%
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--primary-light)', marginTop: '0.3rem' }}>
            {stats.completedTasks || 0} assignments & exams finished
          </div>
        </div>

        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Study Consistency</span>
            <Flame size={18} color="var(--primary-light)" />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800 }}>
            Active
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--primary-light)', marginTop: '0.3rem' }}>
            Regular daily study habit maintained
          </div>
        </div>

        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Workload Balance</span>
            <Award size={18} color="var(--color-exam)" />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800 }}>
            {subjectStats.length} Subjects
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
            Across all active semester courses
          </div>
        </div>
      </div>

      {/* Daily Study Log Breakdown */}
      <div className="glass-card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', marginBottom: '0.2rem' }}>Recent Daily Study Log</h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Minutes focused each day over the past 7 days
            </p>
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: '1rem'
        }}>
          {weeklyAnalytics.map((dayItem, idx) => {
            const studied = dayItem.completedMinutes || 0;
            const planned = dayItem.plannedMinutes || 0;
            const hasActivity = studied > 0 || planned > 0;

            return (
              <div
                key={idx}
                style={{
                  padding: '1rem 0.85rem',
                  borderRadius: 'var(--radius-md)',
                  background: hasActivity ? '#f0fdf4' : '#ffffff',
                  border: `1px solid ${hasActivity ? '#bbf7d0' : 'var(--border-subtle)'}`,
                  textAlign: 'center'
                }}
              >
                <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.35rem', color: 'var(--text-main)' }}>
                  {dayItem.day}
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: studied > 0 ? '#059669' : 'var(--text-dim)', marginBottom: '0.2rem' }}>
                  {studied}m
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  {planned > 0 ? `${planned}m planned` : 'Rest day'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Course Breakdown Table */}
      <div className="glass-card">
        <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Subject Breakdown & Status</h3>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '0.75rem 1rem' }}>Subject / Course</th>
                <th style={{ padding: '0.75rem 1rem' }}>Total Tasks</th>
                <th style={{ padding: '0.75rem 1rem' }}>Completed</th>
                <th style={{ padding: '0.75rem 1rem' }}>Hours Logged</th>
                <th style={{ padding: '0.75rem 1rem' }}>Completion %</th>
              </tr>
            </thead>
            <tbody>
              {subjectStats.map((s, idx) => {
                const total = Number(s.total) || 0;
                const completed = Number(s.completed) || 0;
                const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
                const hours = Math.round(((Number(s.actual_minutes) || 0) / 60) * 10) / 10;

                return (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <BookOpen size={15} color="var(--color-subject)" />
                        <span>{s.subject}</span>
                      </div>
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>{total}</td>
                    <td style={{ padding: '0.85rem 1rem', color: 'var(--color-low)' }}>{completed}</td>
                    <td style={{ padding: '0.85rem 1rem' }}>{hours} hrs</td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div className="progress-container" style={{ width: '100px' }}>
                          <div className="progress-bar-fill" style={{ width: `${rate}%` }} />
                        </div>
                        <span style={{ fontSize: '0.78rem', fontWeight: 700 }}>{rate}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
