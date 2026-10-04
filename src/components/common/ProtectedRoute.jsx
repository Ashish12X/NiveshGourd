// src/components/common/ProtectedRoute.jsx
import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4 text-center max-w-sm">
          <div className="w-14 h-14 rounded-2xl bg-teal-800 text-white flex items-center justify-center shadow-md animate-pulse">
            <Shield className="w-7 h-7 text-teal-300" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800">Verifying Safety Session</h3>
            <p className="text-xs text-slate-500 mt-1">
              Restoring your encrypted investor profile...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login page and preserve the attempted URL
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children ? children : <Outlet />;
}
