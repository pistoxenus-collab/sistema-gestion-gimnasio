import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDatabase } from './db';
import { seedDatabase } from './seed';
import { authRouter } from './routes/auth.routes';
import { classesRouter } from './routes/classes.routes';
import { enrollmentsRouter } from './routes/enrollments.routes';
import { reportsRouter } from './routes/reports.routes';
import { usersRouter } from './routes/users.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Middlewares
app.use(cors());
app.use(express.json());

// Initialize database and seed with rich test data
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

// Start server
app.listen(PORT, () => {
  console.log(`⚡ Servidor F6 Deporte y Recreación corriendo en http://localhost:${PORT}`);
});
