import { z } from 'zod';

// 회원가입 스키마
export const signupSchema = z.object({
  email: z.string().email('올바른 이메일 주소를 입력해주세요'),
  password: z
    .string()
    .min(8, '비밀번호는 최소 8자 이상이어야 합니다')
    .regex(/[A-Z]/, '비밀번호에는 최소 1개의 대문자가 포함되어야 합니다')
    .regex(/[a-z]/, '비밀번호에는 최소 1개의 소문자가 포함되어야 합니다')
    .regex(/[0-9]/, '비밀번호에는 최소 1개의 숫자가 포함되어야 합니다'),
  displayName: z.string().min(2, '이름은 최소 2자 이상이어야 합니다').optional(),
});

// 로그인 스키마
export const loginSchema = z.object({
  email: z.string().email('올바른 이메일 주소를 입력해주세요'),
  password: z.string().min(1, '비밀번호를 입력해주세요'),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    displayName: string | null;
    subscriptionTier: string;
  };
}

export interface JwtPayload {
  userId: string;
  email: string;
}
