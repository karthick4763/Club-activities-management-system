import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';

// Pages
import { Login } from './pages/Login';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { MemberApprovals } from './pages/admin/MemberApprovals';
import { AllClubs } from './pages/admin/AllClubs';
import { AllReports } from './pages/admin/AllReports';

import { CoordinatorDashboard } from './pages/coordinator/CoordinatorDashboard';
import { MonthlyActionPlan } from './pages/coordinator/MonthlyActionPlan';
import { ClubMembers } from './pages/coordinator/ClubMembers';
import { CoordinatorEvents } from './pages/coordinator/CoordinatorEvents';
import { CoordinatorReports } from './pages/coordinator/CoordinatorReports';
import { MemberDashboard } from './pages/member/MemberDashboard';
import { Settings } from './pages/Settings';

const AppLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 overflow-x-hidden bg-[#F8FAFC]">
          {children}
        </main>
      </div>
    </div>
  );
};

export default function App() {
  const { user, isAuthenticated } = useAuth();

  return (
    <Routes>
      {/* Public Route */}
      <Route
        path="/login"
        element={
          isAuthenticated ? (
            user?.role === 'ADMIN' ? (
              <Navigate to="/admin/dashboard" replace />
            ) : user?.role === 'MEMBER' ? (
              <Navigate to="/member/dashboard" replace />
            ) : (
              <Navigate to="/coordinator/dashboard" replace />
            )
          ) : (
            <Login />
          )
        }
      />

      {/* Admin Protected Routes */}
      <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
        <Route
          path="/admin/dashboard"
          element={
            <AppLayout>
              <AdminDashboard />
            </AppLayout>
          }
        />
        <Route
          path="/admin/members"
          element={
            <AppLayout>
              <MemberApprovals />
            </AppLayout>
          }
        />
        <Route
          path="/members"
          element={
            <AppLayout>
              <MemberApprovals />
            </AppLayout>
          }
        />
        <Route
          path="/admin/approvals"
          element={<Navigate to="/admin/members" replace />}
        />
        <Route
          path="/admin/clubs"
          element={
            <AppLayout>
              <AllClubs />
            </AppLayout>
          }
        />
        <Route
          path="/admin/reports"
          element={
            <AppLayout>
              <AllReports />
            </AppLayout>
          }
        />
        <Route
          path="/events-reports"
          element={
            <AppLayout>
              <AllReports />
            </AppLayout>
          }
        />
        <Route
          path="/admin/settings"
          element={
            <AppLayout>
              <Settings />
            </AppLayout>
          }
        />
      </Route>

      {/* Coordinator Protected Routes */}
      <Route element={<ProtectedRoute allowedRoles={['COORDINATOR']} />}>
        <Route
          path="/coordinator/dashboard"
          element={
            <AppLayout>
              <CoordinatorDashboard />
            </AppLayout>
          }
        />
        <Route
          path="/coordinator/action-plan"
          element={
            <AppLayout>
              <MonthlyActionPlan />
            </AppLayout>
          }
        />
      </Route>

      {/* Shared Coordinator & Member Protected Routes (Read-Only for Members) */}
      <Route element={<ProtectedRoute allowedRoles={['COORDINATOR', 'MEMBER']} />}>
        <Route
          path="/coordinator/events"
          element={
            <AppLayout>
              <CoordinatorEvents />
            </AppLayout>
          }
        />
        <Route
          path="/coordinator/members"
          element={
            <AppLayout>
              <ClubMembers />
            </AppLayout>
          }
        />
        <Route
          path="/coordinator/reports"
          element={
            <AppLayout>
              <CoordinatorReports />
            </AppLayout>
          }
        />
        <Route
          path="/coordinator/settings"
          element={
            <AppLayout>
              <Settings />
            </AppLayout>
          }
        />
      </Route>

      {/* Member Protected Routes */}
      <Route element={<ProtectedRoute allowedRoles={['MEMBER']} />}>
        <Route
          path="/member/dashboard"
          element={
            <AppLayout>
              <CoordinatorDashboard />
            </AppLayout>
          }
        />
      </Route>

      {/* Default Catch-all */}
      <Route
        path="*"
        element={
          isAuthenticated ? (
            user?.role === 'ADMIN' ? (
              <Navigate to="/admin/dashboard" replace />
            ) : user?.role === 'MEMBER' ? (
              <Navigate to="/member/dashboard" replace />
            ) : (
              <Navigate to="/coordinator/dashboard" replace />
            )
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
    </Routes>
  );
}
