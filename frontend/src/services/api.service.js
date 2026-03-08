import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api'

export const apiService = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
})

// ── Request interceptor: attach JWT to every request ──
apiService.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// ── Response interceptor: normalize error messages ──
apiService.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // 401 → session expired, force logout
      if (error.response.status === 401) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        localStorage.removeItem('userRole')
        window.location.href = '/login'
      }
      error.displayMessage =
        error.response.data?.message ||
        error.response.statusText ||
        'Request failed'
    } else if (error.request) {
      error.displayMessage = 'Cannot connect to server. Please check your connection.'
    } else {
      error.displayMessage = error.message
    }
    return Promise.reject(error)
  }
)

// ─────────────────────────────────────────────
// Auth
// ─────────────────────────────────────────────
export const authAPI = {
  register: (data) => apiService.post('/auth/register', data),
  login:    (data) => apiService.post('/auth/login', data),
}

// ─────────────────────────────────────────────
// Donors
// ─────────────────────────────────────────────
export const donorAPI = {
  register:    (uid, data)  => apiService.post(`/donors/register?uid=${uid}`, data),
  getProfile:  (uid)        => apiService.get(`/donors/${uid}`),
  updateProfile:(uid, data) => apiService.put(`/donors/${uid}`, data),
  getAll:      ()           => apiService.get('/donors'),
  getDonations:(uid)        => apiService.get(`/donors/${uid}/donations`),
}

// ─────────────────────────────────────────────
// Patients
// ─────────────────────────────────────────────
export const patientAPI = {
  register:    (uid, data)  => apiService.post(`/patients/register?uid=${uid}`, data),
  getProfile:  (uid)        => apiService.get(`/patients/${uid}`),
  updateProfile:(uid, data) => apiService.put(`/patients/${uid}`, data),
  getRequests: (uid)        => apiService.get(`/patients/${uid}/requests`),
}

// ─────────────────────────────────────────────
// Hospitals
// ─────────────────────────────────────────────
export const hospitalAPI = {
  register:    (uid, data)  => apiService.post(`/hospitals/register?uid=${uid}`, data),
  getProfile:  (uid)        => apiService.get(`/hospitals/${uid}`),
  updateProfile:(uid, data) => apiService.put(`/hospitals/${uid}`, data),
  getAll:      ()           => apiService.get('/hospitals'),
}

// ─────────────────────────────────────────────
// Blood Requests
// ─────────────────────────────────────────────
export const bloodRequestAPI = {
  create:    (data)  => apiService.post('/blood-requests', data),
  getAll:    ()      => apiService.get('/blood-requests'),
  getById:   (id)    => apiService.get(`/blood-requests/${id}`),
  update:    (id, data) => apiService.put(`/blood-requests/${id}`, data),
  delete:    (id)    => apiService.delete(`/blood-requests/${id}`),
  fulfill:   (id)    => apiService.post(`/blood-requests/${id}/fulfill`),
}

// ─────────────────────────────────────────────
// Inventory
// ─────────────────────────────────────────────
export const inventoryAPI = {
  getAll:    ()         => apiService.get('/inventory'),
  getByHospital: (hid) => apiService.get(`/inventory/hospital/${hid}`),
  update:    (id, data) => apiService.put(`/inventory/${id}`, data),
}

// ─────────────────────────────────────────────
// Donations
// ─────────────────────────────────────────────
export const donationAPI = {
  create:  (data) => apiService.post('/donations', data),
  getAll:  ()     => apiService.get('/donations'),
  getById: (id)   => apiService.get(`/donations/${id}`),
}

// ─────────────────────────────────────────────
// Appointments
// ─────────────────────────────────────────────
export const appointmentAPI = {
  create:    (data)  => apiService.post('/appointments', data),
  getAll:    ()      => apiService.get('/appointments'),
  getByUser: (uid)   => apiService.get(`/appointments/user/${uid}`),
  update:    (id, data) => apiService.put(`/appointments/${id}`, data),
  cancel:    (id)    => apiService.delete(`/appointments/${id}`),
}

// ─────────────────────────────────────────────
// Notifications
// ─────────────────────────────────────────────
export const notificationAPI = {
  getByUser:   (uid) => apiService.get(`/notifications/user/${uid}`),
  markRead:    (id)  => apiService.put(`/notifications/${id}/read`),
  markAllRead: (uid) => apiService.put(`/notifications/user/${uid}/read-all`),
}

export default apiService