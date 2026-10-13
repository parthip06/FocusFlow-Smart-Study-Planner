import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Sparkles, 
  Timer, 
  Bell, 
  LogOut, 
  User, 
  Menu, 
  X,
  Flame,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

export default function Navbar({ onToggleSidebar, onOpenTimer, alerts = [] }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="navbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button 
          className="btn-icon btn-ghost mobile-only" 
          onClick={onToggleSidebar}
          aria-label="Toggle Navigation Menu"
          style={{ display: 'none' }}
        >
          <Menu size={22} />
        </button>

        <Link to="/dashboard" className="navbar-brand">
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: 'var(--gradient-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px var(--primary-glow)'
          }}>
            <Sparkles size={20} color="#fff" />
          </div>
          <span>FocusFlow</span>
        </Link>
      </div>

      <div className="navbar-actions">
        {/* Study Streak Badge */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          padding: '0.4rem 0.85rem',
          borderRadius: 'var(--radius-full)',
          background: '#dcfce7',
          border: '1px solid #86efac',
          color: '#15803d',
          fontSize: '0.85rem',
          fontWeight: 700
        }}>
          <Flame size={16} />
          <span>Active Focus</span>
        </div>

        {/* Pomodoro Quick Launch */}
        <button 
          className="btn btn-secondary btn-sm"
          onClick={onOpenTimer}
          title="Open Focus Pomodoro Timer"
          style={{ gap: '0.4rem' }}
        >
          <Timer size={16} color="var(--primary)" />
          <span>Timer</span>
        </button>

        {/* Notifications Popover */}
        <div style={{ position: 'relative' }}>
          <button 
            className="btn-icon btn-ghost" 
            onClick={() => setShowNotifications(!showNotifications)}
            title="Deadlines & Reminders"
            aria-label="Notifications"
            style={{ position: 'relative' }}
          >
            <Bell size={19} />
            {alerts.length > 0 && (
              <span style={{
                position: 'absolute',
                top: '4px',
                right: '4px',
                width: '18px',
                height: '18px',
                background: '#059669',
                color: '#fff',
                fontSize: '0.7rem',
                fontWeight: 700,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 8px rgba(5, 150, 105, 0.4)'
              }}>
                {alerts.length}
              </span>
            )}
          </button>

          {showNotifications && (
            <div style={{
              position: 'absolute',
              top: 'calc(100% + 10px)',
              right: 0,
              width: '320px',
              background: '#ffffff',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: '0 12px 36px rgba(0, 0, 0, 0.12)',
              padding: '1rem',
              zIndex: 60,
              animation: 'fadeIn 0.15s ease-out'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '0.75rem',
                borderBottom: '1px solid var(--border-subtle)',
                paddingBottom: '0.5rem'
              }}>
                <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Reminders & Alerts</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {alerts.length} urgent
                </span>
              </div>

              {alerts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '1.25rem 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  <CheckCircle2 size={24} color="var(--color-low)" style={{ margin: '0 auto 0.5rem' }} />
                  You're all caught up! No imminent deadlines.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', maxHeight: '240px', overflowY: 'auto' }}>
                  {alerts.map((alert, idx) => (
                    <div 
                      key={idx} 
                      style={{
                        padding: '0.65rem 0.8rem',
                        background: alert.isOverdue ? 'rgba(244, 63, 94, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                        borderLeft: `3px solid ${alert.isOverdue ? 'var(--color-high)' : 'var(--color-medium)'}`,
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.82rem'
                      }}
                    >
                      <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <AlertTriangle size={14} color={alert.isOverdue ? 'var(--color-high)' : 'var(--color-medium)'} />
                        <span>{alert.title}</span>
                      </div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.2rem' }}>
                        {alert.message}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* User Badge */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          padding: '0.3rem 0.75rem',
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: 'var(--radius-full)',
          border: '1px solid var(--border-subtle)'
        }}>
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            background: 'var(--gradient-accent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: '0.8rem',
            color: '#fff'
          }}>
            {user?.name ? user.name[0].toUpperCase() : 'S'}
          </div>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user?.name || 'Student'}
          </span>
        </div>

        {/* Logout */}
        <button 
          className="btn-icon btn-ghost" 
          onClick={handleLogout} 
          title="Log out"
          aria-label="Logout"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}
