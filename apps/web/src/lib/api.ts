import { API_BASE_URL } from './constants';

interface ApiOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: Record<string, unknown>;
  token?: string;
}

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  errors?: unknown;
}

export async function api<T = unknown>(
  endpoint: string,
  options: ApiOptions = {}
): Promise<ApiResponse<T>> {
  const { method = 'GET', body, token } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const json = await res.json();

  if (!res.ok) {
    throw {
      status: res.status,
      message: json.error || json.message || 'Something went wrong',
      errors: json.errors,
    };
  }

  return json as ApiResponse<T>;
}

// Auth-specific API calls
export const authApi = {
  sendOtp: (phone: string) =>
    api('/api/auth/send-otp', {
      method: 'POST',
      body: { phone },
    }),

  verifyOtp: (phone: string, otp: string) =>
    api<{
      user: {
        id: string;
        phone: string;
        role: string | null;
        name: string | null;
        isPhoneVerified: boolean;
      };
      accessToken: string;
      refreshToken: string;
    }>('/api/auth/verify-otp', {
      method: 'POST',
      body: { phone, otp },
    }),

  refreshToken: (refreshToken: string) =>
    api<{ accessToken: string; refreshToken: string }>('/api/auth/refresh', {
      method: 'POST',
      body: { refreshToken },
    }),

  logout: (refreshToken: string) =>
    api('/api/auth/logout', {
      method: 'POST',
      body: { refreshToken },
    }),
};
