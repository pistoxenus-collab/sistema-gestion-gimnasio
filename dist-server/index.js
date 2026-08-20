// server/index.ts
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path2 from "path";
import fs2 from "fs";
import { fileURLToPath } from "url";

// server/db.ts
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
var dataDir = path.resolve(process.cwd(), "data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}
var dbPath = path.join(dataDir, "gym.db");
var db = new Database(dbPath);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");
function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('professor', 'student', 'admin')),
      phone TEXT,
      avatar TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS classes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      description TEXT,
      instructor_id INTEGER NOT NULL,
      instructor_name TEXT NOT NULL,
      date TEXT NOT NULL, -- Format: YYYY-MM-DD
      start_time TEXT NOT NULL, -- Format: HH:mm
      end_time TEXT NOT NULL, -- Format: HH:mm
      capacity INTEGER NOT NULL DEFAULT 15,
      location TEXT DEFAULT 'Sala Principal',
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'cancelled')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (instructor_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS enrollments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      class_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'enrolled' CHECK(status IN ('enrolled', 'attended', 'absent', 'cancelled')),
      enrolled_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(class_id, user_id)
    );

    CREATE INDEX IF NOT EXISTS idx_classes_date ON classes(date);
    CREATE INDEX IF NOT EXISTS idx_enrollments_class_id ON enrollments(class_id);
    CREATE INDEX IF NOT EXISTS idx_enrollments_user_id ON enrollments(user_id);
  `);
}

// server/auth.ts
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
var JWT_SECRET = process.env.JWT_SECRET || "f6_deporte_recreacion_secret_key_2026";
function generateToken(user) {
  return jwt.sign(
    { id: user.id, name: user.name, email: user.email, role: user.role, phone: user.phone },
    JWT_SECRET,
    { expiresIn: "30d" }
  );
}
function hashPassword(password) {
  return bcrypt.hashSync(password, 10);
}
function verifyPassword(password, hash) {
  return bcrypt.compareSync(password, hash);
}
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ error: "Token de autenticaci\xF3n requerido" });
  }
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: "Token inv\xE1lido o expirado" });
    }
    req.user = user;
    next();
  });
}
function optionalAuthToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (token) {
    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (!err && user) {
        req.user = user;
      }
      next();
    });
  } else {
    next();
  }
}
function requireProfessor(req, res, next) {
  if (!req.user || req.user.role !== "professor" && req.user.role !== "admin") {
    return res.status(403).json({ error: "Acceso restringido: Se requieren permisos de Profesor o Administrador" });
  }
  next();
}

// server/seed.ts
function seedDatabase() {
  initDatabase();
  const userCount = db.prepare("SELECT COUNT(*) as count FROM users").get();
  if (userCount && userCount.count > 0) {
    console.log("Database already populated. Skipping seed.");
    return;
  }
  console.log("Seeding initial data for F6 Deporte y Recreaci\xF3n...");
  const defaultPassword = hashPassword("123456");
  const insertUser = db.prepare(`
    INSERT INTO users (name, email, password_hash, role, phone)
    VALUES (?, ?, ?, ?, ?)
  `);
  const profId = insertUser.run(
    "Prof. Carlos Mendoza",
    "profesor@f6.cl",
    defaultPassword,
    "professor",
    "+56 9 8765 4321"
  ).lastInsertRowid;
  insertUser.run(
    "Admin F6",
    "admin@f6.cl",
    defaultPassword,
    "admin",
    "+56 9 1111 2222"
  );
  const students = [
    { name: "Juan P\xE9rez", email: "juan@gmail.com", phone: "+56 9 1234 5678" },
    { name: "Mar\xEDa Gonz\xE1lez", email: "maria@gmail.com", phone: "+56 9 2345 6789" },
    { name: "Pedro Soto", email: "pedro@gmail.com", phone: "+56 9 3456 7890" },
    { name: "Carolina Mu\xF1oz", email: "carolina@gmail.com", phone: "+56 9 4567 8901" },
    { name: "Diego Rojas", email: "diego@gmail.com", phone: "+56 9 5678 9012" },
    { name: "Valentina Silva", email: "valentina@gmail.com", phone: "+56 9 6789 0123" },
    { name: "Mat\xEDas Morales", email: "matias@gmail.com", phone: "+56 9 7890 1234" },
    { name: "Camila Castro", email: "camila@gmail.com", phone: "+56 9 8901 2345" },
    { name: "Sebasti\xE1n Herrera", email: "sebastian@gmail.com", phone: "+56 9 9012 3456" },
    { name: "Fernanda Araya", email: "fernanda@gmail.com", phone: "+56 9 0123 4567" }
  ];
  const studentIds = [];
  for (const s of students) {
    const res = insertUser.run(s.name, s.email, defaultPassword, "student", s.phone);
    studentIds.push(Number(res.lastInsertRowid));
  }
  const classTemplates = [
    { title: "Entrenamiento Funcional HIIT", category: "Funcional", start_time: "07:00", end_time: "08:00", capacity: 16, location: "Sala Central", description: "Circuito de alta intensidad para quema cal\xF3rica y resistencia." },
    { title: "Spinning Power Ride", category: "Spinning", start_time: "08:15", end_time: "09:15", capacity: 12, location: "Sala Ciclo Indoor", description: "Cardio sobre bicicleta con intervalos de velocidad y resistencia." },
    { title: "Cross Training & Fuerza", category: "Crossfit", start_time: "09:30", end_time: "10:30", capacity: 14, location: "Box F6", description: "Levantamiento de peso, kettlebells y trabajo gimn\xE1stico." },
    { title: "Pilates Core & Postura", category: "Pilates", start_time: "11:00", end_time: "12:00", capacity: 10, location: "Sala Studio", description: "Fortalecimiento de la faja abdominal, flexibilidad y control corporal." },
    { title: "Boxeo & Acondicionamiento", category: "Boxeo", start_time: "18:00", end_time: "19:00", capacity: 14, location: "Ring & Sacos F6", description: "T\xE9cnica de golpeo, velocidad, coordinaci\xF3n y trabajo cardiovascular." },
    { title: "GAP Express (Gl\xFAteos, Abdomen, Piernas)", category: "GAP", start_time: "19:15", end_time: "20:15", capacity: 15, location: "Sala Central", description: "Tonificaci\xF3n localizada para tren inferior y zona media." },
    { title: "Funcional Nocturno & Calistenia", category: "Funcional", start_time: "20:30", end_time: "21:30", capacity: 16, location: "Sala Central", description: "Trabajo con peso corporal y circuito de fuerza y resistencia." }
  ];
  const insertClass = db.prepare(`
    INSERT INTO classes (title, category, description, instructor_id, instructor_name, date, start_time, end_time, capacity, location, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertEnrollment = db.prepare(`
    INSERT INTO enrollments (class_id, user_id, status, enrolled_at)
    VALUES (?, ?, ?, ?)
  `);
  const formatDate = (d) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };
  const today = /* @__PURE__ */ new Date();
  for (let offset = -20; offset <= 7; offset++) {
    const classDate = new Date(today);
    classDate.setDate(today.getDate() + offset);
    if (classDate.getDay() === 0) continue;
    const dateStr = formatDate(classDate);
    const isPast = offset < 0;
    const isToday = offset === 0;
    const dailyClasses = classTemplates.slice(0, classDate.getDay() % 2 === 0 ? 6 : 5);
    for (const tpl of dailyClasses) {
      const res = insertClass.run(
        tpl.title,
        tpl.category,
        tpl.description,
        profId,
        "Prof. Carlos Mendoza",
        dateStr,
        tpl.start_time,
        tpl.end_time,
        tpl.capacity,
        tpl.location,
        "active"
      );
      const classId = Number(res.lastInsertRowid);
      const numStudents = isPast ? Math.floor(Math.random() * 6) + 5 : isToday ? Math.floor(Math.random() * 5) + 3 : Math.floor(Math.random() * 4) + 1;
      const shuffled = [...studentIds].sort(() => 0.5 - Math.random());
      const selectedStudents = shuffled.slice(0, Math.min(numStudents, tpl.capacity));
      for (const studentId of selectedStudents) {
        let status = "enrolled";
        if (isPast) {
          status = Math.random() < 0.85 ? "attended" : "absent";
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
  console.log("Database seeded successfully with users, classes, and monthly enrollments!");
}

// server/routes/auth.routes.ts
import { Router } from "express";
var authRouter = Router();
authRouter.post("/register", (req, res) => {
  try {
    const { name, email, password, role = "student", phone } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: "Nombre, correo y contrase\xF1a son obligatorios" });
    }
    const cleanEmail = email.trim().toLowerCase();
    const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(cleanEmail);
    if (existing) {
      return res.status(409).json({ error: "El correo electr\xF3nico ya est\xE1 registrado" });
    }
    const passwordHash = hashPassword(password);
    const validRole = ["professor", "student", "admin"].includes(role) ? role : "student";
    const insert = db.prepare(`
      INSERT INTO users (name, email, password_hash, role, phone)
      VALUES (?, ?, ?, ?, ?)
    `);
    const result = insert.run(name.trim(), cleanEmail, passwordHash, validRole, phone ? phone.trim() : null);
    const user = {
      id: Number(result.lastInsertRowid),
      name: name.trim(),
      email: cleanEmail,
      role: validRole,
      phone: phone ? phone.trim() : void 0
    };
    const token = generateToken(user);
    res.status(201).json({ user, token, message: "Usuario registrado con \xE9xito" });
  } catch (error) {
    console.error("Error registering user:", error);
    res.status(500).json({ error: "Error interno del servidor al registrar usuario" });
  }
});
authRouter.post("/login", (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Correo y contrase\xF1a requeridos" });
    }
    const cleanEmail = email.trim().toLowerCase();
    const user = db.prepare("SELECT * FROM users WHERE email = ?").get(cleanEmail);
    if (!user || !verifyPassword(password, user.password_hash)) {
      return res.status(401).json({ error: "Credenciales inv\xE1lidas. Verifica tu correo y contrase\xF1a." });
    }
    const authUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone
    };
    const token = generateToken(authUser);
    res.json({ user: authUser, token, message: "Inicio de sesi\xF3n exitoso" });
  } catch (error) {
    console.error("Error in login:", error);
    res.status(500).json({ error: "Error interno del servidor al iniciar sesi\xF3n" });
  }
});
authRouter.post("/quick-login", (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: "ID de usuario requerido" });
    }
    const user = db.prepare("SELECT id, name, email, role, phone FROM users WHERE id = ?").get(userId);
    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }
    const authUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone
    };
    const token = generateToken(authUser);
    res.json({ user: authUser, token, message: `Sesi\xF3n iniciada como ${user.name}` });
  } catch (error) {
    console.error("Error in quick login:", error);
    res.status(500).json({ error: "Error al cambiar de cuenta" });
  }
});
authRouter.get("/demo-users", (_req, res) => {
  try {
    const users = db.prepare("SELECT id, name, email, role, phone FROM users ORDER BY role DESC, id ASC").all();
    res.json(users);
  } catch (error) {
    console.error("Error fetching demo users:", error);
    res.status(500).json({ error: "Error al obtener usuarios de demostraci\xF3n" });
  }
});
authRouter.get("/me", authenticateToken, (req, res) => {
  try {
    const user = db.prepare("SELECT id, name, email, role, phone, created_at FROM users WHERE id = ?").get(req.user?.id);
    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }
    res.json(user);
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).json({ error: "Error al obtener informaci\xF3n de usuario" });
  }
});

