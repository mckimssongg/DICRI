import NodeClam from 'clamscan';

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
    const { isInfected, viruses } = await s.scanBuffer(buf);
    return isInfected ? { status: 'INFECTED', details: (viruses||[]).join(',') } : { status: 'CLEAN' };
  } catch (e) {
    return { status: 'ERROR', details: (e as Error).message };
  }
}
