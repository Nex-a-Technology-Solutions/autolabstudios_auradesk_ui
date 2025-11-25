import React, { useEffect } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useUser } from '../components/auth/UserProvider';

// Protected Route wrapper component
function ProtectedRoute({ children }) {
  const { user, isLoading } = useUser();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-slate-200 border-t-teal-500 rounded-full animate-spin" />
          <p className="text-slate-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    // Redirect to login, but save the location they were trying to access
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

// Public Route wrapper (redirects to dashboard if already logged in)
function PublicRoute({ children }) {
  const { user, isLoading } = useUser();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-slate-200 border-t-teal-500 rounded-full animate-spin" />
          <p className="text-slate-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (user) {
    // Already logged in, redirect to dashboard
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

// Update your Pages.jsx Routes section like this:
export { ProtectedRoute, PublicRoute };