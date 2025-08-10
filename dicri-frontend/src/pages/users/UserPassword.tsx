import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { api } from '../../utils/http';
import { useNavigate, useParams } from 'react-router-dom';
import { useToast } from '../../routes/MainLayout';
import { mapError } from '../../utils/errors';

const passRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/;
const schema = z.object({ password: z.string().min(8).max(128).regex(passRegex, 'Password débil') });

type Form = z.infer<typeof schema>;

export function UserPasswordPage() {
  const { id } = useParams();
  const { register, handleSubmit, formState: { errors } } = useForm<Form>({ resolver: zodResolver(schema) });
  const navigate = useNavigate();
  const toast = useToast();
  const onSubmit = async (v: Form) => {
    try {
      await api.put(`/users/${id}/password`, v);
      toast.push({ kind:'success', msg:'Contraseña actualizada' });
      navigate(`/users/${id}`);
  } catch (e:any) { toast.push({ kind:'error', msg: mapError(e) }); }
  };
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="card form" style={{ maxWidth:480, padding:16 }}>
      <h2 style={{ marginTop:0 }}>Cambiar contraseña</h2>
      <div className="field"><span className="label">Nueva contraseña</span><input className="input" type="password" {...register('password')} />{errors.password && <small style={{ color:'crimson' }}>{errors.password.message}</small>}</div>
      <button className="btn primary" type="submit">Guardar</button>
    </form>
  );
}
