import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '../store/auth';
import { useLocation, useNavigate, Link } from 'react-router-dom';

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

  async function onSubmit(values: Form) {
    const r = await login(values.username, values.password);
    if (r.ok) {
      const to = location.state?.from?.pathname || '/';
      navigate(to);
    } else {
      // mostrar mensajes específicos
      // 423: bloqueado; 401: creds; response contiene remainingAttempts y lockedUntil
      // se refleja en err
    }
  }

  return (
    <div style={{ display:'grid', placeItems:'center', height:'100vh', fontFamily:'system-ui' }}>
      <form onSubmit={handleSubmit(onSubmit)} style={{ width:360, display:'grid', gap:12 }}>
        <h1>Iniciar sesión</h1>
        <label>
          Usuario
          <input {...register('username')} autoFocus />
          {errors.username && <small style={{ color:'crimson' }}>{errors.username.message}</small>}
        </label>
        <label>
          Contraseña
          <input type="password" {...register('password')} />
          {errors.password && <small style={{ color:'crimson' }}>{errors.password.message}</small>}
        </label>
        {err && <div style={{ color:'crimson' }}>{err}</div>}
        <button type="submit" disabled={loading}>{loading ? 'Entrando…' : 'Entrar'}</button>
        <div style={{ fontSize:12, display:'flex', gap:8 }}>
          {/* <Link to="/reset/request">¿Olvidaste tu contraseña?</Link> */}
          {/* <Link to="/reset">Tengo un token</Link> */}
        </div>
      </form>
    </div>
  );
}
