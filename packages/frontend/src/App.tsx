import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { CampanhasPage } from '@/pages/CampanhasPage';
import { NovaCampanhaPage } from '@/pages/NovaCampanhaPage';
import { CampanhaDetailPage } from '@/pages/CampanhaDetailPage';
import { IntegracoesPage } from '@/pages/IntegracoesPage';
import { LandingPage } from '@/pages/LandingPage';

function LandingRoute({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  return token ? <Navigate to="/dashboard" replace /> : <>{children}</>;
}

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  return token ? <>{children}</> : <Navigate to="/login" replace />;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  return token ? <Navigate to="/dashboard" replace /> : <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <LandingRoute>
            <LandingPage />
          </LandingRoute>
        }
      />
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <RegisterPage />
          </PublicRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <PrivateRoute>
            <DashboardPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/campanhas"
        element={
          <PrivateRoute>
            <CampanhasPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/campanhas/nova"
        element={
          <PrivateRoute>
            <NovaCampanhaPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/campanhas/:id"
        element={
          <PrivateRoute>
            <CampanhaDetailPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/integracoes"
        element={
          <PrivateRoute>
            <IntegracoesPage />
          </PrivateRoute>
        }
      />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
