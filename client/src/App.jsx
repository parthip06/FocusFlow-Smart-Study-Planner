import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { dashboardAPI, taskAPI } from './services/api';

import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import PomodoroTimer from './components/PomodoroTimer';

import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Tasks from './pages/Tasks';
import Planner from './pages/Planner';
import Exams from './pages/Exams';
import Progress from './pages/Progress';

// Protected Route Wrapper
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--bg-dark)',
        color: 'var(--text-muted)'
      }}>
        Initializing FocusFlow...
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

// Main Authenticated Layout
function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [timerOpen, setTimerOpen] = useState(false);
  const [timerTask, setTimerTask] = useState(null);
  const [activeTasks, setActiveTasks] = useState([]);
  const [alerts, setAlerts] = useState([]);

  const loadNotificationsAndTasks = async () => {
    try {
      const [tasksRes, statsRes] = await Promise.all([
        taskAPI.getTasks({}),
        dashboardAPI.getStats()
      ]);

      if (tasksRes.data.success) {
        setActiveTasks(tasksRes.data.tasks);
      }

      if (statsRes.data.success) {
        const stats = statsRes.data;
        const newAlerts = [];

        // Check overdue
        if (stats.overdueTasks && stats.overdueTasks.length > 0) {
          newAlerts.push({
            isOverdue: true,
            title: `${stats.overdueTasks.length} Overdue Task(s)`,
            message: `Don't fall behind on ${stats.overdueTasks[0].title}`
          });
        }

        // Check upcoming exams in next 3 days
        if (stats.upcomingExams) {
          stats.upcomingExams.forEach(e => {
            if (e.days_remaining !== null && e.days_remaining <= 3 && e.days_remaining >= 0) {
              newAlerts.push({
                isOverdue: false,
                title: `Exam in ${e.days_remaining === 0 ? 'Today' : `${e.days_remaining}d`}: ${e.title}`,
                message: `Focus revision on ${e.subject_name || 'syllabus'}`
              });
            }
          });
        }

        setAlerts(newAlerts);
      }
    } catch (err) {
      console.error('Failed to load alerts/tasks:', err);
    }
  };

  useEffect(() => {
    loadNotificationsAndTasks();
  }, []);

  const handleStartFocus = (task) => {
    setTimerTask(task);
    setTimerOpen(true);
  };

  return (
    <div className="app-container">
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
      />

      <div className="main-content">
        <Navbar 
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onOpenTimer={() => setTimerOpen(true)}
          alerts={alerts}
        />

        <main>
          <Routes>
            <Route path="/dashboard" element={<Dashboard onStartFocus={handleStartFocus} />} />
            <Route path="/tasks" element={<Tasks onStartFocus={handleStartFocus} />} />
            <Route path="/planner" element={<Planner onStartFocus={handleStartFocus} />} />
            <Route path="/exams" element={<Exams onStartFocus={handleStartFocus} />} />
            <Route path="/progress" element={<Progress />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>

      {/* Floating / Modal Pomodoro Timer */}
      <PomodoroTimer
        isOpen={timerOpen}
        onClose={() => setTimerOpen(false)}
        tasks={activeTasks}
        onTimeLogged={loadNotificationsAndTasks}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
