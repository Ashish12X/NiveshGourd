// src/components/layout/Sidebar.jsx
import React from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Home,
  CheckCircle2,
  BookOpen,
  MessageSquare,
  Scale,
  ShieldCheck,
  FileCheck,
  FolderLock,
  AlertOctagon,
  User,
  CheckSquare
} from 'lucide-react';

export default function Sidebar() {
  const { t } = useTranslation();

  const mainNavItems = [
    { key: 'sidebar.dashboard', to: '/dashboard', icon: Home },
    { key: 'sidebar.validityCheck', to: '/validity-check', icon: CheckCircle2 },
    { key: 'sidebar.learning', to: '/learn', icon: BookOpen },
    { key: 'sidebar.askAI', to: '/ask', icon: MessageSquare },
    { key: 'sidebar.compare', to: '/compare', icon: Scale },
    { key: 'sidebar.decisionReadiness', to: '/decision-readiness', icon: CheckSquare },
  ];

  const safetyNavItems = [
    { key: 'sidebar.mySafety', to: '/my-safety', icon: ShieldCheck, end: true },
    { key: 'sidebar.vault', to: '/my-safety/evidence', icon: FolderLock },
    { key: 'sidebar.receipts', to: '/my-safety/receipts', icon: FileCheck },
  ];

  const getNavLinkClass = ({ isActive }) =>
    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-150 ${
      isActive
        ? 'bg-slate-900 text-white shadow-xs'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
    }`;

  return (
    <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200/80 h-full overflow-y-auto p-4 shrink-0 justify-between">
      <div className="space-y-6">
        {/* Main Navigation */}
        <div>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3.5 mb-2 block">
            {t('dashboard.coreActionsTitle')}
          </span>
          <nav className="space-y-1">
            {mainNavItems.map((item) => (
              <NavLink key={item.to} to={item.to} className={getNavLinkClass}>
                <item.icon className="w-4 h-4 shrink-0" />
                <span>{t(item.key)}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Safety & Evidence */}
        <div>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3.5 mb-2 block">
            {t('mySafety.title')}
          </span>
          <nav className="space-y-1">
            {safetyNavItems.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.end} className={getNavLinkClass}>
                <item.icon className="w-4 h-4 shrink-0" />
                <span>{t(item.key)}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Emergency / Incident Mode */}
        <div>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3.5 mb-2 block">
            {t('nav.emergency')}
          </span>
          <NavLink
            to="/incident"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all border ${
                isActive
                  ? 'bg-rose-700 text-white border-rose-700'
                  : 'bg-rose-50/70 text-rose-800 border-rose-200 hover:bg-rose-100'
              }`
            }
          >
            <AlertOctagon className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{t('sidebar.incident')}</span>
          </NavLink>
        </div>
      </div>

      {/* Footer / Safety Guardrail Notice */}
      <div className="pt-4 border-t border-slate-100">
        <NavLink
          to="/profile"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold mb-3 ${
              isActive
                ? 'bg-slate-100 text-slate-900'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`
          }
        >
          <User className="w-4 h-4 text-slate-500" />
          <span>{t('sidebar.profile')}</span>
        </NavLink>

        <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-[11px] text-slate-500 leading-relaxed">
          <p className="font-semibold text-slate-700 mb-0.5">NiveshGuard</p>
          {t('ask.disclaimer')}
        </div>
      </div>
    </aside>
  );
}
