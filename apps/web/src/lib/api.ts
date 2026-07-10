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

  getPublicTutorProfile: (tutorUserId: string, token: string) =>
    api<any>(`/api/v1/tutor/${tutorUserId}/public`, {
      method: 'GET',
      token,
    }) as Promise<any>,
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

export const recommendationApi = {
  getHomeRecommendations: (token: string) =>
    api<any>('/api/v1/recommendations/home', {
      method: 'GET',
      token,
    }) as Promise<any>,

  getSectionRecommendations: (section: string, page: number, limit: number, token: string) =>
    api<any>(`/api/v1/recommendations?section=${section}&page=${page}&limit=${limit}`, {
      method: 'GET',
      token,
    }) as Promise<any>,
};

export const applicationApi = {
  applyToRequirement: (requirementId: string, proposal: Record<string, any>, token: string) =>
    api<any>(`/api/v1/applications/requirements/${requirementId}/apply`, {
      method: 'POST',
      body: proposal,
      token,
    }),

  getMyApplications: (token: string) =>
    api<any>('/api/v1/applications/me', {
      method: 'GET',
      token,
    }) as Promise<any>,

  getRequirementApplications: (requirementId: string, token: string) =>
    api<any>(`/api/v1/applications/requirements/${requirementId}`, {
      method: 'GET',
      token,
    }) as Promise<any>,

  acceptApplication: (applicationId: string, token: string) =>
    api<any>(`/api/v1/applications/${applicationId}/accept`, {
      method: 'PATCH',
      token,
    }),

  rejectApplication: (applicationId: string, token: string) =>
    api<any>(`/api/v1/applications/${applicationId}/reject`, {
      method: 'PATCH',
      token,
    }),

  viewApplication: (applicationId: string, token: string) =>
    api<any>(`/api/v1/applications/${applicationId}/view`, {
      method: 'PATCH',
      token,
    }),

  getApplicationDetails: (applicationId: string, token: string) =>
    api<any>(`/api/v1/applications/${applicationId}`, {
      method: 'GET',
      token,
    }) as Promise<any>,

  compareApplications: (applicationIds: string[], token: string) =>
    api<any>('/api/v1/applications/compare', {
      method: 'POST',
      body: { applicationIds },
      token,
    }) as Promise<any>,
};

export const notificationApi = {
  getNotifications: (token: string) =>
    api<any>('/api/v1/notifications', {
      method: 'GET',
      token,
    }) as Promise<any>,

  markNotificationRead: (id: string, token: string) =>
    api<any>(`/api/v1/notifications/${id}/read`, {
      method: 'PATCH',
      token,
    }),
};

export const adminApi = {
  login: (body: any) =>
    api<any>('/api/admin/login', {
      method: 'POST',
      body,
    }) as Promise<any>,

  getAdmins: (token: string) => api<any>('/api/admins', { method: 'GET', token }) as Promise<any>,

  createAdmin: (body: any, token: string) =>
    api<any>('/api/admins', { method: 'POST', body, token }) as Promise<any>,

  updateAdmin: (id: string, body: any, token: string) =>
    api<any>(`/api/admins/${id}`, { method: 'PATCH', body, token }) as Promise<any>,

  deleteAdmin: (id: string, token: string) =>
    api<any>(`/api/admins/${id}`, { method: 'DELETE', token }) as Promise<any>,

  getRoles: (token: string) => api<any>('/api/roles', { method: 'GET', token }) as Promise<any>,

  createRole: (body: any, token: string) =>
    api<any>('/api/roles', { method: 'POST', body, token }) as Promise<any>,

  updateRole: (id: string, body: any, token: string) =>
    api<any>(`/api/roles/${id}`, { method: 'PATCH', body, token }) as Promise<any>,

  getPermissions: (token: string) =>
    api<any>('/api/permissions', { method: 'GET', token }) as Promise<any>,

  getRolePermissions: (roleId: string, token: string) =>
    api<any>(`/api/permissions/roles/${roleId}`, { method: 'GET', token }) as Promise<any>,

  updateRolePermissions: (roleId: string, permissionIds: string[], token: string) =>
    api<any>(`/api/permissions/roles/${roleId}`, {
      method: 'PATCH',
      body: { permissionIds },
      token,
    }) as Promise<any>,

  getUsers: (token: string) => api<any>('/api/users', { method: 'GET', token }) as Promise<any>,

  getUserDetail: (id: string, token: string) =>
    api<any>(`/api/users/${id}`, { method: 'GET', token }) as Promise<any>,

  updateUserStatus: (id: string, isActive: boolean, token: string) =>
    api<any>(`/api/users/${id}`, { method: 'PATCH', body: { isActive }, token }) as Promise<any>,

  deleteUser: (id: string, token: string) =>
    api<any>(`/api/users/${id}`, { method: 'DELETE', token }) as Promise<any>,

  getPendingVerifications: (token: string) =>
    api<any>('/api/verifications', { method: 'GET', token }) as Promise<any>,

  approveVerification: (id: string, token: string) =>
    api<any>(`/api/verifications/${id}/approve`, { method: 'PATCH', token }) as Promise<any>,

  rejectVerification: (id: string, token: string) =>
    api<any>(`/api/verifications/${id}/reject`, { method: 'PATCH', token }) as Promise<any>,

  getReports: (token: string) => api<any>('/api/reports', { method: 'GET', token }) as Promise<any>,

  resolveReport: (id: string, body: any, token: string) =>
    api<any>(`/api/reports/${id}/resolve`, { method: 'PATCH', body, token }) as Promise<any>,

  getPosts: (token: string) =>
    api<any>('/api/admin/posts', { method: 'GET', token }) as Promise<any>,

  createPost: (body: any, token: string) =>
    api<any>('/api/admin/posts', { method: 'POST', body, token }) as Promise<any>,

  updatePost: (id: string, body: any, token: string) =>
    api<any>(`/api/admin/posts/${id}`, { method: 'PATCH', body, token }) as Promise<any>,

  deletePost: (id: string, token: string) =>
    api<any>(`/api/admin/posts/${id}`, { method: 'DELETE', token }) as Promise<any>,

  getOverview: (token: string) =>
    api<any>('/api/analytics/overview', { method: 'GET', token }) as Promise<any>,

  getAuditLogs: (token: string) =>
    api<any>('/api/audit-logs', { method: 'GET', token }) as Promise<any>,
};
