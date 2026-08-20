import { Router, Response } from 'express';
import { db } from '../db';
import { authenticateToken, requireProfessor, AuthenticatedRequest } from '../auth';

export const reportsRouter = Router();

// Reporte mensual detallado (Profesor / Admin)
reportsRouter.get('/monthly', authenticateToken, requireProfessor, (req: AuthenticatedRequest, res: Response) => {
  try {
    const today = new Date();
    const month = parseInt(req.query.month as string) || (today.getMonth() + 1);
    const year = parseInt(req.query.year as string) || today.getFullYear();

    const formattedMonth = String(month).padStart(2, '0');
    const monthPattern = `${year}-${formattedMonth}-%`;

    // 1. Estadísticas Generales del Mes
    const totalClasses = db.prepare(`
      SELECT COUNT(*) as count 
      FROM classes 
      WHERE date LIKE ? AND status = 'active'
    `).get(monthPattern) as { count: number };

    const totalEnrollments = db.prepare(`
      SELECT COUNT(*) as count 
      FROM enrollments e
      JOIN classes c ON e.class_id = c.id
      WHERE c.date LIKE ? AND e.status != 'cancelled'
    `).get(monthPattern) as { count: number };

    const totalAttended = db.prepare(`
      SELECT COUNT(*) as count 
      FROM enrollments e
      JOIN classes c ON e.class_id = c.id
      WHERE c.date LIKE ? AND e.status = 'attended'
    `).get(monthPattern) as { count: number };

    const uniqueStudents = db.prepare(`
      SELECT COUNT(DISTINCT e.user_id) as count 
      FROM enrollments e
      JOIN classes c ON e.class_id = c.id
      WHERE c.date LIKE ? AND e.status != 'cancelled'
    `).get(monthPattern) as { count: number };

    // 2. Resumen por Alumno en el Mes (Alumnos que tomaron clases, total de asistencias y lista de clases)
    const studentsReport = db.prepare(`
      SELECT 
        u.id as user_id,
        u.name as user_name,
        u.email as user_email,
        u.phone as user_phone,
        COUNT(CASE WHEN e.status = 'attended' THEN 1 END) as attended_count,
        COUNT(CASE WHEN e.status = 'enrolled' THEN 1 END) as enrolled_count,
        COUNT(CASE WHEN e.status = 'absent' THEN 1 END) as absent_count,
        COUNT(e.id) as total_bookings
      FROM users u
      LEFT JOIN enrollments e ON u.id = e.user_id AND e.status != 'cancelled'
      LEFT JOIN classes c ON e.class_id = c.id AND c.date LIKE ?
      WHERE u.role = 'student'
      GROUP BY u.id
      ORDER BY attended_count DESC, u.name ASC
    `).all(monthPattern);

    // Para cada alumno, adjuntar las clases específicas que tomó en este mes
    const detailedStudents = studentsReport.map((student: any) => {
      const classesTaken = db.prepare(`
        SELECT 
          c.id as class_id,
          c.title,
          c.category,
          c.date,
          c.start_time,
          c.end_time,
          c.instructor_name,
          e.status as attendance_status,
          e.enrolled_at
        FROM enrollments e
        JOIN classes c ON e.class_id = c.id
        WHERE e.user_id = ? AND c.date LIKE ? AND e.status != 'cancelled'
        ORDER BY c.date DESC, c.start_time ASC
      `).all(student.user_id, monthPattern);

      return {
        ...student,
        classes: classesTaken
      };
    });

    // 3. Resumen por Disciplina / Clase en el Mes
    const classesSummary = db.prepare(`
      SELECT 
        c.category,
        COUNT(DISTINCT c.id) as total_sessions,
        COUNT(e.id) as total_enrolled,
        COUNT(CASE WHEN e.status = 'attended' THEN 1 END) as total_attended,
        ROUND(CAST(COUNT(e.id) AS FLOAT) / MAX(COUNT(DISTINCT c.id), 1), 1) as avg_attendance_per_session
      FROM classes c
      LEFT JOIN enrollments e ON c.id = e.class_id AND e.status != 'cancelled'
      WHERE c.date LIKE ? AND c.status = 'active'
      GROUP BY c.category
      ORDER BY total_attended DESC
    `).all(monthPattern);

    // 4. Registro cronológico detallado de asistencia
    const attendanceLogs = db.prepare(`
      SELECT 
        e.id as enrollment_id,
        u.name as student_name,
        u.email as student_email,
        u.phone as student_phone,
        c.title as class_title,
        c.category as class_category,
        c.date as class_date,
        c.start_time,
        c.end_time,
        c.instructor_name,
        e.status as status,
        e.enrolled_at
      FROM enrollments e
      JOIN users u ON e.user_id = u.id
      JOIN classes c ON e.class_id = c.id
      WHERE c.date LIKE ? AND e.status != 'cancelled'
      ORDER BY c.date DESC, c.start_time ASC, u.name ASC
    `).all(monthPattern);

    res.json({
      month,
      year,
      metrics: {
        total_classes: totalClasses.count,
        total_enrollments: totalEnrollments.count,
        total_attended: totalAttended.count,
        unique_active_students: uniqueStudents.count,
        attendance_rate: totalEnrollments.count > 0 
          ? Math.round((totalAttended.count / totalEnrollments.count) * 100) 
          : 0
      },
      students: detailedStudents,
      categories: classesSummary,
      logs: attendanceLogs
    });
  } catch (error) {
    console.error('Error generating monthly report:', error);
    res.status(500).json({ error: 'Error al generar el reporte mensual' });
  }
});

