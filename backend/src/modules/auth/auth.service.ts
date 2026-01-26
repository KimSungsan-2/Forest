import bcrypt from 'bcrypt';
import { prisma } from '../../config/database';
import { SignupInput, LoginInput, AuthResponse } from './auth.types';

const SALT_ROUNDS = 12;

export class AuthService {
  /**
   * 회원가입
   */
  async signup(data: SignupInput): Promise<AuthResponse> {
    // 이메일 중복 확인
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new Error('이미 사용 중인 이메일입니다');
    }

    // 비밀번호 해싱
    const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);

    // 사용자 생성
    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        displayName: data.displayName || null,
        lastLoginAt: new Date(),
      },
      select: {
        id: true,
        email: true,
        displayName: true,
        subscriptionTier: true,
      },
    });

    return {
      token: '', // JWT will be added in controller
      user,
    };
  }

  /**
   * 로그인
   */
  async login(data: LoginInput): Promise<AuthResponse> {
    // 사용자 조회
    const user = await prisma.user.findUnique({
      where: { email: data.email },
      select: {
        id: true,
        email: true,
        displayName: true,
        subscriptionTier: true,
        passwordHash: true,
      },
    });

    if (!user) {
      throw new Error('이메일 또는 비밀번호가 올바르지 않습니다');
    }

    // 비밀번호 검증
    const isPasswordValid = await bcrypt.compare(data.password, user.passwordHash);

    if (!isPasswordValid) {
      throw new Error('이메일 또는 비밀번호가 올바르지 않습니다');
    }

    // 마지막 로그인 시간 업데이트
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // passwordHash 제거
    const { passwordHash: _, ...userWithoutPassword } = user;

    return {
      token: '', // JWT will be added in controller
      user: userWithoutPassword,
    };
  }

  /**
   * 사용자 ID로 사용자 조회
   */
  async getUserById(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        displayName: true,
        subscriptionTier: true,
        createdAt: true,
        lastLoginAt: true,
      },
    });

    if (!user) {
      throw new Error('사용자를 찾을 수 없습니다');
    }

    return user;
  }
}

export const authService = new AuthService();
