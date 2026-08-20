import { db, initDatabase } from './db';
import { hashPassword } from './auth';

export function seedDatabase() {
  initDatabase();

  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  if (userCount && userCount.count > 0) {
    console.log('Database already populated. Skipping seed.');
    return;
  }

  console.log('Seeding initial data for F6 Deporte y Recreación...');

  const defaultPassword = hashPassword('123456');

  // 1. Create Users
  const insertUser = db.prepare(`
    INSERT INTO users (name, email, password_hash, role, phone)
    VALUES (?, ?, ?, ?, ?)
  `);

  const profId = insertUser.run(
    'Prof. Carlos Mendoza',
    'profesor@f6.cl',
    defaultPassword,
    'professor',
    '+56 9 8765 4321'
  ).lastInsertRowid;

  insertUser.run(
    'Admin F6',
    'admin@f6.cl',
    defaultPassword,
    'admin',
    '+56 9 1111 2222'
  );

  const students = [
    { name: 'Juan Pérez', email: 'juan@gmail.com', phone: '+56 9 1234 5678' },
    { name: 'María González', email: 'maria@gmail.com', phone: '+56 9 2345 6789' },
    { name: 'Pedro Soto', email: 'pedro@gmail.com', phone: '+56 9 3456 7890' },
    { name: 'Carolina Muñoz', email: 'carolina@gmail.com', phone: '+56 9 4567 8901' },
    { name: 'Diego Rojas', email: 'diego@gmail.com', phone: '+56 9 5678 9012' },
    { name: 'Valentina Silva', email: 'valentina@gmail.com', phone: '+56 9 6789 0123' },
    { name: 'Matías Morales', email: 'matias@gmail.com', phone: '+56 9 7890 1234' },
    { name: 'Camila Castro', email: 'camila@gmail.com', phone: '+56 9 8901 2345' },
    { name: 'Sebastián Herrera', email: 'sebastian@gmail.com', phone: '+56 9 9012 3456' },
    { name: 'Fernanda Araya', email: 'fernanda@gmail.com', phone: '+56 9 0123 4567' }
  ];

  const studentIds: number[] = [];
  for (const s of students) {
    const res = insertUser.run(s.name, s.email, defaultPassword, 'student', s.phone);
    studentIds.push(Number(res.lastInsertRowid));
  }

  // 2. Class Templates
  const classTemplates = [
    { title: 'Entrenamiento Funcional HIIT', category: 'Funcional', start_time: '07:00', end_time: '08:00', capacity: 16, location: 'Sala Central', description: 'Circuito de alta intensidad para quema calórica y resistencia.' },
    { title: 'Spinning Power Ride', category: 'Spinning', start_time: '08:15', end_time: '09:15', capacity: 12, location: 'Sala Ciclo Indoor', description: 'Cardio sobre bicicleta con intervalos de velocidad y resistencia.' },
    { title: 'Cross Training & Fuerza', category: 'Crossfit', start_time: '09:30', end_time: '10:30', capacity: 14, location: 'Box F6', description: 'Levantamiento de peso, kettlebells y trabajo gimnástico.' },
    { title: 'Pilates Core & Postura', category: 'Pilates', start_time: '11:00', end_time: '12:00', capacity: 10, location: 'Sala Studio', description: 'Fortalecimiento de la faja abdominal, flexibilidad y control corporal.' },
    { title: 'Boxeo & Acondicionamiento', category: 'Boxeo', start_time: '18:00', end_time: '19:00', capacity: 14, location: 'Ring & Sacos F6', description: 'Técnica de golpeo, velocidad, coordinación y trabajo cardiovascular.' },
    { title: 'GAP Express (Glúteos, Abdomen, Piernas)', category: 'GAP', start_time: '19:15', end_time: '20:15', capacity: 15, location: 'Sala Central', description: 'Tonificación localizada para tren inferior y zona media.' },
    { title: 'Funcional Nocturno & Calistenia', category: 'Funcional', start_time: '20:30', end_time: '21:30', capacity: 16, location: 'Sala Central', description: 'Trabajo con peso corporal y circuito de fuerza y resistencia.' }
  ];

  const insertClass = db.prepare(`
    INSERT INTO classes (title, category, description, instructor_id, instructor_name, date, start_time, end_time, capacity, location, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertEnrollment = db.prepare(`
    INSERT INTO enrollments (class_id, user_id, status, enrolled_at)
    VALUES (?, ?, ?, ?)
  `);

  // Helper to format date string YYYY-MM-DD
  const formatDate = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const today = new Date();
  // Generate past 20 days and next 7 days
  for (let offset = -20; offset <= 7; offset++) {
    const classDate = new Date(today);
    classDate.setDate(today.getDate() + offset);
    
    // Skip Sundays
    if (classDate.getDay() === 0) continue;

    const dateStr = formatDate(classDate);
    const isPast = offset < 0;
    const isToday = offset === 0;

    // Pick 4 to 6 classes per day
    const dailyClasses = classTemplates.slice(0, classDate.getDay() % 2 === 0 ? 6 : 5);

    for (const tpl of dailyClasses) {
      const res = insertClass.run(
        tpl.title,
        tpl.category,
        tpl.description,
        profId,
        'Prof. Carlos Mendoza',
        dateStr,
        tpl.start_time,
        tpl.end_time,
        tpl.capacity,
        tpl.location,
        'active'
      );
      const classId = Number(res.lastInsertRowid);

      // Randomly enroll students
      // Past classes: enroll 5-10 students and mark most as attended
      // Today: enroll 4-8 students as 'enrolled'
      // Future: enroll 2-5 students as 'enrolled'
      const numStudents = isPast 
        ? Math.floor(Math.random() * 6) + 5 
        : isToday 
          ? Math.floor(Math.random() * 5) + 3 
          : Math.floor(Math.random() * 4) + 1;

      // Shuffle studentIds copy
      const shuffled = [...studentIds].sort(() => 0.5 - Math.random());
      const selectedStudents = shuffled.slice(0, Math.min(numStudents, tpl.capacity));

      for (const studentId of selectedStudents) {
        let status = 'enrolled';
        if (isPast) {
          // 85% attended, 15% absent
          status = Math.random() < 0.85 ? 'attended' : 'absent';
        }
        
        insertEnrollment.run(
          classId,
          studentId,
          status,
          `${dateStr} ${tpl.start_time}:00`
        );
      }
    }
  }

  console.log('Database seeded successfully with users, classes, and monthly enrollments!');
}
