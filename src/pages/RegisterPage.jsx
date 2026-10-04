import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Shield, User, Mail, Lock, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import Button from '../components/common/Button';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errorMessage, setErrorMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (formData.password !== formData.confirmPassword) {
      setErrorMessage('Passwords do not match. Please verify and try again.');
      return;
    }

    if (formData.password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    setSubmitting(true);

    try {
      await register(formData.name, formData.email, formData.password);
      // After registration flow navigates to /assessment as specified
      navigate('/assessment');
    } catch (err) {
      setErrorMessage(err.message || 'Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-teal-800 text-white flex items-center justify-center mx-auto mb-3">
            <Shield className="w-6 h-6 text-teal-300" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {t('auth.registerTitle')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {t('auth.registerSubtitle')}
          </p>
        </div>

        {errorMessage && (
          <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-rose-800 text-xs font-medium">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5" htmlFor="reg-name">
              {t('auth.name')}
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="reg-name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 transition-all"
                placeholder="Arun Sharma"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5" htmlFor="reg-email">
              {t('auth.email')}
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="reg-email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 transition-all"
                placeholder="name@example.in"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5" htmlFor="reg-password">
              {t('auth.password')}
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="reg-password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5" htmlFor="reg-confirm">
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="reg-confirm"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              icon={ArrowRight}
              iconPosition="right"
              disabled={submitting}
            >
              {submitting ? t('common.loading') : t('auth.signUpBtn')}
            </Button>
          </div>
        </form>

        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-500">
          <CheckCircle2 className="w-4 h-4 text-teal-600" />
          <span>Stage 1 Calibration Flow (No credit card or KYC needed)</span>
        </div>

        <div className="mt-6 text-center text-xs text-slate-500">
          {t('auth.hasAccount')}{' '}
          <Link to="/login" className="font-semibold text-slate-900 hover:underline">
            {t('auth.signInBtn')}
          </Link>
        </div>
      </div>
    </div>
  );
}
