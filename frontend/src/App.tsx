import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Eager-load auth routes (small, needed immediately)
import Login from './components/auth/Login';
import Register from './components/auth/Register';

// Lazy-load everything else for bundle splitting
const ForgotPassword = lazy(() => import('./components/auth/ForgotPassword'));
const ResetPassword = lazy(() => import('./components/auth/ResetPassword'));
const EmailVerification = lazy(() => import('./components/auth/EmailVerification'));
const Layout = lazy(() => import('./components/layout/Layout'));
const Dashboard = lazy(() => import('./components/dashboard/Dashboard'));
const AllDocuments = lazy(() => import('./components/dashboard/AllDocuments'));
const PendingDocuments = lazy(() => import('./components/dashboard/PendingDocuments'));
const CompletedDocuments = lazy(() => import('./components/dashboard/CompletedDocuments'));
const Settings = lazy(() => import('./components/dashboard/Settings'));
const Workspace = lazy(() => import('./components/dashboard/Workspace'));
const Billing = lazy(() => import('./components/dashboard/Billing'));
const AdminDashboard = lazy(() => import('./components/dashboard/AdminDashboard'));
const DocumentEditor = lazy(() => import('./components/editor/DocumentEditor'));
const PublicShareView = lazy(() => import('./components/editor/PublicShareView'));
const ProtectedRoute = lazy(() => import('./components/auth/ProtectedRoute'));
const LandingPage = lazy(() => import('./components/layout/LandingPage'));
const Unsubscribe = lazy(() => import('./components/layout/Unsubscribe'));

// Full-screen skeleton loader shown while chunks are downloading
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-canvas">
      <div className="flex flex-col items-center gap-md">
        <div className="relative w-10 h-10">
          <div className="absolute inset-0 rounded-full border-2 border-brand/20" />
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-brand animate-spin" />
        </div>
        <p className="text-body-sm text-slate font-medium">Loading SignFlow…</p>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/share/:id" element={<PublicShareView />} />
          <Route path="/unsubscribe" element={<Unsubscribe />} />
          <Route path="/verify-email" element={<EmailVerification />} />

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
            path="/edit/:id"
            element={
              <ProtectedRoute>
                <DocumentEditor />
              </ProtectedRoute>
            }
          />

          {/* Wildcard */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
