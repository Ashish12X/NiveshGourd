// src/routes/AppRoutes.jsx
import React from 'react';
import { Routes, Route } from 'react-router-dom';

// Layouts
import PublicLayout from '../layouts/PublicLayout';
import AppLayout from '../layouts/AppLayout';
import ProtectedRoute from '../components/common/ProtectedRoute';

// Pages
import LandingPage from '../pages/LandingPage';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import AssessmentPage from '../pages/AssessmentPage';
import DashboardPage from '../pages/DashboardPage';
import ValidityCheckPage from '../pages/ValidityCheckPage';
import ValidityResultPage from '../pages/ValidityResultPage';
import LearningPage from '../pages/LearningPage';
import LearningTopicPage from '../pages/LearningTopicPage';
import AskSangyanPage from '../pages/AskSangyanPage';
import ComparePage from '../pages/ComparePage';
import DecisionReadinessPage from '../pages/DecisionReadinessPage';
import MySafetyPage from '../pages/MySafetyPage';
import EvidenceVaultPage from '../pages/EvidenceVaultPage';
import SafetyReceiptsPage from '../pages/SafetyReceiptsPage';
import IncidentPage from '../pages/IncidentPage';
import ProfilePage from '../pages/ProfilePage';
import NotFoundPage from '../pages/NotFoundPage';

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public Pages */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      {/* Protected Routes - require real authentication */}
      <Route element={<ProtectedRoute />}>
        {/* Assessment calibration uses PublicLayout */}
        <Route element={<PublicLayout />}>
          <Route path="/assessment" element={<AssessmentPage />} />
        </Route>

        {/* Authenticated / Product Shell Experience */}
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/validity-check" element={<ValidityCheckPage />} />
          <Route path="/validity-check/result" element={<ValidityResultPage />} />
          <Route path="/learn" element={<LearningPage />} />
          <Route path="/learn/topic/:topicId" element={<LearningTopicPage />} />
          <Route path="/ask" element={<AskSangyanPage />} />
          <Route path="/compare" element={<ComparePage />} />
          <Route path="/decision-readiness" element={<DecisionReadinessPage />} />
          <Route path="/my-safety" element={<MySafetyPage />} />
          <Route path="/my-safety/evidence" element={<EvidenceVaultPage />} />
          <Route path="/my-safety/receipts" element={<SafetyReceiptsPage />} />
          <Route path="/incident" element={<IncidentPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>
      </Route>

      {/* Catch-all 404 - PublicLayout uses Outlet, so we wrap NotFoundPage as a nested route */}
      <Route element={<PublicLayout />}>
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
