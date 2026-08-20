import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const dataDir = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'gym.db');

interface DbInterface {
  pragma: (sql: string) => void;
  exec: (sql: string) => void;
  prepare: (sql: string) => {
    all: (...params: any[]) => any[];
    get: (...params: any[]) => any;
    run: (...params: any[]) => { lastInsertRowid: number | bigint; changes: number };
  };
  transaction: <T>(fn: () => T) => () => T;
}

let dbInstance: DbInterface;

try {
  const Database = (await import('better-sqlite3')).default;
  const nativeDb = new Database(dbPath);
  nativeDb.pragma('journal_mode = WAL');
  nativeDb.pragma('foreign_keys = ON');

  dbInstance = {
    pragma: (sql: string) => nativeDb.pragma(sql),
    exec: (sql: string) => nativeDb.exec(sql),
    prepare: (sql: string) => nativeDb.prepare(sql),
    transaction: (fn: any) => nativeDb.transaction(fn),
  };
  console.log('✅ SQLite nativo (better-sqlite3) cargado exitosamente.');
} catch (err: any) {
  console.warn('⚠️ better-sqlite3 no disponible o fallo de compilación nativa en este entorno:', err.message);
  console.log('🔄 Iniciando motor de base de datos persistente JSON/Memory para asegurar disponibilidad 100%...');

  // Fallback JSON-backed storage engine
  const jsonPath = path.join(dataDir, 'gym_store.json');
  let store: {
    users: any[];
    classes: any[];
    enrollments: any[];
  } = { users: [], classes: [], enrollments: [] };

  if (fs.existsSync(jsonPath)) {
    try {
      store = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    } catch (_) {}
  }

  const saveStore = () => {
    try {
      fs.writeFileSync(jsonPath, JSON.stringify(store, null, 2), 'utf8');
    } catch (_) {}
  };

  dbInstance = {
    pragma: () => {},
    exec: () => {},
    transaction: (fn: any) => () => fn(),
    prepare: (sql: string) => {
      const cleanSql = sql.trim().replace(/\s+/g, ' ');

      return {
        all: (...params: any[]) => {
          // Classes list
          if (cleanSql.includes('FROM classes c')) {
            const currentUserId = params[0] || 0;
            const dateParam = params[1];
            
            let list = store.classes.filter(c => c.status !== 'deleted');
            if (dateParam && cleanSql.includes('c.date = ?')) {
              list = list.filter(c => c.date === dateParam);
            }
            if (cleanSql.includes('c.date LIKE ?')) {
              const prefix = params[1]?.replace('%', '') || '';
              list = list.filter(c => c.date.startsWith(prefix));
            }

            return list.map(c => {
              const activeEnrollments = store.enrollments.filter(e => e.class_id === c.id && e.status !== 'cancelled');
              const userEnrollment = store.enrollments.find(e => e.class_id === c.id && e.user_id === currentUserId);
              return {
                ...c,
                enrolled_count: activeEnrollments.length,
                available_spots: Math.max(0, c.capacity - activeEnrollments.length),
                user_enrollment_status: userEnrollment ? userEnrollment.status : null,
              };
            });
          }

          // Students list
          if (cleanSql.includes('FROM users u') && cleanSql.includes('role = \'student\'')) {
            return store.users.filter(u => u.role === 'student').map(u => {
              const userEnrollments = store.enrollments.filter(e => e.user_id === u.id && e.status !== 'cancelled');
              const attended = userEnrollments.filter(e => e.status === 'attended').length;
              return {
                id: u.id,
                name: u.name,
                email: u.email,
                phone: u.phone,
                created_at: u.created_at || new Date().toISOString(),
                total_attended: attended,
                active_bookings: userEnrollments.filter(e => e.status === 'enrolled').length,
                total_absent: userEnrollments.filter(e => e.status === 'absent').length,
              };
            });
          }

          // Demo users
          if (cleanSql.includes('SELECT id, name, email, role, phone FROM users')) {
            return store.users.map(u => ({ id: u.id, name: u.name, email: u.email, role: u.role, phone: u.phone }));
          }

          // Class attendees
          if (cleanSql.includes('FROM enrollments e') && cleanSql.includes('WHERE e.class_id = ?')) {
            const classId = Number(params[0]);
            return store.enrollments
              .filter(e => e.class_id === classId && e.status !== 'cancelled')
              .map(e => {
                const user = store.users.find(u => u.id === e.user_id) || {};
                return {
                  enrollment_id: e.id,
                  enrollment_status: e.status,
                  enrolled_at: e.enrolled_at,
                  user_id: e.user_id,
                  user_name: user.name || 'Alumno',
                  user_email: user.email || '',
                  user_phone: user.phone || '',
                };
              });
          }

          // User my-classes
          if (cleanSql.includes('FROM enrollments e JOIN classes c') && cleanSql.includes('WHERE e.user_id = ?')) {
            const userId = Number(params[0]);
            return store.enrollments
              .filter(e => e.user_id === userId && e.status !== 'cancelled')
              .map(e => {
                const cls = store.classes.find(c => c.id === e.class_id) || {};
                const enrolledCount = store.enrollments.filter(x => x.class_id === e.class_id && x.status !== 'cancelled').length;
                return {
                  enrollment_id: e.id,
                  enrollment_status: e.status,
                  enrolled_at: e.enrolled_at,
                  class_id: cls.id,
                  title: cls.title,
                  category: cls.category,
                  description: cls.description,
                  instructor_name: cls.instructor_name,
                  date: cls.date,
                  start_time: cls.start_time,
                  end_time: cls.end_time,
                  location: cls.location,
                  capacity: cls.capacity,
                  enrolled_count: enrolledCount,
                };
              })
              .sort((a, b) => (b.date > a.date ? 1 : -1));
          }

          // Reports monthly logs
          if (cleanSql.includes('FROM enrollments e') && cleanSql.includes('WHERE c.date LIKE ?')) {
            const prefix = params[0]?.replace('%', '') || '';
            return store.enrollments
              .filter(e => e.status !== 'cancelled')
              .map(e => {
                const cls = store.classes.find(c => c.id === e.class_id);
                const usr = store.users.find(u => u.id === e.user_id);
                if (!cls || !cls.date.startsWith(prefix)) return null;
                return {
                  enrollment_id: e.id,
                  student_name: usr?.name || '',
                  student_email: usr?.email || '',
                  student_phone: usr?.phone || '',
                  class_title: cls.title,
                  class_category: cls.category,
                  class_date: cls.date,
                  start_time: cls.start_time,
                  end_time: cls.end_time,
                  instructor_name: cls.instructor_name,
                  status: e.status,
                  enrolled_at: e.enrolled_at,
                  Fecha: cls.date,
                  Hora_Inicio: cls.start_time,
                  Hora_Fin: cls.end_time,
                  Clase: cls.title,
                  Disciplina: cls.category,
                  Profesor: cls.instructor_name,
                  Alumno: usr?.name || '',
                  Correo: usr?.email || '',
                  Telefono: usr?.phone || '',
                  Estado_Asistencia: e.status === 'attended' ? 'Asistió (Presente)' : e.status === 'absent' ? 'Ausente' : 'Inscrito',
                  Fecha_Inscripcion: e.enrolled_at,
                };
              })
              .filter(Boolean);
          }

          return [];
        },

        get: (...params: any[]) => {
          // Count users
          if (cleanSql.includes('SELECT COUNT(*) as count FROM users')) {
            return { count: store.users.length };
          }
          // User by email
          if (cleanSql.includes('SELECT * FROM users WHERE email = ?') || cleanSql.includes('SELECT id FROM users WHERE email = ?')) {
            const email = params[0]?.toLowerCase();
            return store.users.find(u => u.email?.toLowerCase() === email);
          }
          // User by id
          if (cleanSql.includes('WHERE id = ?') && (cleanSql.includes('FROM users') || cleanSql.includes('SELECT id, name'))) {
            const id = Number(params[0]);
            return store.users.find(u => u.id === id);
          }
          // Class by id
          if (cleanSql.includes('FROM classes') && cleanSql.includes('WHERE id = ?')) {
            const id = Number(params[0]);
            return store.classes.find(c => c.id === id);
          }
          if (cleanSql.includes('FROM classes c') && cleanSql.includes('WHERE c.id = ?')) {
            const currentUserId = params[0] || 0;
            const classId = Number(params[1]);
            const cls = store.classes.find(c => c.id === classId);
            if (!cls) return null;
            const activeEnrollments = store.enrollments.filter(e => e.class_id === classId && e.status !== 'cancelled');
            const userEnrollment = store.enrollments.find(e => e.class_id === classId && e.user_id === currentUserId);
            return {
              ...cls,
              enrolled_count: activeEnrollments.length,
              available_spots: Math.max(0, cls.capacity - activeEnrollments.length),
              user_enrollment_status: userEnrollment ? userEnrollment.status : null,
            };
          }
          // Enrollment by class_id and user_id
          if (cleanSql.includes('FROM enrollments WHERE class_id = ? AND user_id = ?')) {
            const classId = Number(params[0]);
            const userId = Number(params[1]);
            return store.enrollments.find(e => e.class_id === classId && e.user_id === userId);
          }
          // Enrollment by id
          if (cleanSql.includes('FROM enrollments WHERE id = ?')) {
            const id = Number(params[0]);
            return store.enrollments.find(e => e.id === id);
          }
          // Metrics counts
          if (cleanSql.includes('SELECT COUNT(*) as count FROM classes WHERE date LIKE ?')) {
            const prefix = params[0]?.replace('%', '') || '';
            return { count: store.classes.filter(c => c.date.startsWith(prefix) && c.status === 'active').length };
          }
          if (cleanSql.includes('SELECT COUNT(*) as count FROM enrollments e JOIN classes c WHERE c.date LIKE ? AND e.status != \'cancelled\'')) {
            const prefix = params[0]?.replace('%', '') || '';
            const count = store.enrollments.filter(e => {
              const cls = store.classes.find(c => c.id === e.class_id);
              return cls && cls.date.startsWith(prefix) && e.status !== 'cancelled';
            }).length;
            return { count };
          }
          if (cleanSql.includes('SELECT COUNT(*) as count FROM enrollments e JOIN classes c WHERE c.date LIKE ? AND e.status = \'attended\'')) {
            const prefix = params[0]?.replace('%', '') || '';
            const count = store.enrollments.filter(e => {
              const cls = store.classes.find(c => c.id === e.class_id);
              return cls && cls.date.startsWith(prefix) && e.status === 'attended';
            }).length;
            return { count };
          }
          if (cleanSql.includes('SELECT COUNT(DISTINCT e.user_id) as count FROM enrollments e JOIN classes c WHERE c.date LIKE ?')) {
            const prefix = params[0]?.replace('%', '') || '';
            const userIds = new Set(
              store.enrollments
                .filter(e => {
                  const cls = store.classes.find(c => c.id === e.class_id);
                  return cls && cls.date.startsWith(prefix) && e.status !== 'cancelled';
                })
                .map(e => e.user_id)
            );
            return { count: userIds.size };
          }
          return null;
        },

        run: (...params: any[]) => {
          // Insert user
          if (cleanSql.includes('INSERT INTO users')) {
            const id = store.users.length ? Math.max(...store.users.map(u => u.id)) + 1 : 1;
            const newUser = {
              id,
              name: params[0],
              email: params[1],
              password_hash: params[2],
              role: params[3],
              phone: params[4],
              created_at: new Date().toISOString(),
            };
            store.users.push(newUser);
            saveStore();
            return { lastInsertRowid: id, changes: 1 };
          }

          // Insert class
          if (cleanSql.includes('INSERT INTO classes')) {
            const id = store.classes.length ? Math.max(...store.classes.map(c => c.id)) + 1 : 1;
            const newClass = {
              id,
              title: params[0],
              category: params[1],
              description: params[2],
              instructor_id: params[3],
              instructor_name: params[4],
              date: params[5],
              start_time: params[6],
              end_time: params[7],
              capacity: Number(params[8]),
              location: params[9],
              status: params[10] || 'active',
              created_at: new Date().toISOString(),
            };
            store.classes.push(newClass);
            saveStore();
            return { lastInsertRowid: id, changes: 1 };
          }

          // Insert enrollment
          if (cleanSql.includes('INSERT INTO enrollments')) {
            const id = store.enrollments.length ? Math.max(...store.enrollments.map(e => e.id)) + 1 : 1;
            const newEnrollment = {
              id,
              class_id: Number(params[0]),
              user_id: Number(params[1]),
              status: params[2] || 'enrolled',
              enrolled_at: params[3] || new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };
            store.enrollments.push(newEnrollment);
            saveStore();
            return { lastInsertRowid: id, changes: 1 };
          }

          // Update enrollment status
          if (cleanSql.includes('UPDATE enrollments SET status = ?') && cleanSql.includes('WHERE id = ?')) {
            const status = params[0];
            const id = Number(params[1]);
            const enr = store.enrollments.find(e => e.id === id);
            if (enr) {
              enr.status = status;
              enr.updated_at = new Date().toISOString();
              saveStore();
            }
            return { lastInsertRowid: 0, changes: 1 };
          }

          // Cancel enrollment
          if (cleanSql.includes('UPDATE enrollments SET status = \'cancelled\'') && cleanSql.includes('WHERE id = ?')) {
            const id = Number(params[0]);
            const enr = store.enrollments.find(e => e.id === id);
            if (enr) {
              enr.status = 'cancelled';
              enr.updated_at = new Date().toISOString();
              saveStore();
            }
            return { lastInsertRowid: 0, changes: 1 };
          }

          // Update user profile
          if (cleanSql.includes('UPDATE users SET name = ?')) {
            const name = params[0];
            const phone = params[1];
            const userId = Number(params[2]);
            const user = store.users.find(u => u.id === userId);
            if (user) {
              user.name = name;
              user.phone = phone;
              saveStore();
            }
            return { lastInsertRowid: 0, changes: 1 };
          }

          // Delete class
          if (cleanSql.includes('DELETE FROM classes WHERE id = ?')) {
            const id = Number(params[0]);
            store.classes = store.classes.filter(c => c.id !== id);
            saveStore();
            return { lastInsertRowid: 0, changes: 1 };
          }

          return { lastInsertRowid: 0, changes: 0 };
        },
      };
    },
  };
}

export const db = dbInstance;

export function initDatabase() {
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
  `);
}
