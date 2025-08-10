import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '../store/auth';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useToast } from '../routes/MainLayout';
import { mapError } from '../utils/errors';

const schema = z.object({
  username: z.string().min(3),
  password: z.string().min(8),
});

type Form = z.infer<typeof schema>;

export function LoginPage() {
  const { register, handleSubmit, formState: { errors } } = useForm<Form>({ resolver: zodResolver(schema) });
  const login = useAuth(s=>s.login);
  const loading = useAuth(s=>s.loading);
  const err = useAuth(s=>s.error);
  const navigate = useNavigate();
  const location = useLocation() as any;
  const toast = useToast();

  async function onSubmit(values: Form) {
    const r = await login(values.username, values.password);
    if (r.ok) {
      const to = location.state?.from?.pathname || '/';
      navigate(to);
    } else {
      if (err) toast.push({ kind:'error', msg: mapError({ response:{ data:{ error: err }}}) });
    }
  }

  return (
    <div style={{ display:'grid', placeItems:'center', height:'100vh' }}>
      <form onSubmit={handleSubmit(onSubmit)} className="card form" style={{ width:380, padding:16 }}>
        <h1>Iniciar sesión</h1>
        <div className="field">
          <span className="label">Usuario</span>
          <input className="input" {...register('username')} autoFocus />
          {errors.username && <small style={{ color:'crimson' }}>{errors.username.message}</small>}
        </div>
        <div className="field">
          <span className="label">Contraseña</span>
          <input className="input" type="password" {...register('password')} />
          {errors.password && <small style={{ color:'crimson' }}>{errors.password.message}</small>}
        </div>
        {err && <div style={{ color:'crimson' }}>{err}</div>}
        <button className="btn primary" type="submit" disabled={loading}>{loading ? 'Entrando…' : 'Entrar'}</button>
        <div className="hstack" style={{ fontSize:12 }}>
          {/* <Link to="/reset/request">¿Olvidaste tu contraseña?</Link>
          <Link to="/reset">Tengo un token</Link> */}
        </div>
      </form>
    </div>
  );
}
