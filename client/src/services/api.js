import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor: attach token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('focusflow_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401 unauth
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token and let state handle redirect if not on login/register
      const isAuthPath = window.location.pathname === '/login' || window.location.pathname === '/register';
      if (!isAuthPath) {
        localStorage.removeItem('focusflow_token');
        localStorage.removeItem('focusflow_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth endpoints
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me')
};

// Task endpoints
export const taskAPI = {
  getTasks: (params) => api.get('/tasks', { params }),
  getSubjects: () => api.get('/tasks/subjects'),
  createTask: (data) => api.post('/tasks', data),
  getTaskById: (id) => api.get(`/tasks/${id}`),
  updateTask: (id, data) => api.put(`/tasks/${id}`, data),
  deleteTask: (id) => api.delete(`/tasks/${id}`),
  completeTask: (id, data) => api.patch(`/tasks/${id}/complete`, data),
  logStudyTime: (id, minutes) => api.post(`/tasks/${id}/log-time`, { minutes })
};

// Schedule endpoints
export const scheduleAPI = {
  generateSchedule: (data) => api.post('/schedule/generate', data),
  saveSchedule: (data) => api.post('/schedule/save', data),
  getTodaySchedule: () => api.get('/schedule/today')
};

// Dashboard endpoints
export const dashboardAPI = {
  getStats: () => api.get('/dashboard')
};

export default api;
