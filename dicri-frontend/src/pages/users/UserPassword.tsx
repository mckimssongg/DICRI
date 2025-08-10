import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { api } from '../../utils/http';
import { useNavigate, useParams } from 'react-router-dom';

const passRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/;
const schema = z.object({ password: z.string().min(8).max(128).regex(passRegex, 'Password débil') });

type Form = z.infer<typeof schema>;

export function UserPasswordPage() {
  const { id } = useParams();
  const { register, handleSubmit, formState: { errors } } = useForm<Form>({ resolver: zodResolver(schema) });
  const navigate = useNavigate();
  const onSubmit = async (v: Form) => {
    try {
      await api.put(`/users/${id}/password`, v);
      navigate(`/users/${id}`);
    } catch (e:any) { alert(e?.response?.data?.error || 'Error'); }
  };
  return (
    <form onSubmit={handleSubmit(onSubmit)} style={{ display:'grid', gap:8, maxWidth:400 }}>
      <h2>Cambiar contraseña</h2>
      <label>Nueva contraseña<input type="password" {...register('password')} /></label>
      {errors.password && <small style={{ color:'crimson' }}>{errors.password.message}</small>}
      <button type="submit">Guardar</button>
    </form>
  );
}
