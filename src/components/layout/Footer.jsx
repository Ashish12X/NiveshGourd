// src/components/layout/Footer.jsx
import React from 'react';
import { Shield, ExternalLink, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 py-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Brand & Purpose */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2.5 text-white">
              <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight">NiveshGuard</span>
            </div>
            <p className="text-sm text-slate-400 max-w-md leading-relaxed">
              "Before you act, ask." NiveshGuard is an adaptive investor-safety companion designed for Indian retail investors. Understand financial information, verify suspicious claims, and find the right official next step.
            </p>
            <div className="pt-2 text-xs text-teal-400 font-medium">
              Built for SANGYAN Hackathon 2026.
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Explore NiveshGuard
            </h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/assessment" className="hover:text-white transition-colors">Safety Calibration Assessment</Link></li>
              <li><Link to="/validity-check" className="hover:text-white transition-colors">Validity Check</Link></li>
              <li><Link to="/learn" className="hover:text-white transition-colors">Adaptive Learning Modules</Link></li>
              <li><Link to="/ask" className="hover:text-white transition-colors">Ask NiveshGuard</Link></li>
              <li><Link to="/compare" className="hover:text-white transition-colors">Adaptive Fact Comparison</Link></li>
              <li><Link to="/incident" className="text-rose-400 hover:text-rose-300 font-semibold transition-colors">Something Went Wrong?</Link></li>
            </ul>
          </div>

          {/* Statutory Grievance Portals */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Official Indian Channels
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li className="flex items-center gap-1.5 hover:text-white">
                <ExternalLink className="w-3 h-3 text-slate-500" />
                <span>Cybercrime Helpline: <strong>1930</strong></span>
              </li>
              <li className="flex items-center gap-1.5 hover:text-white">
                <ExternalLink className="w-3 h-3 text-slate-500" />
                <span>SEBI SCORES 2.0 (scores.sebi.gov.in)</span>
              </li>
              <li className="flex items-center gap-1.5 hover:text-white">
                <ExternalLink className="w-3 h-3 text-slate-500" />
                <span>RBI Sachet (sachet.rbi.org.in)</span>
              </li>
              <li className="flex items-center gap-1.5 hover:text-white">
                <ExternalLink className="w-3 h-3 text-slate-500" />
                <span>SMART ODR Portal (smartodr.in)</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Mandatory Guardrail Banner */}
        <div className="pt-6 border-t border-slate-800 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p className="max-w-3xl">
            <strong>Mandatory Investor Disclaimer:</strong> NiveshGuard is an educational safety companion and does NOT provide stock tips, buy/sell recommendations, investment advice, or guaranteed return forecasts. For formal legal complaints, please use official statutory portals.
          </p>
          <div className="shrink-0 text-slate-400 font-mono text-[11px]">
            SANGYAN Hackathon 2026 • Verified Safety Architecture
          </div>
        </div>
      </div>
    </footer>
  );
}
