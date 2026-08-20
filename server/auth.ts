import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'f6_deporte_recreacion_secret_key_2026';

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: 'professor' | 'student' | 'admin';
  phone?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

export function generateToken(user: AuthUser): string {
  return jwt.sign(
    { id: user.id, name: user.name, email: user.email, role: user.role, phone: user.phone },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
}

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10);
}

export function verifyPassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash);
}

export function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token de autenticación requerido' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token inválido o expirado' });
    }
    req.user = user as AuthUser;
    next();
  });
}

export function optionalAuthToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (!err && user) {
        req.user = user as AuthUser;
      }
      next();
    });
  } else {
    next();
  }
}

export function requireProfessor(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user || (req.user.role !== 'professor' && req.user.role !== 'admin')) {
    return res.status(403).json({ error: 'Acceso restringido: Se requieren permisos de Profesor o Administrador' });
  }
  next();
}
