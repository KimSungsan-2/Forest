import { apiRequest } from './client';

export interface AdminSummary {
  totalUsers: number;
  totalReflections: number;
  totalConversations: number;
  newUsersToday: number;
  reflectionsToday: number;
}

export interface SubscriptionBreakdown {
  tier: string;
  count: number;
}

export interface ActiveUsersData {
  days: number;
  activeUsers: number;
}

export interface AdminUser {
  id: string;
  email: string;
  displayName: string | null;
  subscriptionTier: string;
  createdAt: string;
  lastLoginAt: string | null;
  reflectionCount: number;
}

export interface UserListResponse {
  users: AdminUser[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface TokenUsageData {
  days: number;
  totalTokens: number;
  totalResponses: number;
}

export function getAdminSummary() {
  return apiRequest<AdminSummary>('/api/admin/summary');
}

export function getSubscriptions() {
  return apiRequest<SubscriptionBreakdown[]>('/api/admin/subscriptions');
}

export function getActiveUsers(days = 7) {
  return apiRequest<ActiveUsersData>(`/api/admin/active-users?days=${days}`);
}

export function getUsers(page = 1, limit = 20) {
  return apiRequest<UserListResponse>(`/api/admin/users?page=${page}&limit=${limit}`);
}

export function getTokenUsage(days = 30) {
  return apiRequest<TokenUsageData>(`/api/admin/token-usage?days=${days}`);
}
