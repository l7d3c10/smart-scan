import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export function ApiErrorRedirector() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    function onApiError(event) {
      const { status, ref } = event.detail || {};
      const path = status === 403 ? '/403' : status === 404 ? '/404' : '/500';
      navigate(path, { replace: true, state: { ref, from: location.pathname } });
    }
    window.addEventListener('smartscan:api-error', onApiError);
    return () => window.removeEventListener('smartscan:api-error', onApiError);
  }, [navigate, location.pathname]);

  return null;
}
