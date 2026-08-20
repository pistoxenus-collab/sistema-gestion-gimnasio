import { Router, Response } from 'express';
import { db } from '../db';
import { generateToken, hashPassword, verifyPassword, authenticateToken, AuthenticatedRequest } from '../auth';

export const authRouter = Router();

// Register new user
authRouter.post('/register', (req, res) => {
  try {
    const { name, email, password, role = 'student', phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Nombre, correo y contraseña son obligatorios' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(cleanEmail);
    if (existing) {
      return res.status(409).json({ error: 'El correo electrónico ya está registrado' });
    }

    const passwordHash = hashPassword(password);
    const validRole = ['professor', 'student', 'admin'].includes(role) ? role : 'student';

    const insert = db.prepare(`
      INSERT INTO users (name, email, password_hash, role, phone)
      VALUES (?, ?, ?, ?, ?)
    `);

    const result = insert.run(name.trim(), cleanEmail, passwordHash, validRole, phone ? phone.trim() : null);
    const user = {
      id: Number(result.lastInsertRowid),
      name: name.trim(),
      email: cleanEmail,
      role: validRole as 'professor' | 'student' | 'admin',
      phone: phone ? phone.trim() : undefined
    };

    const token = generateToken(user);
    res.status(201).json({ user, token, message: 'Usuario registrado con éxito' });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ error: 'Error interno del servidor al registrar usuario' });
  }
});

// Login
authRouter.post('/login', (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Correo y contraseña requeridos' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(cleanEmail) as any;

    if (!user || !verifyPassword(password, user.password_hash)) {
      return res.status(401).json({ error: 'Credenciales inválidas. Verifica tu correo y contraseña.' });
    }

    const authUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone
    };

    const token = generateToken(authUser);
    res.json({ user: authUser, token, message: 'Inicio de sesión exitoso' });
  } catch (error) {
    console.error('Error in login:', error);
    res.status(500).json({ error: 'Error interno del servidor al iniciar sesión' });
  }
});

// Quick demo login / Switch account
authRouter.post('/quick-login', (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: 'ID de usuario requerido' });
    }

    const user = db.prepare('SELECT id, name, email, role, phone FROM users WHERE id = ?').get(userId) as any;
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const authUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone
    };

    const token = generateToken(authUser);
    res.json({ user: authUser, token, message: `Sesión iniciada como ${user.name}` });
  } catch (error) {
    console.error('Error in quick login:', error);
    res.status(500).json({ error: 'Error al cambiar de cuenta' });
  }
});

// Get demo users for easy testing
authRouter.get('/demo-users', (_req, res) => {
  try {
    const users = db.prepare('SELECT id, name, email, role, phone FROM users ORDER BY role DESC, id ASC').all();
    res.json(users);
  } catch (error) {
    console.error('Error fetching demo users:', error);
    res.status(500).json({ error: 'Error al obtener usuarios de demostración' });
  }
});

// Get current user profile
authRouter.get('/me', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = db.prepare('SELECT id, name, email, role, phone, created_at FROM users WHERE id = ?').get(req.user?.id) as any;
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.json(user);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Error al obtener información de usuario' });
  }
});
