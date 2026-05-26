import { prisma } from '../config/prisma';
import { env } from '../config/env';
import {
  comparePassword,
  hashPassword,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  generateOtp,
} from '../utils/crypto';
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
  UnauthorizedError,
} from '../utils/AppError';
import { userRepository } from '../repositories/user.repository';
import { ROLES } from '../constants';
import { logger } from '../config/logger';

const REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000;

interface ClientMeta {
  userAgent?: string;
  ipAddress?: string;
}

const sanitizeUser = (u: {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  isVerified: boolean;
  role: { name: string };
}) => ({
  id: u.id,
  email: u.email,
  name: u.name,
  avatarUrl: u.avatarUrl,
  isVerified: u.isVerified,
  role: u.role.name,
});

export const authService = {
  async register(input: { name: string; email: string; password: string }) {
    const existing = await userRepository.findByEmail(input.email);
    if (existing) throw new ConflictError('An account with this email already exists');

    const memberRole = await prisma.role.findUnique({ where: { name: ROLES.MEMBER } });
    if (!memberRole) throw new Error('Default role not seeded');

    const hashed = await hashPassword(input.password);
    const user = await userRepository.create({
      email: input.email,
      name: input.name,
      password: hashed,
      role: { connect: { id: memberRole.id } },
      notificationPrefs: { create: {} },
    });

    logger.info('User registered', { userId: user.id });
    return sanitizeUser(user);
  },

  async login(input: { email: string; password: string }, meta: ClientMeta) {
    const user = await userRepository.findByEmail(input.email);
    if (!user || !user.isActive) throw new UnauthorizedError('Invalid credentials');

    const valid = await comparePassword(input.password, user.password);
    if (!valid) throw new UnauthorizedError('Invalid credentials');

    return this.issueTokens(user, meta);
  },

  async issueTokens(user: { id: string; email: string; role: { name: string } }, meta: ClientMeta) {
    const payload = { sub: user.id, email: user.email, role: user.role.name };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
        userAgent: meta.userAgent,
        ipAddress: meta.ipAddress,
      },
    });

    const full = await userRepository.findByIdSafe(user.id);
    return { accessToken, refreshToken, user: full };
  },

  async refresh(refreshToken: string, meta: ClientMeta) {
    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    const stored = await prisma.refreshToken.findUnique({ where: { token: refreshToken } });
    if (!stored || stored.revoked || stored.expiresAt < new Date()) {
      throw new UnauthorizedError('Refresh token revoked or expired');
    }

    // rotate
    await prisma.refreshToken.update({ where: { id: stored.id }, data: { revoked: true } });

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      include: { role: true },
    });
    if (!user || !user.isActive) throw new UnauthorizedError('User no longer active');

    return this.issueTokens(user, meta);
  },

  async logout(refreshToken: string) {
    if (!refreshToken) return;
    await prisma.refreshToken
      .update({ where: { token: refreshToken }, data: { revoked: true } })
      .catch(() => null);
  },

  async forgotPassword(email: string) {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      // avoid email enumeration — pretend success
      return { sent: true };
    }
    const otp = generateOtp();
    await prisma.user.update({
      where: { id: user.id },
      data: { otpCode: otp, otpExpires: new Date(Date.now() + 10 * 60 * 1000) },
    });
    logger.info(`OTP for ${email}: ${otp}`); // in production this would be emailed
    return { sent: true, devOtp: env.NODE_ENV !== 'production' ? otp : undefined };
  },

  async verifyOtp(email: string, otp: string) {
    const user = await userRepository.findByEmail(email);
    if (!user || !user.otpCode || !user.otpExpires) {
      throw new BadRequestError('Invalid OTP request');
    }
    if (user.otpExpires < new Date()) throw new BadRequestError('OTP expired');
    if (user.otpCode !== otp) throw new BadRequestError('Invalid OTP');
    return { valid: true };
  },

  async resetPassword(email: string, otp: string, newPassword: string) {
    await this.verifyOtp(email, otp);
    const user = await userRepository.findByEmail(email);
    if (!user) throw new NotFoundError('User not found');
    const hashed = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashed, otpCode: null, otpExpires: null, isVerified: true },
    });
    // revoke existing sessions
    await prisma.refreshToken.updateMany({
      where: { userId: user.id, revoked: false },
      data: { revoked: true },
    });
    return { success: true };
  },
};
