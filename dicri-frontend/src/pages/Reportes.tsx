import { useEffect, useMemo, useState } from 'react';
import { api } from '../utils/http';
import { mapError } from '../utils/errors';
import { useToast } from '../routes/MainLayout';

export function ReportesPage() {
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [data, setData] = useState<any>(null);
  const [err, setErr] = useState<string|null>(null);
  const toast = useToast();

  async function load() {
    setErr(null); setData(null);
    try {
      const r = await api.get('/reportes/expedientes', { params: { desde: desde || undefined, hasta: hasta || undefined } });
      setData(r.data);
      toast.push({ kind:'success', msg:'Reporte actualizado' });
    } catch (e:any) { setErr(mapError(e)); }
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="card" style={{ padding:16 }}>
      <h2 style={{ marginTop:0 }}>Reportes</h2>
    <div className="hstack" style={{ marginBottom:12, alignItems:'end', justifyContent:'center' }}>
      <div className="field" style={{ minWidth:200 }}>
        <span className="label">Desde</span>
        <input className="input" type="date" value={desde} onChange={e=>setDesde(e.target.value)} />
      </div>
      <div className="field" style={{ minWidth:200 }}>
        <span className="label">Hasta</span>
        <input className="input" type="date" value={hasta} onChange={e=>setHasta(e.target.value)} />
      </div>
      <button className="btn" onClick={load}>Aplicar</button>
      </div>
      {err && <div style={{ color:'crimson' }}>{err}</div>}
      {!data ? <div>Cargando…</div> : (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
          <div className="card" style={{ padding:12 }}>
            <h3 className="card-title">Totales por estado</h3>
            <Bars data={(data.byEstado||[]).map((x:any)=>({ label:x.estado, value:x.total }))} />
          </div>
          <div className="card" style={{ padding:12 }}>
            <h3 className="card-title">Por sede (APROBADO/BORRADOR/EN_REVISION)</h3>
            <PorSedeTable items={data.porSede||[]} />
          </div>
          <div className="card" style={{ padding:12, gridColumn:'1 / span 2' }}>
            <h3 className="card-title">Detalle crudo</h3>
            <pre style={{ maxHeight:320, overflow:'auto' }}>{JSON.stringify(data, null, 2)}</pre>
          </div>
        </div>
      )}
    </div>
  );
}

function Bars({ data }:{ data:{ label:string; value:number }[] }){
  const max = useMemo(()=>Math.max(1, ...data.map(d=>d.value||0)), [data]);
  return (
    <div style={{ display:'grid', gap:8 }}>
      {data.map((d,i)=>(
        <div key={i} className="hstack" style={{ alignItems:'center', gap:8 }}>
          <div style={{ width:120 }}>{d.label}</div>
          <div style={{ background:'#eef2ff', height:20, borderRadius:4, flex:1 }}>
            <div style={{ width:`${(d.value/max)*100}%`, height:'100%', background:'#4f46e5', borderRadius:4 }} />
          </div>
          <div style={{ width:40, textAlign:'right' }}>{d.value}</div>
        </div>
      ))}
    </div>
  );
}

function PorSedeTable({ items }:{ items: Array<{ sede_codigo:string; estado:string; total:number }> }){
  const estados = ['APROBADO','BORRADOR','EN_REVISION'];
  const agrupado = new Map<string, Record<string, number>>();
  (items||[]).forEach((it:any) => {
    if (!agrupado.has(it.sede_codigo)) agrupado.set(it.sede_codigo, {} as any);
    const row = agrupado.get(it.sede_codigo)!;
    row[it.estado] = (row[it.estado]||0) + (it.total||0);
  });
  const filas = Array.from(agrupado.entries()).map(([sede, row]) => {
    const obj:any = { sede };
    let sum = 0;
    estados.forEach(e => { const v = row[e]||0; obj[e] = v; sum += v; });
    obj.total = sum; return obj;
  }).sort((a,b)=> a.sede.localeCompare(b.sede));
  const totales:any = { sede:'Total' };
  estados.forEach(e => { totales[e] = filas.reduce((a,b)=>a+(b[e]||0),0); });
  totales.total = filas.reduce((a,b)=>a+(b.total||0),0);

  return (
    <div style={{ overflowX:'auto' }}>
      <table className="table" style={{ minWidth:520 }}>
        <thead>
          <tr>
            <th>Sede</th>
            {estados.map(e => <th key={e}>{e}</th>)}
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {filas.map((f:any) => (
            <tr key={f.sede}>
              <td>{f.sede}</td>
              {estados.map(e => <td key={e}>{f[e]||0}</td>)}
              <td><b>{f.total||0}</b></td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <th>{totales.sede}</th>
            {estados.map(e => <th key={e}>{totales[e]||0}</th>)}
            <th>{totales.total||0}</th>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
