import axios from 'axios'

// INTENTIONAL ISSUE: Global axios defaults used instead of scoped instance
// This means any component can accidentally pollute the headers

const api = axios.create({
  baseURL: '/api',
})

// Interceptor to attach token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('talenthub_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// INTENTIONAL ISSUE: No response interceptor — 401s aren't handled globally
// Users stay on the page with broken UI instead of being redirected to login

export const candidatesApi = {
  getAll: (page=1, limit=10) => api.get('/candidates',{params:{page,limit}}),
  getById: (id) => api.get(`/candidates/${id}`),
  create: (data) => api.post('/candidates', data),
  update: (id, data) => api.put(`/candidates/${id}`, data),
  delete: (id) => api.delete(`/candidates/${id}`),
  getApplications: (id) => api.get(`/candidates/${id}/applications`),
  getNotes: (id) => api.get(`/candidates/${id}/notes`),
  search: (params) => api.get('/candidates/search', { params }),
  bulkUpdate: (data) => api.post('/candidates/bulk-update', data),
}

export const jobsApi = {
  getAll: (params) => api.get('/jobs', { params }),
  getById: (id) => api.get(`/jobs/${id}`),
  create: (data) => api.post('/jobs', data),
  update: (id, data) => api.put(`/jobs/${id}`, data),
  delete: (id) => api.delete(`/jobs/${id}`),
  getApplications: (id) => api.get(`/jobs/${id}/applications`),
  getStats: (id) => api.get(`/jobs/${id}/stats`),
  getDepartments: () => api.get('/jobs/departments'),
}

export const applicationsApi = {
  getAll: (params) => api.get('/applications', { params }),
  getById: (id) => api.get(`/applications/${id}`),
  create: (data) => api.post('/applications', data),
  update: (id, data) => api.put(`/applications/${id}`, data),
  updateStatus: (id, data) => api.patch(`/applications/${id}/status`, data),
  delete: (id) => api.delete(`/applications/${id}`),
}

export const notesApi = {
  getByApplication: (applicationId) => api.get(`/notes/application/${applicationId}`),
  getById: (id) => api.get(`/notes/${id}`),
  create: (data) => api.post('/notes', data),
  update: (id, data) => api.put(`/notes/${id}`, data),
  delete: (id) => api.delete(`/notes/${id}`),
}

export const dashboardApi = {
  getStats: () => api.get('/dashboard/stats'),
  getFunnel: () => api.get('/dashboard/funnel'),
  getDepartments: () => api.get('/dashboard/departments'),
}

export const usersApi = {
  getAll: () => api.get('/users'),
  getById: (id) => api.get(`/users/${id}`),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
}

export default api
