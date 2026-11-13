import fs from 'node:fs';
import path from 'node:path';
import { PGlite } from '@electric-sql/pglite';
import { setDbPool } from './db.js';

export async function initPgliteFallback(): Promise<void> {
  const dataDir = path.resolve(process.cwd(), '.pglite_data');
  let pg: PGlite;
  try {
    pg = new PGlite(dataDir);
    await pg.query('SELECT 1');
  } catch {
    console.warn('⚠ .pglite_data estaba bloqueada o dañada; recreando almacenamiento local limpio...');
    fs.rmSync(dataDir, { recursive: true, force: true });
    pg = new PGlite(dataDir);
    await pg.query('SELECT 1');
  }

  const pglitePoolAdapter = {
    query: async (text: string, params?: any[]) => {
      const res = await pg.query(text, params);
      return { rows: res.rows as any[], rowCount: res.rows.length };
    },
    connect: async () => ({
      query: async (text: string, params?: any[]) => {
        const trimmed = text.trim().toUpperCase();
        if (trimmed === 'BEGIN' || trimmed === 'COMMIT' || trimmed === 'ROLLBACK') {
          await pg.exec(trimmed);
          return { rows: [], rowCount: 0 };
        }
        const res = await pg.query(text, params);
        return { rows: res.rows as any[], rowCount: res.rows.length };
      },
      release: () => {},
    }),
    on: () => {},
  };

  setDbPool(pglitePoolAdapter);

  // Verificar si ya existen tablas en el almacenamiento persistente local
  const check = await pg.query(
    "SELECT COUNT(*)::int AS total FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'usuarios';"
  );
  const yaInicializada = Number((check.rows[0] as any)?.total || 0) > 0;

  if (!yaInicializada) {
    const dbDir = path.resolve(process.cwd(), '../database');
    const schemaSql = fs.readFileSync(path.join(dbDir, 'schema_completo_actualizado.sql'), 'utf8');
    const catalogosSql = fs.readFileSync(path.join(dbDir, 'INSERTS_CATALOGOS_OFICIALES.sql'), 'utf8');
    await pg.exec(schemaSql);
    await pg.exec(catalogosSql);

    // Asegurar 3er turno (Noche) y un pedido base inicial para pruebas operativas
    await pg.exec(`
      INSERT INTO turnos (id, nombre_turno, hora_inicio, hora_fin)
      VALUES (3, 'Noche', '22:00', '06:00')
      ON CONFLICT (id) DO NOTHING;

      SELECT setval('turnos_id_seq', (SELECT COALESCE(MAX(id), 3) FROM turnos));

      INSERT INTO pedido (id, folio, id_cliente, fecha_pedido, fecha_compromiso, estado)
      VALUES (1, 'PED-2026-001', 1, CURRENT_DATE, CURRENT_DATE + 7, 'En Producción')
      ON CONFLICT (id) DO NOTHING;
    `);
    console.log('✓ Base de datos PostgreSQL embebida (PGlite) inicializada con esquema y catálogos oficiales.');
  } else {
    // Asegurar 3er turno en bases ya inicializadas
    await pg.exec(`
      INSERT INTO turnos (id, nombre_turno, hora_inicio, hora_fin)
      VALUES (3, 'Noche', '22:00', '06:00')
      ON CONFLICT (id) DO NOTHING;
    `);
    console.log('✓ Conectado a PostgreSQL embebido local (PGlite) en .pglite_data.');
  }
}

