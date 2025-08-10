import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../../utils/http';
import { Pagination } from '../../routes/Pagination';
import { useAuth } from '../../store/auth';
import { mapError } from '../../utils/errors';

export function ExpedientesListPage() {
  const hasPerm = useAuth(s=>s.hasPerm);
  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string|null>(null);
  const [sp, setSp] = useSearchParams();
  const page = Number(sp.get('page') || '1');
  const pageSize = Number(sp.get('pageSize') || '20');
  const folio = sp.get('folio') || '';
  const sede = sp.get('sede_codigo') || '';
  const desde = sp.get('desde') || '';
  const hasta = sp.get('hasta') || '';

  useEffect(() => {
    async function load() {
      setLoading(true); setError(null);
      try {
        const r = await api.get('/expedientes', { params: { folio: folio || undefined, sede_codigo: sede || undefined, desde: desde || undefined, hasta: hasta || undefined, page, pageSize } });
        setItems(r.data.items || []);
        setTotal(r.data.total || 0);
  } catch (e:any) { setError(mapError(e)); }
      finally { setLoading(false); }
    }
    load();
  }, [folio, sede, desde, hasta, page, pageSize]);

  function onPage(p:number) { sp.set('page', String(p)); setSp(sp); }

  return (
    <div className="card" style={{ padding:16 }}>
      <div className="hstack" style={{ justifyContent:'space-between' }}>
  <h2 className="card-title" style={{ margin:0 }}>Expedientes</h2>
        {hasPerm('expediente.create') && <Link className="btn primary" to="/expedientes/create">Nuevo</Link>}
      </div>
      <div className="hstack" style={{ margin:'12px 0', alignItems:'end' }}>
        <div className="field" style={{ minWidth:160 }}>
          <span className="label">Folio</span>
          <input className="input" defaultValue={folio} onKeyDown={e=>{ if(e.key==='Enter'){ sp.set('folio', (e.target as HTMLInputElement).value); sp.set('page','1'); setSp(sp);} }} />
        </div>
        <div className="field" style={{ minWidth:160 }}>
          <span className="label">Sede</span>
          <input className="input" defaultValue={sede} onKeyDown={e=>{ if(e.key==='Enter'){ sp.set('sede_codigo', (e.target as HTMLInputElement).value); sp.set('page','1'); setSp(sp);} }} />
        </div>
        <div className="field" style={{ minWidth:180 }}>
          <span className="label">Desde</span>
          <input className="input" type="date" defaultValue={desde} onKeyDown={e=>{ if(e.key==='Enter'){ sp.set('desde', (e.target as HTMLInputElement).value); sp.set('page','1'); setSp(sp);} }} />
        </div>
        <div className="field" style={{ minWidth:180 }}>
          <span className="label">Hasta</span>
          <input className="input" type="date" defaultValue={hasta} onKeyDown={e=>{ if(e.key==='Enter'){ sp.set('hasta', (e.target as HTMLInputElement).value); sp.set('page','1'); setSp(sp);} }} />
        </div>
      </div>

      {loading ? <div>Cargando…</div> : error ? <div style={{ color:'crimson' }}>{error}</div> : (
        <table className="table">
          <thead><tr><th>ID</th><th>Folio</th><th>Título</th><th>Estado</th></tr></thead>
          <tbody>
            {items.map(e => (
              <tr key={e.expediente_id || e.id}>
                <td>{e.expediente_id || e.id}</td>
                <td>{e.folio}</td>
                <td><Link to={`/expedientes/${e.expediente_id || e.id}`}>{e.titulo}</Link></td>
                <td>{e.estado}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

  <div style={{ marginTop:12 }}>
        <Pagination page={page} pageSize={pageSize} total={total} onPage={onPage} />
      </div>
    </div>
  );
}
