import { useState, useEffect, useCallback, useRef } from 'react';
import { documentService } from '../services/document.service.js';

export function useDocuments({ search = '', type = '', page = 1, limit = 20, sort = 'created_at_desc', folderName = '' } = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const abortRef = useRef(null);

  const fetchDocuments = useCallback(async () => {
    if (abortRef.current) abortRef.current = false;
    const current = {};
    abortRef.current = current;

    setLoading(true);
    setError(null);
    try {
      const result = await documentService.list({ search, type, page, limit, sort, folderName });
      if (abortRef.current === current) {
        setData(result);
      }
    } catch (err) {
      if (abortRef.current === current) {
        setError(err);
      }
    } finally {
      if (abortRef.current === current) {
        setLoading(false);
      }
    }
  }, [search, type, page, limit, sort, folderName]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  return { data, loading, error, refetch: fetchDocuments };
}
