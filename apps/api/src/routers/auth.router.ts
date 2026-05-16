import { Router } from 'express';
import { AuthController } from '@/controllers/auth.controller';
import { verifyToken } from '@/middlewares/auth.middleware';
import { registerLimiter, loginLimiter, forgotPasswordLimiter } from '@/middlewares/rateLimiter';

export class AuthRouter {
  private router: Router;
  private authController: AuthController;

  constructor() {
    this.authController = new AuthController();
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    // Menggunakan .bind() agar 'this' di dalam controller tetap merujuk pada instance controller tersebut.
    // Jika tidak pakai: 'this' menjadi undefined (error saat akses properti class).
    // Jika pakai: 'this' aman dan bisa digunakan.
    
    // Public / Config
    this.router.get('/config', this.authController.getConfig.bind(this.authController));

    // Auth
    this.router.post('/register', registerLimiter, this.authController.register.bind(this.authController));
    this.router.post('/login', loginLimiter, this.authController.login.bind(this.authController));
    this.router.get('/verify-email', this.authController.verifyEmail.bind(this.authController));

    // Forgot / Reset password (rate-limited)
    this.router.post('/forgot-password', forgotPasswordLimiter, this.authController.forgotPassword.bind(this.authController));
    this.router.post('/reset-password', this.authController.resetPassword.bind(this.authController));

    // OAuth
    this.router.post('/auth/google', this.authController.googleAuth.bind(this.authController));

    // Protected
    // this.router.delete('/delete-account', verifyToken, this.authController.deleteAccount.bind(this.authController));
    this.router.delete('/delete-account', this.authController.deleteAccount.bind(this.authController));
    this.router.get('/me/:id', this.authController.getMe.bind(this.authController));
  }

  getRouter(): Router {
    return this.router;
  }
}
