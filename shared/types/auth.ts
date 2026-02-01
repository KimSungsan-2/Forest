export interface ChildProfile {
  name?: string;
  birthDate: string; // "YYYY-MM" format
  gender?: 'boy' | 'girl' | 'other';
}

export interface User {
  id: string;
  email: string;
  displayName: string | null;
  subscriptionTier: string;
  parentingType?: string | null;
  childProfiles?: ChildProfile[] | null;
}

export interface UpdateProfileRequest {
  displayName?: string;
  parentingType?: string;
  childProfiles?: ChildProfile[];
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
