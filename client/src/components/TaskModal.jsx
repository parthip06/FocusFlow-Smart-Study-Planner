import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, AlertCircle, BookOpen, Tag } from 'lucide-react';

export default function TaskModal({ 
  isOpen, 
  onClose, 
  onSave, 
  taskToEdit = null, 
  subjectNames = [],
  defaultType = 'Assignment'
}) {
  const [formData, setFormData] = useState({
    title: '',
    task_type: defaultType,
    subject_name: '',
    due_date: '',
    duration_minutes: 45,
    priority: 'Medium',
    description: '',
    status: 'Pending'
  });

  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    if (taskToEdit) {
      setFormData({
        title: taskToEdit.title || '',
        task_type: taskToEdit.task_type || defaultType,
        subject_name: taskToEdit.subject_name || '',
        due_date: taskToEdit.due_date ? taskToEdit.due_date.split('T')[0] : '',
        duration_minutes: taskToEdit.duration_minutes || 45,
        priority: taskToEdit.priority || 'Medium',
        description: taskToEdit.description || '',
        status: taskToEdit.status || 'Pending'
      });
    } else {
      setFormData({
        title: '',
        task_type: defaultType,
        subject_name: (subjectNames && subjectNames.length > 0) ? subjectNames[0] : '',
        due_date: new Date().toISOString().split('T')[0],
        duration_minutes: 45,
        priority: 'Medium',
        description: '',
        status: 'Pending'
      });
    }
    setError('');
  }, [isOpen, taskToEdit, defaultType]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setError('Please enter a title.');
      return;
    }

    setIsSubmitting(true);
    setError('');
    try {
      await onSave(formData, taskToEdit?.task_id);
      onClose();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to save task. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3 style={{ fontSize: '1.2rem' }}>
            {taskToEdit ? `Edit ${formData.task_type}` : `Add New ${formData.task_type || 'Task'}`}
          </h3>
          <button className="btn-icon btn-ghost" onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && (
              <div style={{
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(244, 63, 94, 0.12)',
                border: '1px solid rgba(244, 63, 94, 0.3)',
                color: 'var(--color-high)',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            {/* Title */}
            <div className="form-group">
              <label className="form-label" htmlFor="task-title">Title *</label>
              <input
                id="task-title"
                type="text"
                placeholder="e.g. AI Assignment 3 or DBMS Midterm"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                autoFocus
              />
            </div>

            {/* Task Type and Subject */}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="task-type">Category Type</label>
                <select
                  id="task-type"
                  value={formData.task_type}
                  onChange={(e) => setFormData({ ...formData, task_type: e.target.value })}
                >
                  <option value="Assignment">Assignment</option>
                  <option value="Exam">Exam</option>
                  <option value="Study">Study Session</option>
                  <option value="Subject">Subject Course</option>
                </select>
              </div>

              {formData.task_type !== 'Subject' && (
                <div className="form-group">
                  <label className="form-label" htmlFor="subject-name">Subject / Course</label>
                  <input
                    id="subject-name"
                    type="text"
                    list="available-subjects"
                    placeholder="e.g. Artificial Intelligence"
                    value={formData.subject_name}
                    onChange={(e) => setFormData({ ...formData, subject_name: e.target.value })}
                  />
                  <datalist id="available-subjects">
                    {subjectNames.map((s, idx) => (
                      <option key={idx} value={s} />
                    ))}
                  </datalist>
                </div>
              )}
            </div>

            {/* Due Date & Planned Minutes */}
            {formData.task_type !== 'Subject' && (
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="due-date">
                    {formData.task_type === 'Exam' ? 'Exam Date' : 'Due Date'}
                  </label>
                  <input
                    id="due-date"
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="duration-minutes">
                    Est. Duration (Minutes)
                  </label>
                  <input
                    id="duration-minutes"
                    type="number"
                    min="10"
                    step="5"
                    value={formData.duration_minutes}
                    onChange={(e) => setFormData({ ...formData, duration_minutes: Number(e.target.value) })}
                  />
                </div>
              </div>
            )}

            {/* Priority & Status */}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="priority">Priority</label>
                <select
                  id="priority"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                >
                  <option value="High">High (Crucial)</option>
                  <option value="Medium">Medium (Normal)</option>
                  <option value="Low">Low (Flexible)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="status">Status</label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
            </div>

            {/* Description */}
            <div className="form-group">
              <label className="form-label" htmlFor="description">Notes / Details</label>
              <textarea
                id="description"
                rows="3"
                placeholder="Important syllabus topics, reference links, assignment instructions..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : taskToEdit ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
