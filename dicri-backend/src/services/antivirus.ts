import NodeClam from 'clamscan';
import { promises as fs } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { randomUUID } from 'crypto';

let scanner: any | null = null;

async function getScanner() {
  if (scanner) return scanner;
  const disabled = (process.env.CLAMAV_DISABLED || 'false') === 'true';
  if (disabled) return null;

  const clamdHost = process.env.CLAMAV_HOST || 'clamav';
  const clamdPort = Number(process.env.CLAMAV_PORT || 3310);
  const timeout = Number(process.env.CLAMAV_TIMEOUT_MS || 20000);

  const clamscan = await new (NodeClam as any)().init({
    removeInfected: false,
    quarantineInfected: false,
    clamdscan: {
      host: clamdHost,
      port: clamdPort,
      timeout,
      socket: false
    }
  });
  scanner = clamscan;
  return scanner;
}

export async function scanBuffer(buf: Buffer): Promise<{ status: 'CLEAN'|'INFECTED'|'ERROR', details?: string }> {
  try {
    const s = await getScanner();
    if (!s) return { status: 'CLEAN', details: 'scanner disabled' };
    // Algunas versiones exponen scanBuffer en s o en s.clamdscan
    const scanBuf = typeof s.scanBuffer === 'function' ? s.scanBuffer.bind(s)
      : (s.clamdscan && typeof s.clamdscan.scanBuffer === 'function' ? s.clamdscan.scanBuffer.bind(s.clamdscan) : null);
    if (scanBuf) {
      const res: any = await scanBuf(buf);
      const infected = !!(res?.isInfected || res?.is_infected);
      const viruses = res?.viruses || res?.virus || [];
      return infected ? { status: 'INFECTED', details: (Array.isArray(viruses)?viruses:[viruses]).join(',') } : { status: 'CLEAN' };
    }

    // Fallback: escribir a archivo temporal y usar scanFile
    const tmpPath = join(tmpdir(), `dicri-av-${randomUUID()}`);
    await fs.writeFile(tmpPath, buf);
    try {
      const scanFile = typeof s.scanFile === 'function' ? s.scanFile.bind(s)
        : (s.clamdscan && typeof s.clamdscan.scanFile === 'function' ? s.clamdscan.scanFile.bind(s.clamdscan) : null);
      if (!scanFile) throw new Error('scanBuffer/scanFile not available');
      const res: any = await scanFile(tmpPath);
      const infected = !!(res?.isInfected || res?.is_infected || res === true);
      const viruses = res?.viruses || res?.virus || [];
      return infected ? { status: 'INFECTED', details: (Array.isArray(viruses)?viruses:[viruses]).join(',') } : { status: 'CLEAN' };
    } finally {
      try { await fs.unlink(tmpPath); } catch { /* noop */ }
    }
  } catch (e) {
    return { status: 'ERROR', details: (e as Error).message };
  }
}
