import express from 'express';
import cors from 'cors';
import { apiRouter } from './routes/index.js';

export const app = express();

// Middlewares globales
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logger básico para auditoría
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Enrutador principal de la API
app.use('/api', apiRouter);

// Manejador de rutas no encontradas (404)
app.use((_req, res) => {
  res.status(404).json({ error: 'Recurso no encontrado en el servidor Nova Sound.' });
});
