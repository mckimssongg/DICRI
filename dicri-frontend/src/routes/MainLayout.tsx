import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../store/auth';
import { Can } from '../components/Can';

export function MainLayout() {
  const user = useAuth(s=>s.user);
  const logout = useAuth(s=>s.logout);
  const navigate = useNavigate();

  async function onLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <div style={{ fontFamily: 'system-ui' }}>
      <header style={{ display:'flex', gap:16, padding:12, borderBottom:'1px solid #eee' }}>
        <nav style={{ display:'flex', gap:12 }}>
          <Link to="/">Dashboard</Link>
          <Can anyOf={["users.read"]}><Link to="/users">Usuarios</Link></Can>
          <Can anyOf={["expediente.read","expediente.update","expediente.create","expediente.review"]}><Link to="/expedientes">Expedientes</Link></Can>
          <Can anyOf={["catalogs.read","catalogs.write"]}><Link to="/catalogos">Catálogos</Link></Can>
          <Can anyOf={["reportes.read"]}><Link to="/reportes">Reportes</Link></Can>
        </nav>
        <div style={{ marginLeft:'auto' }}>
          <span style={{ marginRight: 12 }}>👤 {user?.username}</span>
          <button onClick={onLogout}>Salir</button>
        </div>
      </header>
      <main style={{ padding: 16 }}>
        <Outlet />
      </main>
    </div>
  );
}
