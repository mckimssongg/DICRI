import { useEffect, useState } from 'react';
import { api } from '../utils/http';
import { mapError } from '../utils/errors';

export function ReportesPage() {
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [data, setData] = useState<any>(null);
  const [err, setErr] = useState<string|null>(null);

  async function load() {
    setErr(null); setData(null);
    try {
      const r = await api.get('/reportes/expedientes', { params: { desde: desde || undefined, hasta: hasta || undefined } });
      setData(r.data);
  } catch (e:any) { setErr(mapError(e)); }
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="card" style={{ padding:16 }}>
      <h2 style={{ marginTop:0 }}>Reportes</h2>
      <div className="hstack" style={{ marginBottom:12 }}>
        <input className="input" placeholder="Desde (YYYY-MM-DD)" value={desde} onChange={e=>setDesde(e.target.value)} />
        <input className="input" placeholder="Hasta (YYYY-MM-DD)" value={hasta} onChange={e=>setHasta(e.target.value)} />
        <button className="btn" onClick={load}>Aplicar</button>
      </div>
      {err && <div style={{ color:'crimson' }}>{err}</div>}
      {!data ? <div>Cargando…</div> : (
        <pre className="card" style={{ padding:12 }}>
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  );
}
