import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../store/auth';
import { Can } from '../components/Can';
import React, { createContext, useContext, useMemo, useState } from 'react';
import toast, { Toaster } from 'react-hot-toast';

type Toast = { id:number; kind:'success'|'error'|'info'; msg:string };
const ToastCtx = createContext<{ push:(t:Omit<Toast,'id'>)=>void } | null>(null);
export function useToast(){
  const ctx = useContext(ToastCtx);
  return ctx ?? { push: () => {} };
}

export function MainLayout() {
  const user = useAuth(s=>s.user);
  const logout = useAuth(s=>s.logout);
  const navigate = useNavigate();
  const [toasts, setToasts] = useState<Toast[]>([]);
  const api = useMemo(()=>({
    push: (t: Omit<Toast,'id'>) => {
      const id = Date.now()+Math.random();
      setToasts(prev => [...prev, { id, ...t }]);
      setTimeout(()=> setToasts(prev => prev.filter(x=>x.id!==id)), 3500);
    }
  }),[]);

  async function onLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <ToastCtx.Provider value={api}>
    <div>
      <header className="header">
        <div className="container hstack" style={{ justifyContent:'space-between' }}>
          <nav className="nav">
            <Link to="/">Dashboard</Link>
            <Can anyOf={["users.read"]}><Link to="/users">Usuarios</Link></Can>
            <Can anyOf={["expediente.read","expediente.update","expediente.create","expediente.review"]}><Link to="/expedientes">Expedientes</Link></Can>
            <Can anyOf={["catalogs.read","catalogs.write"]}><Link to="/catalogos">Catálogos</Link></Can>
            <Can anyOf={["reportes.read"]}><Link to="/reportes">Reportes</Link></Can>
          </nav>
          <div className="hstack" style={{ marginLeft:'auto' }}>
            <span className="muted">👤 {user?.username}</span>
            <button className="btn" onClick={onLogout}>Salir</button>
          </div>
        </div>
      </header>
      <main className="container section">
        <Outlet />
      </main>
  <Toaster position="bottom-right" />
      {/* Toasts */}
      <div style={{ position:'fixed', right:12, bottom:12, display:'grid', gap:8, width:360 }}>
        {toasts.map(t => (
          <div key={t.id} aria-live="polite" className={`toast ${t.kind}`}>
            {t.msg}
          </div>
        ))}
      </div>
    </div>
    </ToastCtx.Provider>
  );
}
