import dotenv from 'dotenv';
import { app } from './app.js';
import { testConnection } from './config/db.js';

dotenv.config();

const PORT = Number(process.env.PORT) || 4000;

async function bootstrap() {
  console.log('Iniciando servidor Nova Sound MES / SCADA API...');

  // Intentar conectar a PostgreSQL
  await testConnection();

  app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`✓ Servidor Backend corriendo en: http://localhost:${PORT}`);
    console.log(`✓ Endpoint Healthcheck: http://localhost:${PORT}/api/health`);
    console.log(`✓ Conexión lista para Frontend en: ${process.env.CORS_ORIGIN || 'http://localhost:5173'}`);
    console.log(`====================================================`);
  });
}

bootstrap().catch((err) => {
  console.error('Error al arrancar el servidor:', err);
  process.exit(1);
});
