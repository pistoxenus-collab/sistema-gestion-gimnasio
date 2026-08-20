import { Router, Response } from 'express';
import { db } from '../db';
import { authenticateToken, requireProfessor, AuthenticatedRequest } from '../auth';

export const enrollmentsRouter = Router();

// Inscribirse a una clase (Student / Professor)
enrollmentsRouter.post('/book', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const { class_id } = req.body;

  if (!class_id) {
    return res.status(400).json({ error: 'ID de la clase es obligatorio' });
  }

  // Use a transaction to ensure atomic capacity check & booking
  const bookTransaction = db.transaction(() => {
    // 1. Get class info and lock
    const classItem = db.prepare(`
      SELECT c.*, 
        (SELECT COUNT(*) FROM enrollments WHERE class_id = c.id AND status != 'cancelled') as current_enrolled
      FROM classes c
      WHERE c.id = ?
    `).get(class_id) as any;

    if (!classItem) {
      throw new Error('La clase solicitada no existe.');
    }

    if (classItem.status === 'cancelled') {
      throw new Error('Esta clase ha sido cancelada por el profesor.');
    }

    // Check if class is in the past
    const today = new Date().toISOString().split('T')[0];
    if (classItem.date < today) {
      throw new Error('No puedes inscribirte a una clase de una fecha pasada.');
    }

    // 2. Check if already enrolled
    const existingEnrollment = db.prepare(`
      SELECT * FROM enrollments WHERE class_id = ? AND user_id = ?
    `).get(class_id, userId) as any;

    if (existingEnrollment) {
      if (existingEnrollment.status === 'enrolled' || existingEnrollment.status === 'attended') {
        throw new Error('Ya estás inscrito en esta clase.');
      } else {
        // Re-activate previously cancelled enrollment
        if (classItem.current_enrolled >= classItem.capacity) {
          throw new Error('Lo sentimos, ya no quedan cupos disponibles para esta clase.');
        }

        db.prepare(`
          UPDATE enrollments
          SET status = 'enrolled', updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(existingEnrollment.id);

        return { id: existingEnrollment.id, message: '¡Inscripción reactivada con éxito!' };
      }
    }

    // 3. Check capacity
    if (classItem.current_enrolled >= classItem.capacity) {
      throw new Error('Lo sentimos, todos los cupos para esta clase están agotados.');
    }

    // 4. Insert new enrollment
    const insert = db.prepare(`
      INSERT INTO enrollments (class_id, user_id, status, enrolled_at)
      VALUES (?, ?, 'enrolled', CURRENT_TIMESTAMP)
    `);
    const result = insert.run(class_id, userId);

    return { id: Number(result.lastInsertRowid), message: '¡Te has inscrito exitosamente a la clase!' };
  });

  try {
    const result = bookTransaction();
    res.status(200).json({ success: true, ...result });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Error al procesar la inscripción' });
  }
});

// Desinscribirse de una clase
enrollmentsRouter.post('/cancel', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { class_id } = req.body;

    if (!class_id) {
      return res.status(400).json({ error: 'ID de la clase es obligatorio' });
    }

    const enrollment = db.prepare(`
      SELECT * FROM enrollments WHERE class_id = ? AND user_id = ?
    `).get(class_id, userId) as any;

    if (!enrollment || enrollment.status === 'cancelled') {
      return res.status(400).json({ error: 'No tienes una inscripción activa para esta clase.' });
    }

    db.prepare(`
      UPDATE enrollments
      SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(enrollment.id);

    res.json({ success: true, message: 'Te has desinscrito de la clase correctamente. Tu cupo ha sido liberado.' });
  } catch (error) {
    console.error('Error cancelling enrollment:', error);
    res.status(500).json({ error: 'Error al cancelar la inscripción' });
  }
});

// Ver las clases del alumno autenticado (Mis Clases)
enrollmentsRouter.get('/my-classes', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    const myClasses = db.prepare(`
      SELECT 
        e.id as enrollment_id,
        e.status as enrollment_status,
        e.enrolled_at,
        c.id as class_id,
        c.title,
        c.category,
        c.description,
        c.instructor_name,
        c.date,
        c.start_time,
        c.end_time,
        c.location,
        c.capacity,
        c.status as class_status,
        (SELECT COUNT(*) FROM enrollments WHERE class_id = c.id AND status != 'cancelled') as enrolled_count
      FROM enrollments e
      JOIN classes c ON e.class_id = c.id
      WHERE e.user_id = ? AND e.status != 'cancelled'
      ORDER BY c.date DESC, c.start_time ASC
    `).all(userId);

    res.json(myClasses);
  } catch (error) {
    console.error('Error fetching user enrollments:', error);
    res.status(500).json({ error: 'Error al obtener tus clases' });
  }
});

// Ver lista de inscritos de una clase específica (Profesor/Admin)
enrollmentsRouter.get('/class/:classId', authenticateToken, requireProfessor, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { classId } = req.params;

    const students = db.prepare(`
      SELECT 
        e.id as enrollment_id,
        e.status as enrollment_status,
        e.enrolled_at,
        u.id as user_id,
        u.name as user_name,
        u.email as user_email,
        u.phone as user_phone
      FROM enrollments e
      JOIN users u ON e.user_id = u.id
      WHERE e.class_id = ? AND e.status != 'cancelled'
      ORDER BY e.enrolled_at ASC
    `).all(classId);

    res.json(students);
  } catch (error) {
    console.error('Error fetching class attendees:', error);
    res.status(500).json({ error: 'Error al obtener los alumnos inscritos' });
  }
});

// Actualizar asistencia de un alumno (Presente / Ausente / Inscrito) (Profesor/Admin)
enrollmentsRouter.patch('/:id/attendance', authenticateToken, requireProfessor, (req: AuthenticatedRequest, res: Response) => {
  try {
    const enrollmentId = req.params.id;
    const { status } = req.body;

    if (!['enrolled', 'attended', 'absent'].includes(status)) {
      return res.status(400).json({ error: 'Estado de asistencia no válido (debe ser enrolled, attended o absent)' });
    }

    const existing = db.prepare('SELECT * FROM enrollments WHERE id = ?').get(enrollmentId);
    if (!existing) {
      return res.status(404).json({ error: 'Registro de inscripción no encontrado' });
    }

    db.prepare(`
      UPDATE enrollments
      SET status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(status, enrollmentId);

    res.json({ success: true, message: 'Asistencia actualizada correctamente' });
  } catch (error) {
    console.error('Error updating attendance:', error);
    res.status(500).json({ error: 'Error al actualizar la asistencia' });
  }
});
