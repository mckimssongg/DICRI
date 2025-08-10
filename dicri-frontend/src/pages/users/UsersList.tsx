import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../../utils/http';
import { useAuth } from '../../store/auth';
import { Pagination } from '../../routes/Pagination';
import { mapError } from '../../utils/errors';

export function UsersListPage() {
  const hasPerm = useAuth(s=>s.hasPerm);
  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string|null>(null);
  const [sp, setSp] = useSearchParams();
  const page = Number(sp.get('page') || '1');
  const pageSize = Number(sp.get('pageSize') || '20');
  const q = sp.get('q') || '';

  useEffect(() => {
    async function load() {
      setLoading(true); setError(null);
      try {
        const r = await api.get('/users', { params: { q, page, pageSize } });
        setItems(r.data.items || []);
        setTotal(r.data.total || 0);
      } catch (e:any) {
        setError(mapError(e));
      } finally { setLoading(false); }
    }
    load();
  }, [q, page, pageSize]);

  function onPage(p:number) {
    sp.set('page', String(p));
    setSp(sp);
  }

  return (
    <div className="card" style={{ padding:16 }}>
      <div className="hstack" style={{ justifyContent:'space-between' }}>
        <h2 style={{ margin:0 }}>Usuarios</h2>
        {hasPerm('users.write') && <Link className="btn primary" to="/users/create">Nuevo</Link>}
      </div>
      <div className="hstack" style={{ margin:'12px 0' }}>
        <input className="input" placeholder="Buscar" defaultValue={q} onKeyDown={e=>{ if(e.key==='Enter'){ sp.set('q', (e.target as HTMLInputElement).value); sp.set('page','1'); setSp(sp);} }} />
      </div>

      {loading ? <div>Cargando…</div> : error ? <div style={{ color:'crimson' }}>{error}</div> : (
        <table className="table">
          <thead>
            <tr><th>ID</th><th>Usuario</th><th>Email</th><th>Activo</th><th>Acciones</th></tr>
          </thead>
          <tbody>
            {items.map(u => (
              <tr key={u.user_id || u.id}>
                <td>{u.user_id || u.id}</td>
                <td><Link to={`/users/${u.user_id || u.id}`}>{u.username}</Link></td>
                <td>{u.email}</td>
                <td>{String(u.is_active ?? true)}</td>
                <td>
                  {hasPerm('users.write') && (
                    <>
                      <Link to={`/users/${u.user_id || u.id}/edit`}>Editar</Link>{' '}
                      <Link to={`/users/${u.user_id || u.id}/password`}>Password</Link>
                    </>
                  )}
                </td>
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
