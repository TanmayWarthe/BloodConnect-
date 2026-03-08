import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

/**
 * ProtectedRoute
 * - If no user is logged in → redirect to /login
 * - If allowedRole is specified and user's role doesn't match → redirect to their own dashboard
 * - Otherwise → render children
 */
const ProtectedRoute = ({ children, allowedRole }) => {
  const { currentUser, loading } = useAuth()
  const location = useLocation()

  // Still rehydrating session from localStorage
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">Loading...</p>
        </div>
      </div>
    )
  }

  // Not logged in → go to login, preserve intended destination
  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Wrong role → redirect to the user's actual dashboard
  if (allowedRole && currentUser.role?.toLowerCase() !== allowedRole.toLowerCase()) {
    const role = currentUser.role?.toLowerCase()
    const dashboardMap = {
      donor: '/donor/dashboard',
      patient: '/patient/dashboard',
      hospital: '/hospital/dashboard',
      admin: '/admin/dashboard',
    }
    return <Navigate to={dashboardMap[role] || '/'} replace />
  }

  return children
}

export default ProtectedRoute