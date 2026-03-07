import { createContext, useContext, useState, useEffect } from 'react'
import { auth } from '../firebase'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider
} from 'firebase/auth'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080/api'

const AuthContext = createContext()

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(true)

  /**
   * Fetch user role from backend using Firebase UID.
   * Returns lowercase role string ('donor' | 'hospital' | 'patient' | 'admin') or null.
   */
  async function fetchUserRole(uid) {
    try {
      const response = await fetch(`${API_BASE}/users/${uid}/role`)
      if (response.ok) {
        const data = await response.json()
        return data.role
      }
      return null
    } catch (error) {
      console.error('Error fetching user role:', error)
      return null
    }
  }

  /**
   * Register a new user with Firebase, then sync to backend.
   */
  function signup(email, password, name, role = 'donor') {
    return createUserWithEmailAndPassword(auth, email, password)
      .then(async (userCredential) => {
        await updateProfile(userCredential.user, { displayName: name })

        // Sync new user to backend database
        try {
          const response = await fetch(`${API_BASE}/users/sync`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              firebaseUid: userCredential.user.uid,
              email: userCredential.user.email,
              role: role.toUpperCase()
            })
          })

          if (!response.ok) {
            console.error(`User sync failed: ${response.status}`)
          }
        } catch (error) {
          console.error('Backend sync failed:', error)
        }

        return userCredential
      })
  }

  function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password)
  }

  function googleLogin() {
    const provider = new GoogleAuthProvider()
    return signInWithPopup(auth, provider)
  }

  function logout() {
    setCurrentUser(null)
    localStorage.removeItem('userRole')
    return signOut(auth)
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Fetch role from backend
        const role = await fetchUserRole(user.uid)

        const enrichedUser = {
          ...user,
          uid: user.uid,
          email: user.email,
          name: user.displayName,
          role: role,
        }

        // Cache role in localStorage for Layout role detection
        if (role) {
          localStorage.setItem('userRole', role)
        }

        setCurrentUser(enrichedUser)
      } else {
        setCurrentUser(null)
        localStorage.removeItem('userRole')
      }
      setLoading(false)
    })

    return unsubscribe
  }, [])

  const value = {
    currentUser,
    loading,
    signup,
    login,
    googleLogin,
    logout
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

      } else {
        setCurrentUser(null)
      }
      setLoading(false)
    })

    return unsubscribe
  }, [])

  const value = {
    currentUser,
    signup,
    login,
    googleLogin,
    logout
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}
