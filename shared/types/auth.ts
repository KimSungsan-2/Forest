export interface User {
  id: string;
  email: string;
  displayName: string | null;
  subscriptionTier: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  displayName?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}
