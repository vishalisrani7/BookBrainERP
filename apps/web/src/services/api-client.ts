const envApiUrl = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const API_BASE = envApiUrl ? `${envApiUrl}/api/v1` : '/api/v1';

export class ApiError extends Error {
  constructor(message: string, public status?: number, public details?: unknown) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('bookbrain_token');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
    });
  } catch (netErr: unknown) {
    throw new ApiError(
      'Cannot connect to backend server. The server might be waking up or offline. Please retry in a moment.',
      0
    );
  }

  if (response.status === 401) {
    localStorage.removeItem('bookbrain_token');
    localStorage.removeItem('bookbrain_user');
    if (!window.location.pathname.includes('/login')) {
      window.location.href = '/login';
    }
  }

  // Handle binary/download responses
  const contentType = response.headers.get('content-type') || '';
  if (
    contentType.includes('spreadsheetml') ||
    contentType.includes('text/csv') ||
    contentType.includes('application/csv') ||
    contentType.includes('octet-stream') ||
    endpoint.includes('export-')
  ) {
    if (!response.ok) {
      throw new ApiError('Export failed', response.status);
    }
    return (await response.blob()) as unknown as T;
  }

  let data: any = {};
  const rawText = await response.text();
  if (rawText && rawText.trim().length > 0) {
    try {
      data = JSON.parse(rawText);
    } catch {
      if (!response.ok) {
        throw new ApiError(rawText.trim() || `Request failed (Status ${response.status})`, response.status);
      }
      throw new ApiError('Invalid server response format', response.status);
    }
  } else {
    if (!response.ok) {
      if (response.status === 401) {
        throw new ApiError('Invalid username or password', response.status);
      }
      if (response.status === 502 || response.status === 503 || response.status === 504) {
        throw new ApiError('Backend server is waking up or unreachable. Please try again in a few moments.', response.status);
      }
      throw new ApiError(`Server returned status ${response.status}`, response.status);
    }
  }

  if (!response.ok || data.success === false) {
    throw new ApiError(data.error || 'Request failed', response.status, data.issues || data);
  }

  return data.data !== undefined ? data.data : data;
}
