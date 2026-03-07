import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children, allowedRole }) => {
    const { currentUser, loading } = useAuth();

    // Show loading while checking auth
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-gray-200 border-t-primary rounded-full animate-spin mx-auto"></div>
                    <p className="text-gray-500 font-medium mt-4">Loading...</p>
                </div>
            </div>
        );
    }

    // Not logged in - redirect to landing page (auth handled via modal)
    if (!currentUser) {
        return <Navigate to="/" replace />;
    }

    // Check if user has the correct role
    if (currentUser.role && currentUser.role !== allowedRole) {
        // Redirect to correct dashboard based on actual role
        return <Navigate to={`/${currentUser.role}/dashboard`} replace />;
    }

    // User has correct role or role not yet loaded
    return children;
};

export default ProtectedRoute;
