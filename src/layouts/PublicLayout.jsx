// src/layouts/PublicLayout.jsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';

export default function PublicLayout() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900">
      <Navbar isPublic={true} />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