// server/routes/classes.routes.ts
import { Router as Router2 } from "express";
var classesRouter = Router2();
classesRouter.get("/", optionalAuthToken, (req, res) => {
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
    const params = [currentUserId];
    if (date) {
      query += ` AND c.date = ?`;
      params.push(date);
    } else if (month && year) {
      const formattedMonth = String(month).padStart(2, "0");
      query += ` AND c.date LIKE ?`;
      params.push(`${year}-${formattedMonth}-%`);
    }
    if (category && category !== "all") {
      query += ` AND c.category = ?`;
      params.push(category);
    }
    if (search) {
      query += ` AND (c.title LIKE ? OR c.description LIKE ? OR c.instructor_name LIKE ?)`;
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam);
    }
    query += ` ORDER BY c.date ASC, c.start_time ASC`;
    const classes = db.prepare(query).all(...params).map((c) => ({
      ...c,
      is_full: c.available_spots <= 0,
      is_enrolled: c.user_enrollment_status === "enrolled" || c.user_enrollment_status === "attended"
    }));
    res.json(classes);
  } catch (error) {
    console.error("Error fetching classes:", error);
    res.status(500).json({ error: "Error al obtener las clases" });
  }
});
classesRouter.get("/:id", optionalAuthToken, (req, res) => {
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
    `).get(currentUserId, classId);
    if (!classData) {
      return res.status(404).json({ error: "Clase no encontrada" });
    }
    let enrolledStudents = [];
    if (req.user && (req.user.role === "professor" || req.user.role === "admin")) {
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
      is_enrolled: classData.user_enrollment_status === "enrolled" || classData.user_enrollment_status === "attended",
      students: enrolledStudents
    });
  } catch (error) {
    console.error("Error fetching class details:", error);
    res.status(500).json({ error: "Error al obtener detalles de la clase" });
  }
});
classesRouter.post("/", authenticateToken, requireProfessor, (req, res) => {
  try {
    const {
      title,
      category,
      description = "",
      instructor_name,
      date,
      start_time,
      end_time,
      capacity = 15,
      location = "Sala Principal"
    } = req.body;
    if (!title || !category || !date || !start_time || !end_time) {
      return res.status(400).json({ error: "T\xEDtulo, categor\xEDa, fecha y horarios son obligatorios" });
    }
    const instructorId = req.user.id;
    const finalInstructorName = instructor_name || req.user.name;
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
    const newClass = db.prepare("SELECT * FROM classes WHERE id = ?").get(result.lastInsertRowid);
    res.status(201).json({ class: newClass, message: "Clase creada exitosamente" });
  } catch (error) {
    console.error("Error creating class:", error);
    res.status(500).json({ error: "Error interno al crear la clase" });
  }
});
classesRouter.put("/:id", authenticateToken, requireProfessor, (req, res) => {
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
    const existing = db.prepare("SELECT * FROM classes WHERE id = ?").get(classId);
    if (!existing) {
      return res.status(404).json({ error: "Clase no encontrada" });
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
      description !== void 0 ? description.trim() : null,
      instructor_name ? instructor_name.trim() : null,
      date || null,
      start_time || null,
      end_time || null,
      capacity ? Number(capacity) : null,
      location ? location.trim() : null,
      status || null,
      classId
    );
    const updated = db.prepare("SELECT * FROM classes WHERE id = ?").get(classId);
    res.json({ class: updated, message: "Clase actualizada exitosamente" });
  } catch (error) {
    console.error("Error updating class:", error);
    res.status(500).json({ error: "Error al actualizar la clase" });
  }
});
classesRouter.delete("/:id", authenticateToken, requireProfessor, (req, res) => {
  try {
    const classId = req.params.id;
    const existing = db.prepare("SELECT * FROM classes WHERE id = ?").get(classId);
    if (!existing) {
      return res.status(404).json({ error: "Clase no encontrada" });
    }
    db.prepare("DELETE FROM classes WHERE id = ?").run(classId);
    res.json({ message: "Clase eliminada exitosamente" });
  } catch (error) {
    console.error("Error deleting class:", error);
    res.status(500).json({ error: "Error al eliminar la clase" });
  }
});

// server/routes/enrollments.routes.ts
import { Router as Router3 } from "express";
var enrollmentsRouter = Router3();
enrollmentsRouter.post("/book", authenticateToken, (req, res) => {
  const userId = req.user.id;
  const { class_id } = req.body;
  if (!class_id) {
    return res.status(400).json({ error: "ID de la clase es obligatorio" });
  }
  const bookTransaction = db.transaction(() => {
    const classItem = db.prepare(`
      SELECT c.*, 
        (SELECT COUNT(*) FROM enrollments WHERE class_id = c.id AND status != 'cancelled') as current_enrolled
      FROM classes c
      WHERE c.id = ?
    `).get(class_id);
    if (!classItem) {
      throw new Error("La clase solicitada no existe.");
    }
    if (classItem.status === "cancelled") {
      throw new Error("Esta clase ha sido cancelada por el profesor.");
    }
    const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    if (classItem.date < today) {
      throw new Error("No puedes inscribirte a una clase de una fecha pasada.");
    }
    const existingEnrollment = db.prepare(`
      SELECT * FROM enrollments WHERE class_id = ? AND user_id = ?
    `).get(class_id, userId);
    if (existingEnrollment) {
      if (existingEnrollment.status === "enrolled" || existingEnrollment.status === "attended") {
        throw new Error("Ya est\xE1s inscrito en esta clase.");
      } else {
        if (classItem.current_enrolled >= classItem.capacity) {
          throw new Error("Lo sentimos, ya no quedan cupos disponibles para esta clase.");
        }
        db.prepare(`
          UPDATE enrollments
          SET status = 'enrolled', updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(existingEnrollment.id);
        return { id: existingEnrollment.id, message: "\xA1Inscripci\xF3n reactivada con \xE9xito!" };
      }
    }
    if (classItem.current_enrolled >= classItem.capacity) {
      throw new Error("Lo sentimos, todos los cupos para esta clase est\xE1n agotados.");
    }
    const insert = db.prepare(`
      INSERT INTO enrollments (class_id, user_id, status, enrolled_at)
      VALUES (?, ?, 'enrolled', CURRENT_TIMESTAMP)
    `);
    const result = insert.run(class_id, userId);
    return { id: Number(result.lastInsertRowid), message: "\xA1Te has inscrito exitosamente a la clase!" };
  });
  try {
    const result = bookTransaction();
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    res.status(400).json({ error: error.message || "Error al procesar la inscripci\xF3n" });
  }
});
enrollmentsRouter.post("/cancel", authenticateToken, (req, res) => {
  try {
    const userId = req.user.id;
    const { class_id } = req.body;
    if (!class_id) {
      return res.status(400).json({ error: "ID de la clase es obligatorio" });
    }
    const enrollment = db.prepare(`
      SELECT * FROM enrollments WHERE class_id = ? AND user_id = ?
    `).get(class_id, userId);
    if (!enrollment || enrollment.status === "cancelled") {
      return res.status(400).json({ error: "No tienes una inscripci\xF3n activa para esta clase." });
    }
    db.prepare(`
      UPDATE enrollments
      SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(enrollment.id);
    res.json({ success: true, message: "Te has desinscrito de la clase correctamente. Tu cupo ha sido liberado." });
  } catch (error) {
    console.error("Error cancelling enrollment:", error);
    res.status(500).json({ error: "Error al cancelar la inscripci\xF3n" });
  }
});
enrollmentsRouter.get("/my-classes", authenticateToken, (req, res) => {
  try {
    const userId = req.user.id;
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
    console.error("Error fetching user enrollments:", error);
    res.status(500).json({ error: "Error al obtener tus clases" });
  }
});
enrollmentsRouter.get("/class/:classId", authenticateToken, requireProfessor, (req, res) => {
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
    console.error("Error fetching class attendees:", error);
    res.status(500).json({ error: "Error al obtener los alumnos inscritos" });
  }
});
enrollmentsRouter.patch("/:id/attendance", authenticateToken, requireProfessor, (req, res) => {
  try {
    const enrollmentId = req.params.id;
    const { status } = req.body;
    if (!["enrolled", "attended", "absent"].includes(status)) {
      return res.status(400).json({ error: "Estado de asistencia no v\xE1lido (debe ser enrolled, attended o absent)" });
    }
    const existing = db.prepare("SELECT * FROM enrollments WHERE id = ?").get(enrollmentId);
    if (!existing) {
      return res.status(404).json({ error: "Registro de inscripci\xF3n no encontrado" });
    }
    db.prepare(`
      UPDATE enrollments
      SET status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(status, enrollmentId);
    res.json({ success: true, message: "Asistencia actualizada correctamente" });
  } catch (error) {
    console.error("Error updating attendance:", error);
    res.status(500).json({ error: "Error al actualizar la asistencia" });
  }
});

// server/routes/reports.routes.ts
import { Router as Router4 } from "express";
var reportsRouter = Router4();
reportsRouter.get("/monthly", authenticateToken, requireProfessor, (req, res) => {
  try {
    const today = /* @__PURE__ */ new Date();
    const month = parseInt(req.query.month) || today.getMonth() + 1;
    const year = parseInt(req.query.year) || today.getFullYear();
    const formattedMonth = String(month).padStart(2, "0");
    const monthPattern = `${year}-${formattedMonth}-%`;
    const totalClasses = db.prepare(`
      SELECT COUNT(*) as count 
      FROM classes 
      WHERE date LIKE ? AND status = 'active'
    `).get(monthPattern);
    const totalEnrollments = db.prepare(`
      SELECT COUNT(*) as count 
      FROM enrollments e
      JOIN classes c ON e.class_id = c.id
      WHERE c.date LIKE ? AND e.status != 'cancelled'
    `).get(monthPattern);
    const totalAttended = db.prepare(`
      SELECT COUNT(*) as count 
      FROM enrollments e
      JOIN classes c ON e.class_id = c.id
      WHERE c.date LIKE ? AND e.status = 'attended'
    `).get(monthPattern);
    const uniqueStudents = db.prepare(`
      SELECT COUNT(DISTINCT e.user_id) as count 
      FROM enrollments e
      JOIN classes c ON e.class_id = c.id
      WHERE c.date LIKE ? AND e.status != 'cancelled'
    `).get(monthPattern);
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
    const detailedStudents = studentsReport.map((student) => {
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
        attendance_rate: totalEnrollments.count > 0 ? Math.round(totalAttended.count / totalEnrollments.count * 100) : 0
      },
      students: detailedStudents,
      categories: classesSummary,
      logs: attendanceLogs
    });
  } catch (error) {
    console.error("Error generating monthly report:", error);
    res.status(500).json({ error: "Error al generar el reporte mensual" });
  }
});
reportsRouter.get("/export-csv", authenticateToken, requireProfessor, (req, res) => {
  try {
    const today = /* @__PURE__ */ new Date();
    const month = parseInt(req.query.month) || today.getMonth() + 1;
    const year = parseInt(req.query.year) || today.getFullYear();
    const formattedMonth = String(month).padStart(2, "0");
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
          WHEN e.status = 'attended' THEN 'Asisti\xF3 (Presente)'
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
    `).all(monthPattern);
    const headers = ["Fecha", "Hora Inicio", "Hora Fin", "Clase", "Disciplina", "Profesor", "Alumno", "Correo", "Telefono", "Estado Asistencia", "Fecha Inscripcion"];
    const rows = logs.map((row) => [
      `"${row.Fecha || ""}"`,
      `"${row.Hora_Inicio || ""}"`,
      `"${row.Hora_Fin || ""}"`,
      `"${row.Clase ? row.Clase.replace(/"/g, '""') : ""}"`,
      `"${row.Disciplina || ""}"`,
      `"${row.Profesor || ""}"`,
      `"${row.Alumno ? row.Alumno.replace(/"/g, '""') : ""}"`,
      `"${row.Correo || ""}"`,
      `"${row.Telefono || ""}"`,
      `"${row.Estado_Asistencia || ""}"`,
      `"${row.Fecha_Inscripcion || ""}"`
    ].join(","));
    const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\r\n");
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="reporte_asistencia_F6_${year}_${formattedMonth}.csv"`);
    res.status(200).send(csvContent);
  } catch (error) {
    console.error("Error exporting CSV:", error);
    res.status(500).json({ error: "Error al exportar el archivo CSV" });
  }
});

// server/routes/users.routes.ts
import { Router as Router5 } from "express";
var usersRouter = Router5();
usersRouter.get("/students", authenticateToken, requireProfessor, (_req, res) => {
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
    console.error("Error fetching students list:", error);
    res.status(500).json({ error: "Error al obtener lista de alumnos" });
  }
});
usersRouter.put("/profile", authenticateToken, (req, res) => {
  try {
    const userId = req.user.id;
    const { name, phone } = req.body;
    if (!name) {
      return res.status(400).json({ error: "El nombre es obligatorio" });
    }
    db.prepare(`
      UPDATE users
      SET name = ?, phone = ?
      WHERE id = ?
    `).run(name.trim(), phone ? phone.trim() : null, userId);
    const updatedUser = db.prepare("SELECT id, name, email, role, phone FROM users WHERE id = ?").get(userId);
    res.json({ user: updatedUser, message: "Perfil actualizado con \xE9xito" });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ error: "Error al actualizar perfil" });
  }
});

// server/index.ts
dotenv.config();
var __filename = fileURLToPath(import.meta.url);
var __dirname = path2.dirname(__filename);
var app = express();
var PORT = Number(process.env.PORT) || 4e3;
var HOST = "0.0.0.0";
app.use(cors());
app.use(express.json());
try {
  initDatabase();
  seedDatabase();
  console.log("\u2705 Base de datos inicializada y verificada correctamente.");
} catch (err) {
  console.error("\u26A0\uFE0F Error al inicializar base de datos:", err);
}
app.use("/api/auth", authRouter);
app.use("/api/classes", classesRouter);
app.use("/api/enrollments", enrollmentsRouter);
app.use("/api/reports", reportsRouter);
app.use("/api/users", usersRouter);
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    name: "F6 Deporte y Recreaci\xF3n API",
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  });
});
var distPath = path2.resolve(process.cwd(), "dist");
if (fs2.existsSync(distPath)) {
  console.log(`\u{1F4C1} Sirviendo archivos est\xE1ticos desde: ${distPath}`);
  app.use(express.static(distPath));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api")) {
      return next();
    }
    res.sendFile(path2.join(distPath, "index.html"));
  });
} else {
  console.log("\u2139\uFE0F Modo desarrollo o dist no generado a\xFAn.");
}
app.listen(PORT, HOST, () => {
  console.log(`\u26A1 Servidor F6 Deporte y Recreaci\xF3n activo en http://${HOST}:${PORT}`);
});
