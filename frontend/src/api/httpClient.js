import { API_URL, REQUEST_TIMEOUT_MS } from '../config';

export class ApiError extends Error {
  constructor(message, { status = 0, code = 'UNKNOWN' } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

/** fetch wrapper with a timeout and consistent, user-friendly errors. */
export async function request(path, { method = 'GET', body, timeoutMs = REQUEST_TIMEOUT_MS } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new ApiError('The server took too long to respond', { code: 'TIMEOUT' });
    }
    throw new ApiError('Cannot reach the server. Check your connection.', { code: 'NETWORK' });
  } finally {
    clearTimeout(timer);
  }

  let data = null;
  try {
    data = await response.json();
  } catch {
    // Non-JSON body; handled below.
  }

  if (!response.ok) {
    throw new ApiError(data?.error?.message || `Request failed (${response.status})`, {
      status: response.status,
      code: data?.error?.code,
    });
  }
  return data;
}
