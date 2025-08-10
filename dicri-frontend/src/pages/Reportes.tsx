import { useEffect, useState } from 'react';
import { api } from '../utils/http';

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
    } catch (e:any) { setErr(e?.response?.data?.error || 'Error'); }
  }

  useEffect(() => { load(); }, []);

  return (
    <div>
      <h2>Reportes</h2>
      <div style={{ display:'flex', gap:8, marginBottom:12 }}>
        <input placeholder="Desde (YYYY-MM-DD)" value={desde} onChange={e=>setDesde(e.target.value)} />
        <input placeholder="Hasta (YYYY-MM-DD)" value={hasta} onChange={e=>setHasta(e.target.value)} />
        <button onClick={load}>Aplicar</button>
      </div>
      {err && <div style={{ color:'crimson' }}>{err}</div>}
      {!data ? <div>Cargando…</div> : (
        <pre style={{ background:'#f7f7f7', padding:12, borderRadius:6 }}>
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  );
}
