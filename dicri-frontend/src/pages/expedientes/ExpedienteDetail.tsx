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
    <div style={{ display:'grid', gap:12 }}>
      <h2>Expediente {exp.folio}</h2>
      <div><b>Estado:</b> {estado}</div>
  <Editable exp={exp} enabled={puedeEditar} onSaved={load} />
      <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
        {puedeSubmit && estado==='RECHAZADO' && (
          <button onClick={() => doAction('resubmit')}>Re-enviar revisión</button>
        )}
        {puedeSubmit && estado==='BORRADOR' && <button onClick={() => doAction('submit')}>Enviar a revisión</button>}
        {puedeRevisar && estado==='EN_REVISION' && <>
          <button onClick={() => doAction('approve')}>Aprobar</button>
          <button onClick={() => {
            const motivo = prompt('Motivo de rechazo:');
            if (motivo && motivo.length >= 5) doAction('reject', { motivo });
          }}>Rechazar</button>
        </>}
        {(hasPerm('expediente.update') || puedeRevisar) && <button onClick={doDelete}>Eliminar</button>}
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
  const [fecha, setFecha] = useState(exp.fecha_registro);
  const [desc, setDesc] = useState(exp.descripcion || '');
  const { id } = useParams();

  useEffect(()=>{ setEdit(enabled); }, [enabled]);

  async function save(){
  try{ await api.put(`/expedientes/${id}`, { sede_codigo: sede, fecha_registro: fecha, titulo, descripcion: desc || undefined }); setEdit(false); onSaved(); }
  catch(e:any){ /* toast en nivel superior */ }
  }

  if(!edit){
    return (
      <div>
        <div><b>Título:</b> {exp.titulo}</div>
        <div><b>Sede:</b> {exp.sede_codigo}</div>
        <div><b>Fecha:</b> {exp.fecha_registro}</div>
      </div>
    );
  }
  return (
    <div style={{ display:'grid', gap:8, maxWidth:480, border:'1px solid #eee', padding:12, borderRadius:8 }}>
      <label>Título<input value={titulo} onChange={e=>setTitulo(e.target.value)} /></label>
      <label>Sede<input value={sede} onChange={e=>setSede(e.target.value)} /></label>
      <label>Fecha<input value={fecha} onChange={e=>setFecha(e.target.value)} /></label>
      <label>Descripción<textarea value={desc} onChange={e=>setDesc(e.target.value)} /></label>
      <div>
        <button onClick={save}>Guardar</button>{' '}
        <button onClick={()=>setEdit(false)}>Cancelar</button>
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
    <div>
      {err && <div style={{ color:'crimson' }}>{err}</div>}
      {hasPerm('indicio.create') && <button onClick={crear}>Agregar indicio</button>}
      <ul>
        {items.map(i => (
          <li key={i.indicio_id}>
            #{i.indicio_id} — {i.tipo_code}
            {hasPerm('indicio.update') && <>
              {' '}<button onClick={() => editar(i.indicio_id)}>Editar</button>
              {' '}<button onClick={() => eliminar(i.indicio_id)}>Eliminar</button>
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
  try { await api.post(`/expedientes/${expedienteId}/adjuntos`, fd, { headers: { 'Content-Type': 'multipart/form-data' } }); await load(); toast.push({ kind:'success', msg:'Adjunto subido' }); }
  catch (e:any){ toast.push({ kind:'error', msg: mapError(e) }); }
    finally { e.currentTarget.value = ''; }
  }

  async function descargar(id:number) {
    try {
      const r = await api.get(`/adjuntos/${id}/download`);
      const { url, filename } = r.data;
      const a = document.createElement('a'); a.href = url; a.download = filename || '';
      document.body.appendChild(a); a.click(); a.remove();
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
    <div>
      {err && <div style={{ color:'crimson' }}>{err}</div>}
      {(hasPerm('expediente.update') || hasPerm('expediente.create') || hasPerm('expediente.read')) && (
        <input type="file" onChange={subir} />
      )}
      <ul>
        {items.map(a => (
          <li key={a.adjunto_id}>
            #{a.adjunto_id} — {a.archivo_nombre} — {a.scan_status}
            {' '}
            <button disabled={a.scan_status==='PENDING' || a.scan_status==='INFECTED'} onClick={() => descargar(a.adjunto_id)}>Descargar</button>
            {' '}
            {(hasPerm('expediente.update') || hasPerm('expediente.review')) && <button onClick={() => eliminar(a.adjunto_id)}>Eliminar</button>}
          </li>
        ))}
      </ul>
    </div>
  );
}