// Exportar reporte mensual a formato CSV descargable
reportsRouter.get('/export-csv', authenticateToken, requireProfessor, (req: AuthenticatedRequest, res: Response) => {
  try {
    const today = new Date();
    const month = parseInt(req.query.month as string) || (today.getMonth() + 1);
    const year = parseInt(req.query.year as string) || today.getFullYear();

    const formattedMonth = String(month).padStart(2, '0');
    const monthPattern = `${year}-${formattedMonth}-%`;

    const logs = db.prepare(`
      SELECT 
        c.date as Fecha,
        c.start_time as Hora_Inicio,
        c.end_time as Hora_Fin,
        c.title as Clase,
        c.category as Disciplina,
        c.instructor_name as Profesor,
        u.name as Alumno,
        u.email as Correo,
        u.phone as Telefono,
        CASE 
          WHEN e.status = 'attended' THEN 'Asistió (Presente)'
          WHEN e.status = 'absent' THEN 'Ausente'
          WHEN e.status = 'enrolled' THEN 'Inscrito'
          ELSE e.status 
        END as Estado_Asistencia,
        e.enrolled_at as Fecha_Inscripcion
      FROM enrollments e
      JOIN users u ON e.user_id = u.id
      JOIN classes c ON e.class_id = c.id
      WHERE c.date LIKE ? AND e.status != 'cancelled'
      ORDER BY c.date ASC, c.start_time ASC, u.name ASC
    `).all(monthPattern) as any[];

    // Build CSV content
    const headers = ['Fecha', 'Hora Inicio', 'Hora Fin', 'Clase', 'Disciplina', 'Profesor', 'Alumno', 'Correo', 'Telefono', 'Estado Asistencia', 'Fecha Inscripcion'];
    const rows = logs.map(row => [
      `"${row.Fecha || ''}"`,
      `"${row.Hora_Inicio || ''}"`,
      `"${row.Hora_Fin || ''}"`,
      `"${row.Clase ? row.Clase.replace(/"/g, '""') : ''}"`,
      `"${row.Disciplina || ''}"`,
      `"${row.Profesor || ''}"`,
      `"${row.Alumno ? row.Alumno.replace(/"/g, '""') : ''}"`,
      `"${row.Correo || ''}"`,
      `"${row.Telefono || ''}"`,
      `"${row.Estado_Asistencia || ''}"`,
      `"${row.Fecha_Inscripcion || ''}"`
    ].join(','));

    // UTF-8 BOM for Excel compatibility
    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="reporte_asistencia_F6_${year}_${formattedMonth}.csv"`);
    res.status(200).send(csvContent);
  } catch (error) {
    console.error('Error exporting CSV:', error);
    res.status(500).json({ error: 'Error al exportar el archivo CSV' });
  }
});
