import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout.jsx';
import DocumentListPage   from './pages/DocumentListPage.jsx';
import DocumentCreatePage from './pages/DocumentCreatePage.jsx';
import DocumentDetailPage from './pages/DocumentDetailPage.jsx';
import DocumentEditPage   from './pages/DocumentEditPage.jsx';
import DocumentImportPage from './pages/DocumentImportPage.jsx';
import FolderManagementPage from './pages/FolderManagementPage.jsx';
import FavoritesPage      from './pages/FavoritesPage.jsx';
import RecentPage         from './pages/RecentPage.jsx';
import RecycleBinPage     from './pages/RecycleBinPage.jsx';
import UploadPage         from './pages/UploadPage.jsx';
import ImageProcessPage   from './pages/ImageProcessPage.jsx';
import SaveDocumentPage   from './pages/SaveDocumentPage.jsx';
import ProfilePage        from './pages/ProfilePage.jsx';
import UserManagementPage from './pages/UserManagementPage.jsx';
import AuditLogPage       from './pages/AuditLogPage.jsx';
import NotFoundPage       from './pages/NotFoundPage.jsx';
import LoginPage          from './pages/LoginPage.jsx';
import RegisterPage       from './pages/RegisterPage.jsx';
import DashboardPage      from './pages/DashboardPage.jsx';
import { RequireAuth }    from './components/auth/RequireAuth.jsx';
import { AuthProvider }   from './context/AuthContext.jsx';

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public auth routes */}
        <Route path="/dang-nhap" element={<LoginPage />} />
        <Route path="/dang-ky" element={<RegisterPage />} />

        {/* Protected application routes */}
        <Route element={<RequireAuth><Layout /></RequireAuth>}>
          <Route index element={<DashboardPage />} />
          <Route path="/tai-lieu"                  element={<DocumentListPage />} />
          <Route path="/tai-lieu/them"             element={<DocumentCreatePage />} />
          <Route path="/tai-lieu/nhap"             element={<DocumentImportPage />} />
          <Route path="/tai-lieu/:id"              element={<DocumentDetailPage />} />
          <Route path="/tai-lieu/:id/sua"          element={<DocumentEditPage />} />

          {/* Kho tài liệu mở rộng (DocManager) */}
          <Route path="/thu-muc"                   element={<FolderManagementPage />} />
          <Route path="/yeu-thich"                 element={<FavoritesPage />} />
          <Route path="/gan-day"                   element={<RecentPage />} />
          <Route path="/thung-rac"                 element={<RecycleBinPage />} />

          {/* Image processing flow */}
          <Route path="/tai-len"                   element={<UploadPage />} />
          <Route path="/tai-len/:uploadId/xu-ly"   element={<ImageProcessPage />} />
          <Route path="/tai-len/:uploadId/luu"     element={<SaveDocumentPage />} />

          {/* Profile & Administration */}
          <Route path="/ho-so"                     element={<ProfilePage />} />
          <Route path="/quan-tri/nguoi-dung"       element={<UserManagementPage />} />
          <Route path="/quan-tri/nhat-ky"          element={<AuditLogPage />} />
        </Route>

        {/* 404 Not Found fallback */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AuthProvider>
  );
}
