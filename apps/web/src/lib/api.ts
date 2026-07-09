import { API_BASE_URL } from './constants';
import { triggerAuthError } from './auth-error-handler';

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
    const message = json.error || json.message || 'Something went wrong';

    // Automatically log out when the access token is invalid / expired
    if (
      res.status === 401 &&
      typeof message === 'string' &&
      message.toLowerCase().includes('invalid or expired access token')
    ) {
      triggerAuthError();
    }

    throw {
      status: res.status,
      message,
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
        city?: string | null;
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

// Onboarding-specific API calls
export const onboardingApi = {
  submit: (data: Record<string, unknown>, token: string) =>
    api('/api/v1/onboarding', {
      method: 'POST',
      body: data,
      token,
    }),
};

// Profile-specific API calls
export const profileApi = {
  getStudentProfile: (token: string) =>
    api<any>('/api/v1/student/profile', {
      method: 'GET',
      token,
    }),

  getTutorProfile: (token: string) =>
    api<any>('/api/v1/tutor/profile', {
      method: 'GET',
      token,
    }),

  updateStudentProfile: (data: Record<string, unknown>, token: string) =>
    api<any>('/api/v1/student/profile', {
      method: 'PATCH',
      body: data,
      token,
    }),

  updateTutorProfile: (data: Record<string, unknown>, token: string) =>
    api<any>('/api/v1/tutor/profile', {
      method: 'PATCH',
      body: data,
      token,
    }),
};

// Requirement-specific API calls
export const requirementApi = {
  createRequirement: (data: Record<string, unknown>, token: string) =>
    api<any>('/api/v1/requirements', {
      method: 'POST',
      body: data,
      token,
    }),

  getMyRequirements: (token: string) =>
    api<any[]>('/api/v1/requirements/me', {
      method: 'GET',
      token,
    }),

  getRequirementDetail: (id: string, token: string) =>
    api<any>(`/api/v1/requirements/${id}`, {
      method: 'GET',
      token,
    }),

  updateRequirement: (id: string, data: Record<string, unknown>, token: string) =>
    api<any>(`/api/v1/requirements/${id}`, {
      method: 'PATCH',
      body: data,
      token,
    }),

  closeRequirement: (id: string, token: string) =>
    api<any>(`/api/v1/requirements/${id}/close`, {
      method: 'PATCH',
      token,
    }),

  searchRequirements: (
    filters: Record<string, any>,
    page: number,
    limit: number,
    token: string
  ) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        params.append(key, String(val));
      }
    });
    params.append('page', String(page));
    params.append('limit', String(limit));
    return api<any>(`/api/v1/requirements?${params.toString()}`, {
      method: 'GET',
      token,
    }) as Promise<any>;
  },

  getTutorFeed: (page: number, limit: number, token: string) =>
    api<any>(`/api/v1/requirements/tutor/feed?page=${page}&limit=${limit}`, {
      method: 'GET',
      token,
    }) as Promise<any>,
};
