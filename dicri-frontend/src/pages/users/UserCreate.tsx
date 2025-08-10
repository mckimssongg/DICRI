import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { api } from '../../utils/http';
import { useNavigate } from 'react-router-dom';

const passRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/;
const schema = z.object({
  username: z.string().min(3).max(64),
  email: z.string().email(),
  password: z.string().min(8).max(128).regex(passRegex, 'Password débil'),
  mfa_required: z.boolean().default(false),
});

type Form = z.infer<typeof schema>;

export function UserCreatePage() {
  const { register, handleSubmit, formState: { errors } } = useForm<Form>({ resolver: zodResolver(schema), defaultValues: { mfa_required:false } });
  const navigate = useNavigate();
  const onSubmit = async (v: Form) => {
    try {
      const r = await api.post('/users', { ...v, roles: [] });
      const id = r.data?.id;
      navigate(`/users/${id}`);
    } catch (e:any) {
      alert(e?.response?.data?.error || 'Error');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} style={{ display:'grid', gap:8, maxWidth:400 }}>
      <h2>Crear usuario</h2>
      <label>Usuario<input {...register('username')} /></label>
      {errors.username && <small style={{ color:'crimson' }}>{errors.username.message}</small>}
      <label>Email<input {...register('email')} /></label>
      {errors.email && <small style={{ color:'crimson' }}>{errors.email.message}</small>}
      <label>Contraseña<input type="password" {...register('password')} /></label>
      {errors.password && <small style={{ color:'crimson' }}>{errors.password.message}</small>}
      <label><input type="checkbox" {...register('mfa_required')} /> Requiere MFA</label>
      <button type="submit">Crear</button>
    </form>
  );
}
