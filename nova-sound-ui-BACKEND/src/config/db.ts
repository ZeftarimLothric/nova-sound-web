import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// Soporta tanto DATABASE_URL (estilo Neon / Supabase) como variables individuales
const isRemoteHost = (process.env.DB_HOST && process.env.DB_HOST !== 'localhost') || Boolean(process.env.DATABASE_URL);

const defaultPool = new Pool(
  process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
      }
    : {
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT) || 5432,
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        database: process.env.DB_NAME || 'nova_sound',
        ssl: isRemoteHost ? { rejectUnauthorized: false } : undefined,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
      }
);

defaultPool.on('error', (err) => {
  console.error('Error inesperado en el pool de PostgreSQL:', err);
});

let activePool: any = defaultPool;

export function setDbPool(customPool: any) {
  activePool = customPool;
}

export const pool = {
  query: (text: string, params?: any[]): Promise<{ rows: any[]; rowCount: number | null }> =>
    activePool.query(text, params),
  connect: (): Promise<any> => activePool.connect(),
  on: (event: string, listener: (...args: any[]) => void) => activePool.on?.(event, listener),
};

export async function testConnection(): Promise<boolean> {
  try {
    const client = await pool.connect();
    const res = await client.query('SELECT NOW()');
    client.release();
    console.log('✓ Conexión exitosa a PostgreSQL:', res.rows[0].now);
    return true;
  } catch (err) {
    console.warn('⚠ No se pudo conectar a PostgreSQL en este momento:', (err as Error).message);
    return false;
  }
}
