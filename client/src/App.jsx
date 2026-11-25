import { Routes, Route, useLocation } from 'react-router-dom';
import { Layout } from './components/layout/Layout.jsx';

// ── Người 1: Quản lý tài liệu (DMS) ──────────────────────────────────────────
import DocumentListPage     from './pages/DocumentListPage.jsx';
import DocumentCreatePage   from './pages/DocumentCreatePage.jsx';
import DocumentDetailPage   from './pages/DocumentDetailPage.jsx';
import DocumentEditPage     from './pages/DocumentEditPage.jsx';
import DocumentImportPage   from './pages/DocumentImportPage.jsx';
import FolderManagementPage from './pages/FolderManagementPage.jsx';
import FavoritesPage        from './pages/FavoritesPage.jsx';
import RecentPage           from './pages/RecentPage.jsx';
import RecycleBinPage       from './pages/RecycleBinPage.jsx';

// ── Người 2: Xử lý ảnh (OpenCV) ───────────────────────────────────────────────
import UploadPage           from './pages/UploadPage.jsx';
import ImageProcessPage     from './pages/ImageProcessPage.jsx';
import SaveDocumentPage     from './pages/SaveDocumentPage.jsx';

// ── Người 3: Bảo mật / Auth ───────────────────────────────────────────────────
import LoginPage            from './pages/LoginPage.jsx';
import RegisterPage         from './pages/RegisterPage.jsx';
import DashboardPage        from './pages/DashboardPage.jsx';
import ProfilePage          from './pages/ProfilePage.jsx';
import UserManagementPage   from './pages/UserManagementPage.jsx';
import AuditLogPage         from './pages/AuditLogPage.jsx';
import NotFoundPage         from './pages/NotFoundPage.jsx';
import { RequireAuth }      from './components/auth/RequireAuth.jsx';
import { AuthProvider }     from './context/AuthContext.jsx';

// ── Components bổ sung từ main (Người 3) ──────────────────────────────────────
import { ApiErrorRedirector } from './components/auth/ApiErrorRedirector.jsx';
import { ErrorBoundary }      from './components/ErrorBoundary.jsx';
import { StatusErrorPage }    from './pages/StatusErrorPage.jsx';

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
        {/* Public auth routes */}
        <Route path="/dang-nhap" element={<LoginPage />} />
        <Route path="/dang-ky" element={<RegisterPage />} />

        {/* Error pages */}
        <Route path="/403" element={<StatusErrorPage status={403} />} />
        <Route path="/404" element={<NotFoundPage />} />
        <Route path="/500" element={<StatusErrorPage status={500} />} />

        {/* Protected application routes */}
        <Route element={<RequireAuth><Layout /></RequireAuth>}>
          <Route index element={<DashboardPage />} />

          {/* ── Người 1: Quản lý tài liệu (DMS) ── */}
          <Route path="/tai-lieu"                  element={<DocumentListPage />} />
          <Route path="/tai-lieu/them"             element={<DocumentCreatePage />} />
          <Route path="/tai-lieu/nhap"             element={<DocumentImportPage />} />
          <Route path="/tai-lieu/:id"              element={<DocumentDetailPage />} />
          <Route path="/tai-lieu/:id/sua"          element={<DocumentEditPage />} />
          <Route path="/thu-muc"                   element={<FolderManagementPage />} />
          <Route path="/yeu-thich"                 element={<FavoritesPage />} />
          <Route path="/gan-day"                   element={<RecentPage />} />
          <Route path="/thung-rac"                 element={<RecycleBinPage />} />

          {/* ── Người 2: Xử lý ảnh (OpenCV) ── */}
          <Route path="/tai-len"                   element={<UploadPage />} />
          <Route path="/tai-len/:uploadId/xu-ly"   element={<ImageProcessPage />} />
          <Route path="/tai-len/:uploadId/luu"     element={<SaveDocumentPage />} />

          {/* ── Người 3: Profile & Administration ── */}
          <Route path="/ho-so"                     element={<ProfilePage />} />
          <Route path="/quan-tri/nguoi-dung"       element={<UserManagementPage />} />
          <Route path="/quan-tri/nhat-ky"          element={<AuditLogPage />} />
        </Route>

        {/* 404 fallback */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </ErrorBoundary>
  );
}
