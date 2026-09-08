import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '@/config';

export interface AuthRequest extends Request {
  user?: { id: number; email: string; username: string; role?: string };
}

export function verifyToken(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ success: false, message: 'Token tidak ditemukan' });
    }

    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;

    const decoded = jwt.verify(token, JWT_SECRET) as { id: number; email: string; username: string; role?: string };
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Token tidak valid atau sudah kedaluwarsa' });
  }
}
