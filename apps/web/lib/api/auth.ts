import { apiRequest } from './client';
import type { SignupRequest, LoginRequest, AuthResponse, User } from '../../../../shared/types/auth';

export const authApi = {
  /**
   * 회원가입
   */
  signup: async (data: SignupRequest): Promise<AuthResponse> => {
    const response = await apiRequest<AuthResponse>('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    // 토큰 저장
    localStorage.setItem('auth_token', response.token);

    return response;
  },

  /**
   * 로그인
   */
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await apiRequest<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    // 토큰 저장
    localStorage.setItem('auth_token', response.token);

    return response;
  },

  /**
   * 로그아웃
   */
  logout: () => {
    localStorage.removeItem('auth_token');
  },

  /**
   * 현재 사용자 정보 조회
   */
  getMe: async (): Promise<{ user: User }> => {
    return apiRequest<{ user: User }>('/api/auth/me');
  },

  /**
   * 토큰 확인
   */
  getToken: (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('auth_token');
  },

  /**
   * 인증 여부 확인
   */
  isAuthenticated: (): boolean => {
    return !!authApi.getToken();
  },

  /**
   * 사용량 정보 조회
   */
  getUsage: async (): Promise<{
    subscriptionTier: string;
    isUnlimited: boolean;
    currentUsage: number | null;
    limit: number | null;
    remaining: number | null;
  }> => {
    return apiRequest('/api/auth/usage');
  },
};
