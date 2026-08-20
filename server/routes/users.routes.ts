import { Router, Response } from 'express';
import { db } from '../db';
import { authenticateToken, requireProfessor, AuthenticatedRequest } from '../auth';

export const usersRouter = Router();

// List all students with attendance stats (Professor / Admin only)
usersRouter.get('/students', authenticateToken, requireProfessor, (_req: AuthenticatedRequest, res: Response) => {
  try {
    const students = db.prepare(`
      SELECT 
        u.id,
        u.name,
        u.email,
        u.phone,
        u.created_at,
        COUNT(CASE WHEN e.status = 'attended' THEN 1 END) as total_attended,
        COUNT(CASE WHEN e.status = 'enrolled' THEN 1 END) as active_bookings,
        COUNT(CASE WHEN e.status = 'absent' THEN 1 END) as total_absent
      FROM users u
      LEFT JOIN enrollments e ON u.id = e.user_id AND e.status != 'cancelled'
      WHERE u.role = 'student'
      GROUP BY u.id
      ORDER BY u.name ASC
    `).all();

    res.json(students);
  } catch (error) {
    console.error('Error fetching students list:', error);
    res.status(500).json({ error: 'Error al obtener lista de alumnos' });
  }
});

// Update profile info (current user)
usersRouter.put('/profile', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { name, phone } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'El nombre es obligatorio' });
    }

    db.prepare(`
      UPDATE users
      SET name = ?, phone = ?
      WHERE id = ?
    `).run(name.trim(), phone ? phone.trim() : null, userId);

    const updatedUser = db.prepare('SELECT id, name, email, role, phone FROM users WHERE id = ?').get(userId);
    res.json({ user: updatedUser, message: 'Perfil actualizado con éxito' });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Error al actualizar perfil' });
  }
});
