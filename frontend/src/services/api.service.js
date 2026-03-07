import axios from 'axios'
import { auth } from '../firebase'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api'

export const apiService = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000, // 15 second timeout
})

// Request interceptor — attach Firebase ID token to every request
apiService.interceptors.request.use(
  async config => {
    try {
      const user = auth.currentUser
      if (user) {
        const token = await user.getIdToken()
        config.headers['Authorization'] = `Bearer ${token}`
      }
    } catch (error) {
      // Not critical — proceed without token
      console.warn('Could not attach auth token:', error.message)
    }
    return config
  },
  error => Promise.reject(error)
)

// Response interceptor — normalize error messages
apiService.interceptors.response.use(
  response => response,
  error => {
    if (error.response) {
      // Server returned an error response
      const message = error.response.data?.message || error.response.statusText || 'Request failed'
      error.displayMessage = message
    } else if (error.request) {
      // No response received (network/timeout)
      error.displayMessage = 'Cannot connect to server. Please check your connection.'
    } else {
      error.displayMessage = error.message
    }
    return Promise.reject(error)
  }
)

export default apiService
