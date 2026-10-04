// src/layouts/AppLayout.jsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Sidebar from '../components/layout/Sidebar';
import MobileNavigation from '../components/layout/MobileNavigation';

export default function AppLayout() {
  return (
    <div className="h-screen overflow-hidden bg-slate-50 flex flex-col text-slate-900">
      <Navbar isPublic={false} />
      <div className="flex-1 flex w-full max-w-7xl mx-auto overflow-hidden min-h-0">
        <Sidebar />
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 pb-24 md:pb-12 overflow-y-auto">
          <Outlet />
        </main>
      </div>
      <MobileNavigation />
    </div>
  );
}
