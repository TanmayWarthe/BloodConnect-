import { createContext, useContext, useState } from 'react'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080/api'

const AuthContext = createContext()

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    const token = localStorage.getItem('token')
    const userStr = localStorage.getItem('user')
    if (token && userStr) {
      try {
        return JSON.parse(userStr)
      } catch {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
      }
    }
    return null
  })
  const loading = false

  /**
   * Register a new user via Spring Boot backend.
   * POST /api/auth/register
   * Accepts an object: { name, email, password, role, bloodGroup?, phone? }
   * Returns: { uid, email, name, role, token }
   */
  async function register({ name, email, password, role, bloodGroup, phone, skipProfileCreation = false }) {
    const response = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, role }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || 'Registration failed')
    }

    const user = {
      uid:   data.uid,
      email: data.email,
      name:  data.name,
      role:  data.role,
    }

    localStorage.setItem('token', data.token)
    localStorage.setItem('user', JSON.stringify(user))
    setCurrentUser(user)

    // After registering, auto-create the role-specific profile
    // (donor/patient/hospital) with extra fields if provided.
    // Skipped when RegisterPage handles profile creation itself (skipProfileCreation=true).
    if (!skipProfileCreation) try {
      if (role === 'donor' && bloodGroup) {
        await fetch(`${API_BASE}/donors/register?uid=${data.uid}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${data.token}`,
          },
          body: JSON.stringify({ name, bloodGroup, phone: phone || '' }),
        })
      } else if (role === 'patient' && bloodGroup) {
        await fetch(`${API_BASE}/patients/register?uid=${data.uid}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${data.token}`,
          },
          body: JSON.stringify({ name, bloodGroup, phone: phone || '' }),
        })
      } else if (role === 'hospital') {
        await fetch(`${API_BASE}/hospitals/register?uid=${data.uid}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${data.token}`,
          },
          body: JSON.stringify({ hospitalName: name, phone: phone || '' }),
        })
      }
    } catch (profileError) {
      // Profile creation failure is non-fatal — user is registered,
      // they can complete their profile later from the dashboard
      console.warn('Profile auto-creation failed (non-fatal):', profileError.message)
    }

    return data
  }

  /**
   * Login via Spring Boot backend.
   * POST /api/auth/login
   * Returns: { uid, email, name, role, token }
   */
  async function login(email, password) {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || 'Invalid email or password')
    }

    const user = {
      uid:   data.uid,
      email: data.email,
      name:  data.name,
      role:  data.role,
    }

    localStorage.setItem('token', data.token)
    localStorage.setItem('user', JSON.stringify(user))
    setCurrentUser(user)

    return data
  }

  /**
   * Update the locally stored user (e.g. after profile edit)
   */
  function updateCurrentUser(updatedFields) {
    setCurrentUser(prev => {
      const updated = { ...prev, ...updatedFields }
      localStorage.setItem('user', JSON.stringify(updated))
      return updated
    })
  }

  function logout() {
    setCurrentUser(null)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  const value = {
    currentUser,
    loading,
    register,   // ← was "signup" before — now matches AuthModal
    login,
    logout,
    updateCurrentUser,
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}