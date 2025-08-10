import { useEffect, useMemo, useState } from 'react';
import { api } from '../utils/http';
import { useAuth } from '../store/auth';
import { mapError } from '../utils/errors';
import { useToast } from '../routes/MainLayout';

export function DashboardPage() {
  const hasPerm = useAuth(s=>s.hasPerm);
  const [data, setData] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);
  const toast = useToast();

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!hasPerm('reportes.read')) return;
      try {
  const r = await api.get('/reportes/expedientes');
        if (mounted) setData(r.data);
  toast.push({ kind:'success', msg:'Dashboard actualizado' });
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
          <h3 className="card-title">Resumen de expedientes</h3>
          {err && <div style={{ color:'crimson' }}>{err}</div>}
          {!data ? <div>Cargando…</div> : (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:16 }}>
              <StatCard title="Aprobados" value={(data.byEstado||[]).find((x:any)=>x.estado==='APROBADO')?.total ?? 0} color="#16a34a" />
              <StatCard title="Borradores" value={(data.byEstado||[]).find((x:any)=>x.estado==='BORRADOR')?.total ?? 0} color="#2563eb" />
              <StatCard title="En revisión" value={(data.byEstado||[]).find((x:any)=>x.estado==='EN_REVISION')?.total ?? 0} color="#f59e0b" />
              <div className="card" style={{ gridColumn:'1 / span 2', padding:12 }}>
                <h4 className="card-title">Por estado</h4>
                <Bars data={(data.byEstado||[]).map((x:any)=>({ label:x.estado, value:x.total }))} />
              </div>
              <div className="card" style={{ padding:12 }}>
                <h4 className="card-title">Distribución (pie)</h4>
                <Pie data={(data.byEstado||[]).map((x:any)=>({ label:x.estado, value:x.total }))} />
              </div>
            </div>
          )}
        </div>
      ) : (
        <p>No tienes permiso para ver reportes.</p>
      )}
    </div>
  );
}

function StatCard({ title, value, color }:{ title:string; value:number; color:string }){
  return (
    <div className="card" style={{ padding:12 }}>
      <div className="muted" style={{ marginBottom:4 }}>{title}</div>
      <div style={{ fontSize:28, fontWeight:700, color }}>{value}</div>
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

function Pie({ data }:{ data:{ label:string; value:number }[] }){
  const total = data.reduce((a,b)=>a+(b.value||0),0) || 1;
  let acc = 0;
  const colors = ['#2563eb','#16a34a','#f59e0b','#ef4444','#8b5cf6'];
  return (
    <svg viewBox="0 0 42 42" width={160} height={160} style={{ display:'block', margin:'auto' }}>
      {data.map((d,i)=>{
        const v = (d.value||0)/total; const start = acc; acc += v; const end = acc;
        const a0 = 2*Math.PI*start, a1 = 2*Math.PI*end;
        const x0 = 21+20*Math.sin(a0), y0=21-20*Math.cos(a0);
        const x1 = 21+20*Math.sin(a1), y1=21-20*Math.cos(a1);
        const large = end-start > 0.5 ? 1 : 0;
        const path = `M21 21 L ${x0} ${y0} A 20 20 0 ${large} 1 ${x1} ${y1} Z`;
        return <path key={i} d={path} fill={colors[i%colors.length]} stroke="#fff" strokeWidth={0.5} />
      })}
    </svg>
  );
}
