import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ui/ProtectedRoute';

// Pages
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DashboardPage from './pages/DashboardPage';
import ResumesPage from './pages/ResumesPage';
import InterviewsPage from './pages/InterviewsPage';
import InterviewDetailPage from './pages/InterviewDetailPage';
import InterviewSetupPage from './pages/InterviewSetupPage';
import InterviewExperiencePage from './pages/InterviewExperiencePage';
import InterviewResultPage from './pages/InterviewResultPage';
import ProfilePage from './pages/ProfilePage';

// Layout
import AppLayout from './components/layout/AppLayout';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />

          {/* Protected dashboard routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="resumes" element={<ResumesPage />} />
            <Route path="interviews" element={<InterviewsPage />} />
            <Route path="interviews/setup" element={<InterviewSetupPage />} />
            <Route path="interviews/:id" element={<InterviewDetailPage />} />
            <Route path="interviews/:id/result" element={<InterviewResultPage />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>

          {/* Full-screen interview experience */}
          <Route
            path="/interviews/:id/experience"
            element={
              <ProtectedRoute>
                <InterviewExperiencePage />
              </ProtectedRoute>
            }
          />

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;