import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  CheckSquare, 
  CalendarClock, 
  GraduationCap, 
  TrendingUp,
  BookOpen,
  Sparkles
} from 'lucide-react';

export default function Sidebar({ isOpen, onClose }) {
  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/tasks', label: 'Tasks & Subjects', icon: CheckSquare },
    { to: '/planner', label: 'Study Planner', icon: CalendarClock },
    { to: '/exams', label: 'Exams', icon: GraduationCap },
    { to: '/progress', label: 'Study Progress', icon: TrendingUp }
  ];

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div>
        <div style={{ padding: '0.5rem 0.75rem', marginBottom: '0.5rem' }}>
          <span style={{ 
            fontSize: '0.72rem', 
            textTransform: 'uppercase', 
            letterSpacing: '0.08em', 
            fontWeight: 700, 
            color: 'var(--text-dim)' 
          }}>
            Academic Menu
          </span>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={onClose}
              >
                <Icon size={19} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Motivational / Pro Tip Card */}
      <div style={{
        padding: '1.1rem',
        borderRadius: 'var(--radius-lg)',
        background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)',
        border: '1px solid #bbf7d0',
        marginTop: 'auto'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#047857', fontWeight: 700, fontSize: '0.82rem', marginBottom: '0.35rem' }}>
          <Sparkles size={15} />
          <span>Study Tip of the Day</span>
        </div>
        <p style={{ fontSize: '0.78rem', color: '#166534', lineHeight: '1.4' }}>
          Break study into 25-50 minute blocks. Spacing topics with restorative micro-breaks boosts long-term retention by 35%.
        </p>
      </div>
    </aside>
  );
}
