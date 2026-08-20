import { Router, Response } from 'express';
import { db } from '../db';
import { optionalAuthToken, authenticateToken, requireProfessor, AuthenticatedRequest } from '../auth';

export const classesRouter = Router();

// Get classes with filters and user enrollment status
classesRouter.get('/', optionalAuthToken, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { date, category, search, month, year } = req.query;
    const currentUserId = req.user?.id || 0;

    let query = `
      SELECT 
        c.*,
        (SELECT COUNT(*) FROM enrollments e WHERE e.class_id = c.id AND e.status != 'cancelled') as enrolled_count,
        (c.capacity - (SELECT COUNT(*) FROM enrollments e WHERE e.class_id = c.id AND e.status != 'cancelled')) as available_spots,
        (SELECT status FROM enrollments e WHERE e.class_id = c.id AND e.user_id = ?) as user_enrollment_status
      FROM classes c
      WHERE 1=1
    `;
    const params: any[] = [currentUserId];

    if (date) {
      query += ` AND c.date = ?`;
      params.push(date);
    } else if (month && year) {
      const formattedMonth = String(month).padStart(2, '0');
      query += ` AND c.date LIKE ?`;
      params.push(`${year}-${formattedMonth}-%`);
    }

    if (category && category !== 'all') {
      query += ` AND c.category = ?`;
      params.push(category);
    }

    if (search) {
      query += ` AND (c.title LIKE ? OR c.description LIKE ? OR c.instructor_name LIKE ?)`;
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam);
    }

    query += ` ORDER BY c.date ASC, c.start_time ASC`;

    const classes = db.prepare(query).all(...params).map((c: any) => ({
      ...c,
      is_full: c.available_spots <= 0,
      is_enrolled: c.user_enrollment_status === 'enrolled' || c.user_enrollment_status === 'attended'
    }));

    res.json(classes);
  } catch (error) {
    console.error('Error fetching classes:', error);
    res.status(500).json({ error: 'Error al obtener las clases' });
  }
});

// Get single class details
classesRouter.get('/:id', optionalAuthToken, (req: AuthenticatedRequest, res: Response) => {
  try {
    const classId = req.params.id;
    const currentUserId = req.user?.id || 0;

    const classData = db.prepare(`
      SELECT 
        c.*,
        (SELECT COUNT(*) FROM enrollments e WHERE e.class_id = c.id AND e.status != 'cancelled') as enrolled_count,
        (c.capacity - (SELECT COUNT(*) FROM enrollments e WHERE e.class_id = c.id AND e.status != 'cancelled')) as available_spots,
        (SELECT status FROM enrollments e WHERE e.class_id = c.id AND e.user_id = ?) as user_enrollment_status
      FROM classes c
      WHERE c.id = ?
    `).get(currentUserId, classId) as any;

    if (!classData) {
      return res.status(404).json({ error: 'Clase no encontrada' });
    }

    // If requester is professor, include enrolled students list
    let enrolledStudents = [];
    if (req.user && (req.user.role === 'professor' || req.user.role === 'admin')) {
      enrolledStudents = db.prepare(`
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
    }

    res.json({
      ...classData,
      is_full: classData.available_spots <= 0,
      is_enrolled: classData.user_enrollment_status === 'enrolled' || classData.user_enrollment_status === 'attended',
      students: enrolledStudents
    });
  } catch (error) {
    console.error('Error fetching class details:', error);
    res.status(500).json({ error: 'Error al obtener detalles de la clase' });
  }
});

// Create new class (Professor/Admin only)
classesRouter.post('/', authenticateToken, requireProfessor, (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      title,
      category,
      description = '',
      instructor_name,
      date,
      start_time,
      end_time,
      capacity = 15,
      location = 'Sala Principal'
    } = req.body;

    if (!title || !category || !date || !start_time || !end_time) {
      return res.status(400).json({ error: 'Título, categoría, fecha y horarios son obligatorios' });
    }

    const instructorId = req.user!.id;
    const finalInstructorName = instructor_name || req.user!.name;

    const insert = db.prepare(`
      INSERT INTO classes (title, category, description, instructor_id, instructor_name, date, start_time, end_time, capacity, location, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
    `);

    const result = insert.run(
      title.trim(),
      category.trim(),
      description.trim(),
      instructorId,
      finalInstructorName,
      date,
      start_time,
      end_time,
      Number(capacity),
      location.trim()
    );

    const newClass = db.prepare('SELECT * FROM classes WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ class: newClass, message: 'Clase creada exitosamente' });
  } catch (error) {
    console.error('Error creating class:', error);
    res.status(500).json({ error: 'Error interno al crear la clase' });
  }
});

// Edit class (Professor/Admin only)
classesRouter.put('/:id', authenticateToken, requireProfessor, (req: AuthenticatedRequest, res: Response) => {
  try {
    const classId = req.params.id;
    const {
      title,
      category,
      description,
      instructor_name,
      date,
      start_time,
      end_time,
      capacity,
      location,
      status
    } = req.body;

    const existing = db.prepare('SELECT * FROM classes WHERE id = ?').get(classId) as any;
    if (!existing) {
      return res.status(404).json({ error: 'Clase no encontrada' });
    }

    const update = db.prepare(`
      UPDATE classes
      SET title = COALESCE(?, title),
          category = COALESCE(?, category),
          description = COALESCE(?, description),
          instructor_name = COALESCE(?, instructor_name),
          date = COALESCE(?, date),
          start_time = COALESCE(?, start_time),
          end_time = COALESCE(?, end_time),
          capacity = COALESCE(?, capacity),
          location = COALESCE(?, location),
          status = COALESCE(?, status)
      WHERE id = ?
    `);

    update.run(
      title ? title.trim() : null,
      category ? category.trim() : null,
      description !== undefined ? description.trim() : null,
      instructor_name ? instructor_name.trim() : null,
      date || null,
      start_time || null,
      end_time || null,
      capacity ? Number(capacity) : null,
      location ? location.trim() : null,
      status || null,
      classId
    );

    const updated = db.prepare('SELECT * FROM classes WHERE id = ?').get(classId);
    res.json({ class: updated, message: 'Clase actualizada exitosamente' });
  } catch (error) {
    console.error('Error updating class:', error);
    res.status(500).json({ error: 'Error al actualizar la clase' });
  }
});

// Cancel / Delete class (Professor/Admin only)
classesRouter.delete('/:id', authenticateToken, requireProfessor, (req: AuthenticatedRequest, res: Response) => {
  try {
    const classId = req.params.id;
    const existing = db.prepare('SELECT * FROM classes WHERE id = ?').get(classId);
    if (!existing) {
      return res.status(404).json({ error: 'Clase no encontrada' });
    }

    db.prepare('DELETE FROM classes WHERE id = ?').run(classId);
    res.json({ message: 'Clase eliminada exitosamente' });
  } catch (error) {
    console.error('Error deleting class:', error);
    res.status(500).json({ error: 'Error al eliminar la clase' });
  }
});
