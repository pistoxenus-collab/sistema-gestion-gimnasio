import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { initDatabase } from './db';
import { seedDatabase } from './seed';
import { authRouter } from './routes/auth.routes';
import { classesRouter } from './routes/classes.routes';
import { enrollmentsRouter } from './routes/enrollments.routes';
import { reportsRouter } from './routes/reports.routes';
import { usersRouter } from './routes/users.routes';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 4000;
const HOST = '0.0.0.0';

// Middlewares
app.use(cors());
app.use(express.json());

// Initialize database and seed with initial data
try {
  initDatabase();
  seedDatabase();
  console.log('✅ Base de datos inicializada y verificada correctamente.');
} catch (err) {
  console.error('⚠️ Error al inicializar base de datos:', err);
}

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/classes', classesRouter);
app.use('/api/enrollments', enrollmentsRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/users', usersRouter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ 
    status: 'ok', 
    name: 'F6 Deporte y Recreación API', 
    timestamp: new Date().toISOString() 
  });
});

// Serve frontend in production (Express 5 compatible SPA fallback)
const distPath = path.resolve(process.cwd(), 'dist');
if (fs.existsSync(distPath)) {
  console.log(`📁 Sirviendo archivos estáticos desde: ${distPath}`);
  app.use(express.static(distPath));
  app.use((req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(distPath, 'index.html'));
  });
} else {
  console.log('ℹ️ Modo desarrollo o dist no generado aún.');
}

// Start server
app.listen(PORT, HOST, () => {
  console.log(`⚡ Servidor F6 Deporte y Recreación activo en http://${HOST}:${PORT}`);
});
