/**
 * @swagger
 * tags:
 *   - name: Auth
 *     description: Authentication and registration endpoints
 */
import type { Request, Response } from 'express';
import { asyncHandler, created, ok } from '../utils/apiResponse';
import { authService } from '../services/auth.service';

const clientMeta = (req: Request) => ({
  userAgent: req.headers['user-agent'] as string | undefined,
  ipAddress: req.ip,
});

export const authController = {
  /**
   * @swagger
   * /auth/register:
   *   post:
   *     tags: [Auth]
   *     summary: Register a new account
   *     security: []
   */
  register: asyncHandler(async (req, res) => {
    const user = await authService.register(req.body);
    return created(res, { user }, 'Registered successfully');
  }),

  /**
   * @swagger
   * /auth/login:
   *   post:
   *     tags: [Auth]
   *     summary: Login with email + password
   *     security: []
   */
  login: asyncHandler(async (req, res) => {
    const result = await authService.login(req.body, clientMeta(req));
    return ok(res, result, 'Logged in successfully');
  }),

  refresh: asyncHandler(async (req, res) => {
    const result = await authService.refresh(req.body.refreshToken, clientMeta(req));
    return ok(res, result, 'Token refreshed');
  }),

  logout: asyncHandler(async (req, res) => {
    await authService.logout(req.body?.refreshToken);
    return ok(res, null, 'Logged out');
  }),

  forgotPassword: asyncHandler(async (req, res) => {
    const result = await authService.forgotPassword(req.body.email);
    return ok(res, result, 'If the email exists, an OTP has been sent');
  }),

  verifyOtp: asyncHandler(async (req, res) => {
    const result = await authService.verifyOtp(req.body.email, req.body.otp);
    return ok(res, result, 'OTP verified');
  }),

  resetPassword: asyncHandler(async (req, res) => {
    const result = await authService.resetPassword(
      req.body.email,
      req.body.otp,
      req.body.newPassword,
    );
    return ok(res, result, 'Password reset successfully');
  }),

  me: asyncHandler(async (req: Request, res: Response) => {
    // route is auth-protected, req.user is guaranteed
    return ok(res, { user: req.user }, 'OK');
  }),
};
