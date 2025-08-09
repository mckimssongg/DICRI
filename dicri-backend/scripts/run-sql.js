// scripts/run-sql.js: runs all .sql files in a folder against SQL Server using 'mssql'
import fs from 'fs';
import path from 'path';
import sql from 'mssql';
import 'dotenv/config';

const folder = process.argv[2];
if (!folder) {
  console.error('Usage: node scripts/run-sql.js <folder>');
  process.exit(1);
}
const dir = path.resolve(process.cwd(), folder);
const files = fs.readdirSync(dir).filter(f => f.endsWith('.sql')).sort();

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '1433', 10),
  database: process.env.DB_NAME,
  options: { encrypt: false, trustServerCertificate: true }
};

// Split by GO batches
function splitBatches(sqlText) {
  const lines = sqlText.split(/\r?\n/);
  const batches = [];
  let current = [];
  for (const line of lines) {
    if (line.trim().toUpperCase() === 'GO') {
      batches.push(current.join('\n'));
      current = [];
    } else {
      current.push(line);
    }
  }
  if (current.length) batches.push(current.join('\n'));
  return batches;
}

(async () => {
  console.log('Connecting to SQL Server...');
  const pool = await sql.connect(config);
  try {
    for (const file of files) {
      const full = path.join(dir, file);
      const content = fs.readFileSync(full, 'utf-8');
      const batches = splitBatches(content);
      console.log('Executing', file, 'in', batches.length, 'batches');
      for (const b of batches) {
        if (b.trim()) {
          await pool.request().batch(b);
        }
      }
    }
    console.log('Done.');
  } finally {
    pool.close();
  }
})().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
