import rateLimit, { ipKeyGenerator } from 'express-rate-limit';

const message = {
  success: false,
  message: 'Terlalu banyak percobaan, coba lagi nanti',
};

export const registerLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 1000,
  keyGenerator: (req: any) => {
    const key = ipKeyGenerator(req.ip || '');
    console.log(`[RateLimit] Register Key: ${key}`);
    return key;
  },
  standardHeaders: true,
  legacyHeaders: false,
  message,
});

export const loginLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 1000,
  keyGenerator: (req: any) => {
    const ip = ipKeyGenerator(req.ip || '');
    const key = `${ip}_${req.body.email || ''}`;
    console.log(`[RateLimit] Login Key: ${key}`);
    return key;
  },
  standardHeaders: true,
  legacyHeaders: false,
  message,
});

export const forgotPasswordLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 10,
  keyGenerator: (req: any) => {
    const ip = ipKeyGenerator(req.ip || '');
    const key = `${ip}_${req.body.email || ''}`;
    console.log(`[RateLimit] ForgotPassword Key: ${key}`);
    return key;
  },
  standardHeaders: true,
  legacyHeaders: false,
  message,
});
