import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { api } from '../utils/http';
import { useToast } from '../routes/MainLayout';
import { mapError } from '../utils/errors';

const schema = z.object({ username: z.string().min(3).optional(), email: z.string().email().optional() }).refine(d=>d.username || d.email, {message:'username o email requerido'});

type Form = z.infer<typeof schema>;

export function ResetRequestPage(){
  const { register, handleSubmit, formState:{ errors } } = useForm<Form>({ resolver: zodResolver(schema) });
  const toast = useToast();
  const onSubmit = async (v:Form) => {
    try{ await api.post('/auth/reset/request', v); toast.push({ kind:'success', msg:'Si existe, se envió correo' }); }
  catch(e:any){ toast.push({ kind:'error', msg: mapError(e) }); }
  };
  return (
    <form onSubmit={handleSubmit(onSubmit)} style={{ display:'grid', gap:8, maxWidth:400 }}>
      <h2>Solicitar restablecimiento</h2>
      <label>Usuario<input {...register('username')} /></label>
      <label>Email<input {...register('email')} /></label>
      {(errors as any)?.root && <small style={{ color:'crimson' }}>{(errors as any).root.message}</small>}
      <button type="submit">Solicitar</button>
    </form>
  );
}
