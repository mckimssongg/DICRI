import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../../utils/http';
import { useAuth } from '../../store/auth';
import { mapError } from '../../utils/errors';
import { useToast } from '../../routes/MainLayout';

export function UserDetailPage() {
  const { id } = useParams();
  const hasPerm = useAuth(s=>s.hasPerm);
  const [u, setU] = useState<any>(null);
  const [error, setError] = useState<string|null>(null);
  const toast = useToast();

  useEffect(() => {
    async function load() {
      try {
        const r = await api.get(`/users/${id}`);
        setU(r.data);
      } catch (e:any) {
        setError(e?.response?.data?.error || 'Error');
      }
    }
    load();
  }, [id]);

  if (error) return <div style={{ color:'crimson' }}>{error}</div>;
  if (!u) return <div>Cargando…</div>;

  return (
    <div>
      <h2>Usuario {u.username}</h2>
      <p><b>ID:</b> {u.user_id || u.id}</p>
      <p><b>Email:</b> {u.email}</p>
      <p><b>Activo:</b> {String(u.is_active ?? true)}</p>
      <p><b>Roles:</b> {(u.roles || []).join(', ')}</p>
      {hasPerm('users.write') && (
        <div style={{ display:'flex', gap:8 }}>
          <Link to={`/users/${u.user_id || u.id}/edit`}>Editar</Link>
          <Link to={`/users/${u.user_id || u.id}/password`}>Cambiar contraseña</Link>
          <button onClick={async ()=>{
            const ok = window.confirm('¿Deshabilitar usuario?');
            if(!ok) return;
            try{
              await api.delete(`/users/${u.user_id || u.id}`);
              toast.push({ kind:'success', msg:'Usuario deshabilitado' });
            } catch(e:any){
              toast.push({ kind:'error', msg: mapError(e) });
            }
          }}>Deshabilitar</button>
        </div>
      )}
    </div>
  );
}
