import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout.jsx';
import DocumentListPage   from './pages/DocumentListPage.jsx';
import DocumentCreatePage from './pages/DocumentCreatePage.jsx';
import DocumentDetailPage from './pages/DocumentDetailPage.jsx';
import DocumentEditPage   from './pages/DocumentEditPage.jsx';
import NotFoundPage       from './pages/NotFoundPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import AdminUsersPage from './pages/AdminUsersPage.jsx';
import AdminAuditPage from './pages/AdminAuditPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import { RequireAdmin } from './components/auth/RequireAdmin.jsx';
import { ApiErrorRedirector } from './components/auth/ApiErrorRedirector.jsx';
import { ErrorBoundary } from './components/ErrorBoundary.jsx';
import { StatusErrorPage } from './pages/StatusErrorPage.jsx';
import { useLocation } from 'react-router-dom';
import { RequireAuth } from './components/auth/RequireAuth.jsx';
import { AuthProvider } from './context/AuthContext.jsx';

export default function App() {
  return (
    <AuthProvider>
    <ApiErrorRedirector />
    <RoutedApp />
    </AuthProvider>
  );
}

function RoutedApp() {
  const location = useLocation();
  return (
    <ErrorBoundary resetKey={location.pathname}>
    <Routes>
      <Route path="/dang-nhap" element={<LoginPage />} />
      <Route path="/dang-ky" element={<RegisterPage />} />
      <Route path="/403" element={<StatusErrorPage status={403} />} />
      <Route path="/404" element={<NotFoundPage />} />
      <Route path="/500" element={<StatusErrorPage status={500} />} />
      <Route element={<RequireAuth><Layout /></RequireAuth>}>
        <Route index element={<DashboardPage />} />
        <Route path="/tai-lieu"          element={<DocumentListPage />} />
        <Route path="/tai-lieu/them"     element={<DocumentCreatePage />} />
        <Route path="/tai-lieu/:id"      element={<DocumentDetailPage />} />
        <Route path="/tai-lieu/:id/sua"  element={<DocumentEditPage />} />
        <Route path="/ho-so" element={<ProfilePage />} />
        <Route element={<RequireAdmin />}>
          <Route path="/quan-tri/nguoi-dung" element={<AdminUsersPage />} />
          <Route path="/quan-tri/nhat-ky" element={<AdminAuditPage />} />
        </Route>
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
    </ErrorBoundary>
  );
}
