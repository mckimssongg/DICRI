import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../../utils/http';
import { useToast } from '../../routes/MainLayout';
import { mapError } from '../../utils/errors';
import { useAuth } from '../../store/auth';

export function ExpedienteDetailPage() {
  const { id } = useParams();
  const hasPerm = useAuth(s=>s.hasPerm);
  const [exp, setExp] = useState<any>(null);
  const [err, setErr] = useState<string|null>(null);
  const toast = useToast();

  async function load() {
    try {
      const r = await api.get(`/expedientes/${id}`);
      setExp(r.data);
  } catch (e:any) { setErr(mapError(e)); }
  }

  useEffect(() => { load(); }, [id]);

  async function doAction(path:string, body?:any) {
    try {
      await api.post(`/expedientes/${id}/${path}`, body);
      await load();
      const msg = path==='submit' ? 'Enviado a revisión' : path==='approve' ? 'Aprobado' : path==='reject' ? 'Rechazado' : 'Reenviado a revisión';
      toast.push({ kind:'success', msg });
  } catch (e:any) { toast.push({ kind:'error', msg: mapError(e) }); }
  }

  async function doDelete() {
    if (!confirm('¿Eliminar?')) return;
    try { await api.delete(`/expedientes/${id}`); toast.push({ kind:'success', msg:'Expediente eliminado' }); history.back(); }
  catch (e:any){ toast.push({ kind:'error', msg: mapError(e) }); }
  }

  if (err) return <div style={{ color:'crimson' }}>{err}</div>;
  if (!exp) return <div>Cargando…</div>;

  const estado = exp.estado as string;
  const puedeEditar = estado === 'BORRADOR' && hasPerm('expediente.update');
  const puedeSubmit = hasPerm('expediente.update') || hasPerm('expediente.create');
  const puedeRevisar = hasPerm('expediente.review');

  return (
    <div className="card" style={{ padding:16 }}>
      <div className="hstack" style={{ justifyContent:'space-between' }}>
        <h2 style={{ margin:0 }}>Expediente {exp.folio}</h2>
        <span className="badge">{estado}</span>
      </div>
      <Editable exp={exp} enabled={puedeEditar} onSaved={load} />
      <div className="hstack" style={{ marginTop:8 }}>
        {puedeSubmit && estado==='RECHAZADO' && (
          <button className="btn" onClick={() => doAction('resubmit')}>Re-enviar revisión</button>
        )}
        {puedeSubmit && estado==='BORRADOR' && <button className="btn primary" onClick={() => doAction('submit')}>Enviar a revisión</button>}
        {puedeRevisar && estado==='EN_REVISION' && <>
          <button className="btn" onClick={() => doAction('approve')}>Aprobar</button>
          <button className="btn danger" onClick={() => {
            const motivo = prompt('Motivo de rechazo:');
            if (motivo && motivo.length >= 5) doAction('reject', { motivo });
          }}>Rechazar</button>
        </>}
        {(hasPerm('expediente.update') || puedeRevisar) && <button className="btn" onClick={doDelete}>Eliminar</button>}
      </div>

      <h3>Indicios</h3>
      <ExpIndicios expedienteId={Number(id)} />

      <h3>Adjuntos</h3>
      <ExpAdjuntos expedienteId={Number(id)} />
    </div>
  );
}
function Editable({ exp, enabled, onSaved }:{ exp:any; enabled:boolean; onSaved:()=>void }){
  const [edit, setEdit] = useState(enabled);
  const [titulo, setTitulo] = useState(exp.titulo);
  const [sede, setSede] = useState(exp.sede_codigo);
  const [fecha, setFecha] = useState((exp.fecha_registro||'').slice(0,10));
  const [desc, setDesc] = useState(exp.descripcion || '');
  const { id } = useParams();
  const toast = useToast();

  useEffect(()=>{ setEdit(enabled); }, [enabled]);

  async function save(){
  try{
    // Normalizar fecha a YYYY-MM-DD
    let f = (fecha || '').trim();
    if (/^\d{4}-\d{2}-\d{2}T/.test(f)) f = f.slice(0,10);
    await api.put(`/expedientes/${id}`, { sede_codigo: sede, fecha_registro: f, titulo, descripcion: desc || undefined });
  setEdit(false); onSaved();
  toast.push({ kind:'success', msg:'Expediente guardado' });
  }
  catch(e:any){ /* toast en nivel superior */ }
  }

  if(!edit){
    return (
      <div>
        <div><b>Título:</b> {exp.titulo}</div>
        <div><b>Sede:</b> {exp.sede_codigo}</div>
  <div><b>Fecha:</b> {(exp.fecha_registro||'').slice(0,10)}</div>
      </div>
    );
  }
  return (
    <div className="card form" style={{ maxWidth:560, padding:12, marginTop:12 }}>
      <div className="field"><span className="label">Título</span><input className="input" value={titulo} onChange={e=>setTitulo(e.target.value)} /></div>
      <div className="field"><span className="label">Sede</span><input className="input" value={sede} onChange={e=>setSede(e.target.value)} /></div>
  <div className="field"><span className="label">Fecha</span><input className="input" type="date" value={fecha} onChange={e=>setFecha(e.target.value)} /></div>
      <div className="field"><span className="label">Descripción</span><textarea className="textarea" value={desc} onChange={e=>setDesc(e.target.value)} /></div>
      <div className="hstack">
        <button className="btn primary" onClick={save}>Guardar</button>
        <button className="btn" onClick={()=>setEdit(false)}>Cancelar</button>
      </div>
    </div>
  );
}

