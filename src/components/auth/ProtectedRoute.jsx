import React, { useEffect } from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import useAuthStore from '../../stores/authStore';
import LoadingScreen from '../LoadingScreen';

export default function ProtectedRoute({ children, requiredPlans = null }) {
  const { isAuthenticated, user, fetchProfile } = useAuthStore();
  const location = useLocation();
  const [isLoading, setIsLoading] = React.useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      if (isAuthenticated && !user) {
        await fetchProfile();
      }
      setIsLoading(false);
    };

    checkAuth();
  }, [isAuthenticated, user, fetchProfile]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    // Redirect to login but save the attempted location
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if user has required plan
  if (requiredPlans && user) {
    const userPlan = user.subscription?.plan || 'FREE';
    if (!requiredPlans.includes(userPlan)) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-primary/5 to-secondary/5 flex items-center justify-center p-4">
          <div className="glass-card p-8 max-w-md w-full text-center">
            <svg className="w-16 h-16 mx-auto mb-4 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <h2 className="text-2xl font-bold mb-2">Upgrade Required</h2>
            <p className="text-muted mb-6">
              This feature requires a {requiredPlans.join(' or ')} plan.
            </p>
            <Link 
              to="/pricing" 
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-primary to-secondary text-white font-semibold rounded-lg hover:opacity-90 transition-all"
            >
              View Plans
            </Link>
          </div>
        </div>
      );
    }
  }

  return children;
}