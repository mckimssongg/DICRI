import { useEffect, useState } from 'react';
import { api } from '../../utils/http';
import { useAuth } from '../../store/auth';
import { useToast } from '../../routes/MainLayout';

const catalogs = [
  { key:'colores', label:'Colores' },
  { key:'tipos_indicio', label:'Tipos de indicio' },
  { key:'ubicaciones', label:'Ubicaciones' },
  { key:'unidades', label:'Unidades' },
];

export function CatalogsPage() {
  const hasPerm = useAuth(s=>s.hasPerm);
  const [data, setData] = useState<Record<string, any[]>>({});
  const [errors, setErrors] = useState<Record<string,string>>({});
  const [creating, setCreating] = useState<Record<string,{ code:string; label:string; sort_order:number }>>({});
  const toast = useToast();

  useEffect(() => {
    catalogs.forEach(async c => {
      try {
        const r = await api.get(`/catalogs/${c.key}/items`);
        setData(d => ({ ...d, [c.key]: r.data }));
      } catch (e:any) {
        setErrors(err => ({ ...err, [c.key]: e?.response?.data?.error || 'Error' }));
      }
    });
  }, []);

  async function reload(key:string){
    try { const r = await api.get(`/catalogs/${key}/items`); setData(d => ({ ...d, [key]: r.data })); }
    catch (e:any){ setErrors(err => ({ ...err, [key]: e?.response?.data?.error || 'Error' })); }
  }

  async function createItem(key:string){
    const v = creating[key]; if (!v?.code || !v?.label) return;
  try { await api.post(`/catalogs/${key}/items`, { code: v.code, label: v.label, sort_order: v.sort_order ?? 0 }); setCreating(c=>({ ...c, [key]: { code:'', label:'', sort_order:0 } })); await reload(key); toast.push({ kind:'success', msg:'Ítem agregado' }); }
  catch (e:any){ toast.push({ kind:'error', msg: e?.response?.data?.error || 'Error al agregar' }); }
  }

  async function updateItem(item:any){
    try { await api.put(`/catalogs/items/${item.item_id}`, { label: item.label, is_active: !!item.is_active, sort_order: Number(item.sort_order||0) }); toast.push({ kind:'success', msg:'Ítem actualizado' }); }
    catch (e:any){ toast.push({ kind:'error', msg: e?.response?.data?.error || 'Error al actualizar' }); }
  }

  async function deleteItem(key:string, itemId:number){
    if (!confirm('¿Eliminar ítem?')) return;
  try { await api.delete(`/catalogs/items/${itemId}`); await reload(key); toast.push({ kind:'success', msg:'Ítem eliminado' }); }
  catch (e:any){ toast.push({ kind:'error', msg: e?.response?.data?.error || 'Error al eliminar' }); }
  }

  return (
    <div style={{ display:'grid', gap:24 }}>
      <h2>Catálogos</h2>
      {catalogs.map(c => (
        <section key={c.key}>
          <h3>{c.label}</h3>
          {errors[c.key] ? <div style={{ color:'crimson' }}>{errors[c.key]}</div> : (
            <table>
              <thead><tr><th>Code</th><th>Label</th><th>Orden</th><th>Activo</th><th /></tr></thead>
              <tbody>
                {(data[c.key] || []).map((it:any) => (
                  <tr key={it.item_id}>
                    <td>{it.code}</td>
                    <td>{hasPerm('catalogs.write') ? <input value={it.label} onChange={e=>{ it.label=e.target.value; setData(d=>({...d})) }} onBlur={()=>updateItem(it)} /> : it.label}</td>
                    <td>{hasPerm('catalogs.write') ? <input style={{ width:60 }} type="number" value={it.sort_order} onChange={e=>{ it.sort_order=Number(e.target.value||0); setData(d=>({...d})) }} onBlur={()=>updateItem(it)} /> : it.sort_order}</td>
                    <td>{hasPerm('catalogs.write') ? <input type="checkbox" checked={!!it.is_active} onChange={e=>{ it.is_active=e.target.checked; setData(d=>({...d})); updateItem(it); }} /> : String(it.is_active)}</td>
                    <td>{hasPerm('catalogs.write') && <button onClick={()=>deleteItem(c.key, it.item_id)}>Eliminar</button>}</td>
                  </tr>
                ))}
                {hasPerm('catalogs.write') && (
                  <tr>
                    <td><input placeholder="code" value={creating[c.key]?.code || ''} onChange={e=>setCreating(s=>({ ...s, [c.key]: { ...(s[c.key]||{ code:'', label:'', sort_order:0 }), code: e.target.value } }))} /></td>
                    <td><input placeholder="label" value={creating[c.key]?.label || ''} onChange={e=>setCreating(s=>({ ...s, [c.key]: { ...(s[c.key]||{ code:'', label:'', sort_order:0 }), label: e.target.value } }))} /></td>
                    <td><input type="number" style={{ width:60 }} value={creating[c.key]?.sort_order ?? 0} onChange={e=>setCreating(s=>({ ...s, [c.key]: { ...(s[c.key]||{ code:'', label:'', sort_order:0 }), sort_order: Number(e.target.value||0) } }))} /></td>
                    <td></td>
                    <td><button onClick={()=>createItem(c.key)}>Agregar</button></td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </section>
      ))}
    </div>
  );
}