function ExpIndicios({ expedienteId }:{ expedienteId:number }) {
  const hasPerm = useAuth(s=>s.hasPerm);
  const [items, setItems] = useState<any[]>([]);
  const [err, setErr] = useState<string|null>(null);
  const toast = useToast();

  async function load() {
  try { const r = await api.get(`/expedientes/${expedienteId}/indicios`); setItems(r.data); }
  catch (e:any){ setErr(mapError(e)); }
  }
  useEffect(() => { load(); }, [expedienteId]);

  async function crear() {
    const tipo_code = prompt('Tipo (code):');
    if (!tipo_code) return;
  try { await api.post(`/expedientes/${expedienteId}/indicios`, { tipo_code }); await load(); toast.push({ kind:'success', msg:'Indicio creado' }); }
  catch (e:any){ toast.push({ kind:'error', msg: mapError(e) }); }
  }
  async function editar(id:number) {
    const tipo_code = prompt('Nuevo tipo (code):');
    if (!tipo_code) return;
  try { await api.put(`/indicios/${id}`, { tipo_code }); await load(); toast.push({ kind:'success', msg:'Indicio actualizado' }); }
  catch (e:any){ toast.push({ kind:'error', msg: mapError(e) }); }
  }
  async function eliminar(id:number) {
    if (!confirm('¿Eliminar indicio?')) return;
  try { await api.delete(`/indicios/${id}`); await load(); toast.push({ kind:'success', msg:'Indicio eliminado' }); }
  catch (e:any){ toast.push({ kind:'error', msg: mapError(e) }); }
  }

  return (
    <div className="section">
      {err && <div style={{ color:'crimson' }}>{err}</div>}
      {hasPerm('indicio.create') && <button className="btn" onClick={crear}>Agregar indicio</button>}
      <ul style={{ paddingLeft:16 }}>
        {items.map(i => (
          <li key={i.indicio_id}>
            #{i.indicio_id} — {i.tipo_code}
            {hasPerm('indicio.update') && <>
              {' '}<button className="btn" onClick={() => editar(i.indicio_id)}>Editar</button>
              {' '}<button className="btn danger" onClick={() => eliminar(i.indicio_id)}>Eliminar</button>
            </>}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ExpAdjuntos({ expedienteId }:{ expedienteId:number }) {
  const hasPerm = useAuth(s=>s.hasPerm);
  const [items, setItems] = useState<any[]>([]);
  const [err, setErr] = useState<string|null>(null);
  const toast = useToast();

  async function load() {
  try { const r = await api.get(`/expedientes/${expedienteId}/adjuntos`); setItems(r.data); }
  catch (e:any){ setErr(mapError(e)); }
  }
  useEffect(() => { load(); }, [expedienteId]);

  async function subir(e:React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (!f) return;
    const fd = new FormData(); fd.append('file', f);
  try { await api.post(`/expedientes/${expedienteId}/adjuntos`, fd); await load(); toast.push({ kind:'success', msg:'Adjunto subido' }); }
  catch (e:any){ toast.push({ kind:'error', msg: mapError(e) }); }
    finally { e.currentTarget.value = ''; }
  }

  async function descargar(id:number) {
    try {
      const r = await api.get(`/adjuntos/${id}/download`, { responseType: 'blob' });
      const headers = r.headers as any;
      let filename = headers['x-filename'] ? decodeURIComponent(headers['x-filename']) : 'archivo.bin';
      if (!headers['x-filename']) {
        const disposition = (headers['content-disposition'] as string | undefined) || (headers['Content-Disposition'] as any);
        if (disposition) {
          const m = /filename="?([^";]+)"?/i.exec(disposition);
          if (m) filename = decodeURIComponent(m[1]);
        }
      }
      const type = (headers['content-type'] as string | undefined) || (headers['Content-Type'] as any) || 'application/octet-stream';
      const blob = new Blob([r.data], { type });
      // Detección de fallo típico: HTML de Vite dev
      if (type.includes('text/html') || filename.toLowerCase().endsWith('.htm') || filename.toLowerCase().endsWith('.html')) {
        toast.push({ kind:'error', msg:'La descarga devolvió HTML (¿proxy dev o ruta incorrecta?). Intenta de nuevo.' });
        return;
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = filename;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
  toast.push({ kind:'success', msg:`Descargado: ${filename}` });
    } catch (e:any) {
      toast.push({ kind:'error', msg: mapError(e) });
    }
  }
  async function eliminar(id:number) {
    if (!confirm('¿Eliminar adjunto?')) return;
    try { await api.delete(`/adjuntos/${id}`); await load(); toast.push({ kind:'success', msg:'Adjunto eliminado' }); }
  catch (e:any){ toast.push({ kind:'error', msg: mapError(e) }); }
  }

  return (
    <div className="section">
      {err && <div style={{ color:'crimson' }}>{err}</div>}
      {(hasPerm('expediente.update') || hasPerm('expediente.create') || hasPerm('expediente.read')) && (
        <input className="input" type="file" onChange={subir} />
      )}
      <ul style={{ paddingLeft:16 }}>
        {items.map(a => (
          <li key={a.adjunto_id}>
            #{a.adjunto_id} — {a.archivo_nombre} — {a.scan_status}
            {' '}
            <button className="btn" disabled={a.scan_status==='PENDING' || a.scan_status==='INFECTED'} onClick={() => descargar(a.adjunto_id)}>Descargar</button>
            {' '}
            {(hasPerm('expediente.update') || hasPerm('expediente.review')) && <button className="btn danger" onClick={() => eliminar(a.adjunto_id)}>Eliminar</button>}
          </li>
        ))}
      </ul>
    </div>
  );
}
