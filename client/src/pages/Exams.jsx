import React, { useState, useEffect } from 'react';
import { taskAPI } from '../services/api';
import TaskModal from '../components/TaskModal';
import { 
  GraduationCap, 
  Plus, 
  Calendar, 
  Clock, 
  AlertCircle, 
  BookOpen, 
  CheckCircle2, 
  Play, 
  Edit3, 
  Trash2 
} from 'lucide-react';

export default function Exams({ onStartFocus }) {
  const [exams, setExams] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [subjectNames, setSubjectNames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [examToEdit, setExamToEdit] = useState(null);

  const fetchExams = async () => {
    try {
      setLoading(true);
      const [examsRes, subjectsRes] = await Promise.all([
        taskAPI.getTasks({ task_type: 'Exam' }),
        taskAPI.getSubjects()
      ]);

      if (examsRes.data.success) {
        setExams(examsRes.data.tasks);
      }
      if (subjectsRes.data.success) {
        setSubjects(subjectsRes.data.subjects);
        setSubjectNames(subjectsRes.data.subjectNames);
      }
    } catch (err) {
      console.error('Error fetching exams:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExams();
  }, []);

  const handleToggleStatus = async (exam) => {
    try {
      const nextStatus = 
        exam.status === 'Pending' ? 'In Progress' :
        exam.status === 'In Progress' ? 'Completed' : 'Pending';
      await taskAPI.completeTask(exam.task_id, { status: nextStatus });
      fetchExams();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this exam?')) {
      try {
        await taskAPI.deleteTask(id);
        fetchExams();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleSave = async (formData, id) => {
    formData.task_type = 'Exam';
    if (id) {
      await taskAPI.updateTask(id, formData);
    } else {
      await taskAPI.createTask(formData);
    }
    fetchExams();
  };

  const getDaysRemaining = (dueDateStr) => {
    if (!dueDateStr) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDateStr);
    due.setHours(0, 0, 0, 0);
    return Math.ceil((due - today) / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="page-wrapper">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-exam)', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.35rem' }}>
            <GraduationCap size={18} />
            <span>EXAMINATION HUB · REVISION TRACKER</span>
          </div>
          <h1 style={{ fontSize: '1.85rem', marginBottom: '0.3rem' }}>Exam Preparation & Deadlines</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Never miss an exam date. Pace your preparation across days with structured revision blocks.
          </p>
        </div>

        <button 
          className="btn btn-primary"
          onClick={() => {
            setExamToEdit(null);
            setIsModalOpen(true);
          }}
        >
          <Plus size={16} />
          <span>Add Upcoming Exam</span>
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
          Loading exams...
        </div>
      ) : exams.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '3.5rem 1.5rem' }}>
          <GraduationCap size={44} color="var(--color-exam)" style={{ margin: '0 auto 0.75rem', opacity: 0.8 }} />
          <h4 style={{ fontSize: '1.2rem', marginBottom: '0.4rem' }}>No Upcoming Exams Registered</h4>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', maxWidth: '450px', margin: '0 auto 1.25rem' }}>
            Add your midterms, finals, or quiz dates so FocusFlow can balance daily study sessions.
          </p>
          <button 
            className="btn btn-primary btn-sm"
            onClick={() => {
              setExamToEdit(null);
              setIsModalOpen(true);
            }}
          >
            <Plus size={16} />
            <span>Add Your First Exam</span>
          </button>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
          gap: '1.5rem'
        }}>
          {exams.map(exam => {
            const daysLeft = getDaysRemaining(exam.due_date);
            const planned = exam.duration_minutes || 60;
            const studied = exam.actual_minutes || 0;
            const progress = Math.min(100, Math.round((studied / planned) * 100));

            return (
              <div 
                key={exam.task_id}
                className="glass-card glass-card-interactive"
                style={{
                  borderTop: `4px solid ${
                    daysLeft !== null && daysLeft <= 3 ? 'var(--color-high)' :
                    daysLeft !== null && daysLeft <= 7 ? 'var(--color-medium)' :
                    'var(--color-exam)'
                  }`,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  {/* Top Badge Row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span className="badge badge-exam">Exam</span>
                      <span className={`badge badge-${exam.priority.toLowerCase()}`}>{exam.priority}</span>
                    </div>

                    {daysLeft !== null && (
                      <span style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        background: 
                          daysLeft < 0 ? 'rgba(0, 0, 0, 0.05)' :
                          daysLeft <= 3 ? 'var(--color-high-bg)' :
                          daysLeft <= 7 ? 'var(--color-medium-bg)' :
                          '#dcfce7',
                        color: 
                          daysLeft < 0 ? 'var(--text-muted)' :
                          daysLeft <= 3 ? 'var(--color-high)' :
                          daysLeft <= 7 ? 'var(--color-medium)' :
                          'var(--color-exam)'
                      }}>
                        {daysLeft < 0 ? 'Completed / Past' :
                         daysLeft === 0 ? 'Today!' :
                         daysLeft === 1 ? 'Tomorrow!' :
                         `In ${daysLeft} days`}
                      </span>
                    )}
                  </div>

                  {/* Title & Subject */}
                  <h3 style={{ fontSize: '1.25rem', marginBottom: '0.35rem' }}>
                    {exam.title}
                  </h3>

                  {exam.subject_name && (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.82rem', color: 'var(--color-subject)', background: 'var(--color-subject-bg)', padding: '0.2rem 0.55rem', borderRadius: 'var(--radius-sm)', marginBottom: '0.75rem' }}>
                      <BookOpen size={13} />
                      <span>{exam.subject_name}</span>
                    </div>
                  )}

                  {exam.description && (
                    <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: 1.45, marginBottom: '1rem' }}>
                      {exam.description}
                    </p>
                  )}

                  {/* Exam Date */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                    <Calendar size={15} color="var(--primary-light)" />
                    <span>Exam Date: <strong style={{ color: 'var(--text-main)' }}>{exam.due_date ? exam.due_date.split('T')[0] : 'TBD'}</strong></span>
                  </div>

                  {/* Revision Progress */}
                  <div style={{
                    padding: '0.85rem',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--border-subtle)',
                    marginBottom: '1rem'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                      <span>Revision Time</span>
                      <span><strong>{studied}m</strong> studied of {planned}m planned ({progress}%)</span>
                    </div>
                    <div className="progress-container">
                      <div className="progress-bar-fill" style={{ width: `${progress}%`, background: 'var(--gradient-primary)' }} />
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div style={{
                  paddingTop: '0.85rem',
                  borderTop: '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <button
                    className={`btn btn-sm ${
                      exam.status === 'Completed' ? 'btn-secondary' :
                      exam.status === 'In Progress' ? 'btn-primary' : 'btn-ghost'
                    }`}
                    style={{ fontSize: '0.78rem', padding: '0.35rem 0.7rem' }}
                    onClick={() => handleToggleStatus(exam)}
                  >
                    <span>Status: <strong>{exam.status}</strong></span>
                  </button>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    {onStartFocus && (
                      <button
                        className="btn btn-primary btn-sm"
                        style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
                        onClick={() => onStartFocus(exam)}
                      >
                        <Play size={12} />
                        <span>Revise</span>
                      </button>
                    )}

                    <button
                      className="btn-icon btn-ghost btn-sm"
                      onClick={() => {
                        setExamToEdit(exam);
                        setIsModalOpen(true);
                      }}
                      title="Edit Exam"
                    >
                      <Edit3 size={15} />
                    </button>

                    <button
                      className="btn-icon btn-ghost btn-sm"
                      onClick={() => handleDelete(exam.task_id)}
                      title="Delete Exam"
                      style={{ color: 'var(--text-dim)' }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <TaskModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setExamToEdit(null);
        }}
        onSave={handleSave}
        taskToEdit={examToEdit}
        defaultType="Exam"
        subjectNames={subjectNames}
      />
    </div>
  );
}
