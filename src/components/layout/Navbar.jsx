// src/components/layout/Navbar.jsx
import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Shield, AlertOctagon, LogOut } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { mockUser } from '../../data/mockUser';
import LanguageSwitcher from '../common/LanguageSwitcher';

export default function Navbar({ isPublic = false }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const { t } = useTranslation();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const getInitials = (fullName) => {
    if (!fullName) return 'AS';
    const parts = fullName.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
  };

  const displayName = (user?.displayName || user?.name) ? (user.displayName || user.name).split(' ')[0] : mockUser.name.split(' ')[0];
  const avatarInitials = user?.name ? getInitials(user.name) : mockUser.avatar;

  // Brand name translates to local script
  const brandName = t('brand.name');
  const brandEdition = t('brand.edition');
  const brandTagline = t('brand.tagline');

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <Link to={isAuthenticated ? "/dashboard" : "/"} className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-xs group-hover:bg-slate-800 transition-colors">
            <Shield className="w-5 h-5 text-teal-400" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold tracking-tight text-slate-900 text-lg">
                {brandName}
              </span>
              <span className="text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200 px-1.5 py-0.2 rounded font-mono hidden sm:inline">
                {brandEdition}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 hidden sm:block font-medium -mt-0.5">
              {brandTagline}
            </p>
          </div>
        </Link>

        {/* Public or App Navigation Links */}
        {isPublic ? (
          <nav className="flex items-center gap-2 sm:gap-4">
            <Link
              to="/#features"
              className="text-xs sm:text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors hidden md:block"
            >
              {t('nav.howItWorks')}
            </Link>
            <LanguageSwitcher compact />
            {isAuthenticated ? (
              <>
                <Link
                  to="/dashboard"
                  className="text-xs sm:text-sm font-semibold bg-slate-900 text-white hover:bg-slate-800 px-4 py-2 rounded-xl transition-all shadow-xs"
                >
                  {t('nav.dashboard')}
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="text-xs sm:text-sm font-semibold text-slate-600 hover:text-rose-600 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-all flex items-center gap-1.5 cursor-pointer"
                  title={t('nav.logout')}
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">{t('nav.logout')}</span>
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-xs sm:text-sm font-semibold text-slate-700 hover:text-slate-900 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-all"
                >
                  {t('nav.login')}
                </Link>
                <Link
                  to="/register"
                  className="text-xs sm:text-sm font-semibold bg-slate-900 text-white hover:bg-slate-800 px-4 py-2 rounded-xl transition-all shadow-xs"
                >
                  {t('nav.register')}
                </Link>
              </>
            )}
          </nav>
        ) : (
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Adaptive Mode Badge */}
            <div className="hidden lg:flex items-center gap-2 bg-slate-50 border border-slate-200/80 rounded-full px-3 py-1 text-xs text-slate-600">
              <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
              <span>{t('nav.adaptiveMode')}: <strong>{mockUser.persona}</strong></span>
            </div>

            {/* Language Switcher - always visible in app mode */}
            <LanguageSwitcher compact />

            {/* Emergency button */}
            <Link
              to="/incident"
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                location.pathname === '/incident'
                  ? 'bg-rose-700 text-white border-rose-700'
                  : 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100'
              }`}
              title={t('nav.emergencyTitle')}
            >
              <AlertOctagon className="w-4 h-4 text-rose-600 shrink-0" />
              <span className="hidden sm:inline">{t('nav.emergency')}</span>
            </Link>

            {/* User Profile */}
            <Link
              to="/profile"
              className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 transition-colors text-slate-700"
              title={t('nav.profile')}
            >
              <div className="w-8 h-8 rounded-full bg-slate-800 text-white text-xs font-bold flex items-center justify-center border border-slate-300">
                {avatarInitials}
              </div>
              <span className="text-xs font-medium hidden sm:inline text-slate-800">
                {t('nav.welcome')}, {displayName}
              </span>
            </Link>

            {/* Logout button */}
            <button
              type="button"
              onClick={handleLogout}
              className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
              title={t('nav.logout')}
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
