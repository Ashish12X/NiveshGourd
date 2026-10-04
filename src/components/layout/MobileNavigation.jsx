// src/components/layout/MobileNavigation.jsx
import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, CheckCircle2, BookOpen, MessageSquare, ShieldCheck } from 'lucide-react';

const mobileNavItems = [
  { name: 'Home', to: '/dashboard', icon: Home },
  { name: 'Check', to: '/validity-check', icon: CheckCircle2 },
  { name: 'Learn', to: '/learn', icon: BookOpen },
  { name: 'Ask', to: '/ask', icon: MessageSquare },
  { name: 'Safety', to: '/my-safety', icon: ShieldCheck },
];

export default function MobileNavigation() {
  return (
    <nav
      aria-label="Mobile Bottom Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1.5 flex items-center justify-around shadow-lg"
    >
      {mobileNavItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all duration-150 text-[10px] font-semibold ${
              isActive
                ? 'text-teal-800 bg-teal-50'
                : 'text-slate-500 hover:text-slate-800'
            }`
          }
        >
          <item.icon className="w-5 h-5 mb-0.5" />
          <span>{item.name}</span>
        </NavLink>
      ))}
    </nav>
  );
}
