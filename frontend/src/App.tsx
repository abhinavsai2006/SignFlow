import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import ForgotPassword from './components/auth/ForgotPassword';
import ResetPassword from './components/auth/ResetPassword';
import EmailVerification from './components/auth/EmailVerification';
import Layout from './components/layout/Layout';
import Dashboard from './components/dashboard/Dashboard';
import AllDocuments from './components/dashboard/AllDocuments';
import PendingDocuments from './components/dashboard/PendingDocuments';
import CompletedDocuments from './components/dashboard/CompletedDocuments';
import Settings from './components/dashboard/Settings';
import Workspace from './components/dashboard/Workspace';
import Billing from './components/dashboard/Billing';
import AdminDashboard from './components/dashboard/AdminDashboard';
import DocumentEditor from './components/editor/DocumentEditor';
import PublicShareView from './components/editor/PublicShareView';
import ProtectedRoute from './components/auth/ProtectedRoute';
import LandingPage from './components/layout/LandingPage';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/share/:id" element={<PublicShareView />} />

        {/* Layout Protected Routes */}
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/documents" element={<AllDocuments />} />
          <Route path="/pending" element={<PendingDocuments />} />
          <Route path="/completed" element={<CompletedDocuments />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/workspaces" element={<Workspace />} />
          <Route path="/billing" element={<Billing />} />
          <Route path="/admin" element={<AdminDashboard />} />
        </Route>

        {/* Standalone Protected Routes */}
        <Route 
          path="/verify-email" 
          element={
            <ProtectedRoute>
              <EmailVerification />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/edit/:id" 
          element={
            <ProtectedRoute>
              <DocumentEditor />
            </ProtectedRoute>
          } 
        />

        {/* Wildcard Redirection */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
