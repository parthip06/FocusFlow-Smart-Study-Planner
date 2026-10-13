import React, { useState, useEffect } from 'react';
import { taskAPI } from '../services/api';
import TaskCard from '../components/TaskCard';
import TaskModal from '../components/TaskModal';
import { 
  Plus, 
  Search, 
  Filter, 
  BookOpen, 
  CheckSquare, 
  GraduationCap, 
  Clock, 
  Layers,
  Sparkles
} from 'lucide-react';

export default function Tasks({ onStartFocus }) {
  const [tasks, setTasks] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [subjectNames, setSubjectNames] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [activeType, setActiveType] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [subjectFilter, setSubjectFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalDefaultType, setModalDefaultType] = useState('Assignment');
  const [taskToEdit, setTaskToEdit] = useState(null);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const params = {};
      if (activeType !== 'All') params.task_type = activeType;
      if (statusFilter !== 'All') params.status = statusFilter;
      if (priorityFilter !== 'All') params.priority = priorityFilter;
      if (subjectFilter !== 'All') params.subject = subjectFilter;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const [tasksRes, subjectsRes] = await Promise.all([
        taskAPI.getTasks(params),
        taskAPI.getSubjects()
      ]);

      if (tasksRes.data.success) {
        setTasks(tasksRes.data.tasks);
      }
      if (subjectsRes.data.success) {
        setSubjects(subjectsRes.data.subjects);
        setSubjectNames(subjectsRes.data.subjectNames);
      }
    } catch (err) {
      console.error('Error fetching tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [activeType, statusFilter, priorityFilter, subjectFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchTasks();
  };

  const handleToggleComplete = async (task) => {
    try {
      await taskAPI.completeTask(task.task_id);
      fetchTasks();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await taskAPI.deleteTask(taskId);
        fetchTasks();
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
    fetchTasks();
  };

  const openNewTaskModal = (type = 'Assignment') => {
    setTaskToEdit(null);
    setModalDefaultType(type);
    setIsModalOpen(true);
  };

  return (
    <div className="page-wrapper">
      {/* Header with Title and Action buttons */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.75rem' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', marginBottom: '0.3rem' }}>Academic Tasks & Subjects</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Organize coursework, manage assignments, and monitor subject completion
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button 
            className="btn btn-secondary"
            onClick={() => openNewTaskModal('Subject')}
          >
            <BookOpen size={16} />
            <span>Add Subject</span>
          </button>

          <button 
            className="btn btn-primary"
            onClick={() => openNewTaskModal('Assignment')}
          >
            <Plus size={16} />
            <span>Add Task</span>
          </button>
        </div>
      </div>

      {/* Category Tabs */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        overflowX: 'auto',
        paddingBottom: '0.5rem',
        marginBottom: '1.25rem',
        borderBottom: '1px solid var(--border-subtle)'
      }}>
        {[
          { key: 'All', label: 'All Items', icon: Layers },
          { key: 'Assignment', label: 'Assignments', icon: CheckSquare },
          { key: 'Exam', label: 'Exams', icon: GraduationCap },
          { key: 'Study', label: 'Study Sessions', icon: Clock },
          { key: 'Subject', label: 'Subjects / Courses', icon: BookOpen }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeType === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveType(tab.key)}
              className={`btn btn-sm ${isActive ? 'btn-primary' : 'btn-ghost'}`}
              style={{
                borderRadius: 'var(--radius-full)',
                padding: '0.55rem 1.1rem',
                gap: '0.4rem'
              }}
            >
              <Icon size={15} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-card" style={{ padding: '1.25rem', marginBottom: '1.75rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', alignItems: 'center' }}>
          {/* Search box */}
          <form onSubmit={handleSearchSubmit} style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder="Search title, description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '2.4rem' }}
            />
            <Search size={16} style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
          </form>

          {/* Status Filter */}
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="All">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
          </select>

          {/* Priority Filter */}
          <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
            <option value="All">All Priorities</option>
            <option value="High">High Priority</option>
            <option value="Medium">Medium Priority</option>
            <option value="Low">Low Priority</option>
          </select>

          {/* Subject Filter */}
          <select value={subjectFilter} onChange={(e) => setSubjectFilter(e.target.value)}>
            <option value="All">All Subjects</option>
            {subjectNames.map((s, idx) => (
              <option key={idx} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Subject Course Cards Preview (Shown when viewing all or subjects) */}
      {(activeType === 'All' || activeType === 'Subject') && subjects.length > 0 && (
        <div style={{ marginBottom: '2.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <BookOpen size={18} color="var(--color-subject)" />
            <h3 style={{ fontSize: '1.2rem' }}>Enrolled Subjects & Courses ({subjects.length})</h3>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '1rem'
          }}>
            {subjects.map(subj => {
              // Calculate tasks linked to this subject
              const linkedTasks = tasks.filter(t => t.subject_name === subj.name && t.task_type !== 'Subject');
              const completedCount = linkedTasks.filter(t => t.status === 'Completed').length;
              const percent = linkedTasks.length > 0 ? Math.round((completedCount / linkedTasks.length) * 100) : 0;

              return (
                <div 
                  key={subj.task_id}
                  className="glass-card"
                  style={{
                    borderTop: '3px solid var(--color-subject)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                      <h4 style={{ fontSize: '1.1rem', color: 'var(--text-main)' }}>{subj.name}</h4>
                      <span className="badge badge-subject">Subject</span>
                    </div>
                    {subj.description && (
                      <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.4, marginBottom: '0.75rem' }}>
                        {subj.description}
                      </p>
                    )}
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                      <span>Course Progress</span>
                      <span>{completedCount}/{linkedTasks.length} tasks ({percent}%)</span>
                    </div>
                    <div className="progress-container">
                      <div className="progress-bar-fill" style={{ width: `${percent}%`, background: 'var(--gradient-accent)' }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Task Cards Grid */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1.2rem' }}>
            {activeType === 'All' ? 'All Tasks' : `${activeType}s`} ({tasks.length})
          </h3>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
            Loading tasks...
          </div>
        ) : tasks.length === 0 ? (
          <div className="glass-card" style={{ textAlign: 'center', padding: '3.5rem 1.5rem' }}>
            <CheckSquare size={38} color="var(--primary-light)" style={{ margin: '0 auto 0.75rem', opacity: 0.8 }} />
            <h4 style={{ fontSize: '1.15rem', marginBottom: '0.4rem' }}>No Tasks Found</h4>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', maxWidth: '420px', margin: '0 auto 1.25rem' }}>
              No tasks match your selected filters. Create a new assignment or clear filters to see your work.
            </p>
            <button className="btn btn-primary btn-sm" onClick={() => openNewTaskModal('Assignment')}>
              <Plus size={15} />
              <span>Add Your First Task</span>
            </button>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '1.25rem'
          }}>
            {tasks.map(task => (
              <TaskCard
                key={task.task_id}
                task={task}
                onToggleComplete={handleToggleComplete}
                onEdit={(t) => {
                  setTaskToEdit(t);
                  setModalDefaultType(t.task_type);
                  setIsModalOpen(true);
                }}
                onDelete={handleDeleteTask}
                onStartFocus={onStartFocus}
              />
            ))}
          </div>
        )}
      </div>

      <TaskModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setTaskToEdit(null);
        }}
        onSave={handleSaveTask}
        taskToEdit={taskToEdit}
        defaultType={modalDefaultType}
        subjectNames={subjectNames}
      />
    </div>
  );
}
