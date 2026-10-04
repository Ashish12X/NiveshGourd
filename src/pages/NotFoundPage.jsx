// src/pages/NotFoundPage.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';
import Button from '../components/common/Button';

export default function NotFoundPage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6 text-center">
      <div className="max-w-md bg-white rounded-3xl border border-slate-200/90 shadow-sm p-8 space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center mx-auto mb-2">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Page Not Found
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
          The requested safety module or route does not exist in this stage of SANGYAN.
        </p>
        <div className="pt-2 flex justify-center gap-3">
          <Link to="/dashboard">
            <Button variant="primary" size="md" icon={Home} iconPosition="left">
              Return to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
