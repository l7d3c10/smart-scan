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
import { RequireAuth } from './components/auth/RequireAuth.jsx';
import { AuthProvider } from './context/AuthContext.jsx';

export default function App() {
  return (
    <AuthProvider>
    <Routes>
      <Route path="/dang-nhap" element={<LoginPage />} />
      <Route path="/dang-ky" element={<RegisterPage />} />
      <Route element={<RequireAuth><Layout /></RequireAuth>}>
        <Route index element={<DashboardPage />} />
        <Route path="/tai-lieu"          element={<DocumentListPage />} />
        <Route path="/tai-lieu/them"     element={<DocumentCreatePage />} />
        <Route path="/tai-lieu/:id"      element={<DocumentDetailPage />} />
        <Route path="/tai-lieu/:id/sua"  element={<DocumentEditPage />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
    </AuthProvider>
  );
}
