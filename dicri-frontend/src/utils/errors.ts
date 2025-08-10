export function mapError(err: any): string {
  const msg = err?.response?.data?.error || err?.message || String(err);
  if (!msg) return 'Error inesperado';
  const m = msg.toLowerCase();
  if (m.includes('not found') || m.includes('no existe')) return 'No encontrado';
  if (m.includes('unauthorized') || m.includes('forbidden') || m.includes('perm')) return 'No autorizado';
  if (m.includes('duplicate') || m.includes('ya existe') || m.includes('unique')) return 'Ya existe un registro con esos datos';
  if (m.includes('validation') || m.includes('inválid') || m.includes('invalid')) return 'Datos inválidos';
  if (m.includes('password')) return 'Contraseña inválida';
  return capitalize(msg);
}

export function capitalize(s: string): string {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}
