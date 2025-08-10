import { useEffect, useState } from 'react';
import { api } from '../utils/http';
import { useAuth } from '../store/auth';
import { mapError } from '../utils/errors';

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
        setErr(mapError(e));
      }
    }
    load();
    return () => { mounted = false };
  }, [hasPerm]);

  return (
    <div className="card" style={{ padding:16 }}>
      <h2 style={{ marginTop:0 }}>Dashboard</h2>
      {hasPerm('reportes.read') ? (
        <div>
          <h3>Resumen de expedientes</h3>
          {err && <div style={{ color:'crimson' }}>{err}</div>}
          {!data ? <div>Cargando…</div> : (
            <pre className="card" style={{ padding:12 }}>
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
