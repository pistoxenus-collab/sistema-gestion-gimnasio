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
const PORT = process.env.PORT || 4000;

// Middlewares
app.use(cors());
app.use(express.json());

// Initialize database and seed with initial data
initDatabase();
seedDatabase();

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/classes', classesRouter);
app.use('/api/enrollments', enrollmentsRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/users', usersRouter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', name: 'F6 Deporte y Recreación API', timestamp: new Date().toISOString() });
});

// Serve frontend in production
const distPath = path.resolve(__dirname, '../dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// Start server
app.listen(PORT, () => {
  console.log(`⚡ Servidor F6 Deporte y Recreación corriendo en el puerto ${PORT}`);
});
