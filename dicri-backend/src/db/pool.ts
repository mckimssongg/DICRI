import sql from 'mssql';

let pool: sql.ConnectionPool | null = null;

export async function createPool() {
  const config: sql.config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '1433', 10),
    database: process.env.DB_NAME || 'dicri',
    options: { encrypt: false, trustServerCertificate: true }
  };
  pool = await sql.connect(config);
  return pool;
}

export function getPool() {
  if (!pool) throw new Error('DB pool not initialized');
  return pool;
}
