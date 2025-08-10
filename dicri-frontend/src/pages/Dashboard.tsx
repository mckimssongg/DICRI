import { useEffect, useState } from 'react';
import { api } from '../utils/http';
import { useAuth } from '../store/auth';

export function DashboardPage() {
  const hasPerm = useAuth(s=>s.hasPerm);
  const [data, setData] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!hasPerm('reportes.read')) return;
      try {
        const r = await api.get('/reportes/expedientes');
        if (mounted) setData(r.data);
      } catch (e:any) {
        setErr(e?.response?.data?.error || 'Error');
      }
    }
    load();
    return () => { mounted = false };
  }, [hasPerm]);

  return (
    <div>
      <h2>Dashboard</h2>
      {hasPerm('reportes.read') ? (
        <div>
          <h3>Resumen de expedientes</h3>
          {err && <div style={{ color:'crimson' }}>{err}</div>}
          {!data ? <div>Cargando…</div> : (
            <pre style={{ background:'#f7f7f7', padding:12, borderRadius:6 }}>
              {JSON.stringify(data, null, 2)}
            </pre>
          )}
        </div>
      ) : (
        <p>No tienes permiso para ver reportes.</p>
      )}
    </div>
  );
}
