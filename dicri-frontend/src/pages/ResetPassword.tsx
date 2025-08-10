import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { api } from '../utils/http';
import { useSearchParams } from 'react-router-dom';
import { useToast } from '../routes/MainLayout';
import { mapError } from '../utils/errors';

const schema = z.object({
  token: z.string().min(10),
  newPassword: z.string().min(8).max(128).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/, 'Password débil'),
});

type Form = z.infer<typeof schema>;

export function ResetPasswordPage() {
  const [sp] = useSearchParams();
  const token = sp.get('token') || '';
  const { register, handleSubmit, formState: { errors } } = useForm<Form>({ resolver: zodResolver(schema), defaultValues: { token } });
  const toast = useToast();
  const onSubmit = async (v: Form) => {
    try { await api.post('/auth/reset/confirm', v); toast.push({ kind:'success', msg:'Contraseña actualizada' }); }
  catch (e:any){ toast.push({ kind:'error', msg: mapError(e) }); }
  };
  return (
    <form onSubmit={handleSubmit(onSubmit)} style={{ display:'grid', gap:8, maxWidth:400 }}>
      <h2>Restablecer contraseña</h2>
      <input type="hidden" {...register('token')} />
      <label>Nueva contraseña<input type="password" {...register('newPassword')} /></label>
      {errors.newPassword && <small style={{ color:'crimson' }}>{errors.newPassword.message}</small>}
      <button type="submit">Aplicar</button>
    </form>
  );
}
