import fs from 'fs';
import path from 'path';

const openapi = {
  openapi: '3.0.3',
  info: { title: 'DICRI API', version: '0.1.0' },
  servers: [{ url: '/api/v1' }],
  paths: {
    '/health': {
      get: {
        summary: 'Health check',
        responses: { '200': { description: 'ok' } }
      }
    }
  }
};
const out = path.resolve('docs', 'openapi.json');
fs.writeFileSync(out, JSON.stringify(openapi, null, 2));
console.log('Wrote', out);
