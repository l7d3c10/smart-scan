import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout.jsx';
import DocumentListPage   from './pages/DocumentListPage.jsx';
import DocumentCreatePage from './pages/DocumentCreatePage.jsx';
import DocumentDetailPage from './pages/DocumentDetailPage.jsx';
import DocumentEditPage   from './pages/DocumentEditPage.jsx';
import NotFoundPage       from './pages/NotFoundPage.jsx';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<DocumentListPage />} />
        <Route path="/tai-lieu"          element={<DocumentListPage />} />
        <Route path="/tai-lieu/them"     element={<DocumentCreatePage />} />
        <Route path="/tai-lieu/:id"      element={<DocumentDetailPage />} />
        <Route path="/tai-lieu/:id/sua"  element={<DocumentEditPage />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
