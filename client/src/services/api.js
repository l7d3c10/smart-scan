const BASE = '/api';

async function request(path, options = {}) {
  const url = `${BASE}${path}`;
  const method = options.method || 'GET';
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    const csrfResponse = await fetch(`${BASE}/auth/csrf`, { credentials: 'include' });
    const csrfBody = await csrfResponse.json();
    if (!csrfResponse.ok) throw { status: csrfResponse.status, ...csrfBody.error };
    headers['X-CSRF-Token'] = csrfBody.data.csrfToken;
  }
  const response = await fetch(url, { ...options, method, headers, credentials: 'include' });
  const json = await response.json();
  if (!response.ok) {
    if ([403, 404].includes(response.status) || response.status >= 500) {
      window.dispatchEvent(new CustomEvent('smartscan:api-error', {
        detail: { status: response.status, ref: json.error?.ref, path },
      }));
    }
    throw { path, status: response.status, ...json.error };
  }
  return json.data;
}

async function upload(path, file) {
  const csrfResponse = await fetch(`${BASE}/auth/csrf`, { credentials: 'include' });
  const csrfBody = await csrfResponse.json();
  if (!csrfResponse.ok) throw { status: csrfResponse.status, ...csrfBody.error };

  const formData = new FormData();
  formData.append('file', file);
  const response = await fetch(`${BASE}${path}`, {
    method: 'POST',
    body: formData,
    headers: { 'X-CSRF-Token': csrfBody.data.csrfToken },
    credentials: 'include',
  });
  const json = await response.json();
  if (!response.ok) {
    if ([403, 404].includes(response.status) || response.status >= 500) {
      window.dispatchEvent(new CustomEvent('smartscan:api-error', {
        detail: { status: response.status, ref: json.error?.ref, path },
      }));
    }
    throw { path, status: response.status, ...json.error };
  }
  return json.data;
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body: JSON.stringify(body) }),
  upload,
  put: (path, body) => request(path, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (path) => request(path, { method: 'DELETE' }),
};
