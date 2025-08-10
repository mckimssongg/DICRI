import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { api } from '../../utils/http';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../routes/MainLayout';
import { mapError } from '../../utils/errors';

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
  const toast = useToast();
  const onSubmit = async (v: Form) => {
    try {
      const r = await api.post('/users', { ...v, roles: [] });
      const id = r.data?.id;
      toast.push({ kind:'success', msg:'Usuario creado' });
      navigate(`/users/${id}`);
    } catch (e:any) {
  toast.push({ kind:'error', msg: mapError(e) });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="card form" style={{ maxWidth:480, padding:16 }}>
      <h2 style={{ marginTop:0 }}>Nuevo usuario</h2>
      <div className="field"><span className="label">Usuario</span><input className="input" {...register('username')} />{errors.username && <small style={{ color:'crimson' }}>{errors.username.message}</small>}</div>
      <div className="field"><span className="label">Email</span><input className="input" {...register('email')} />{errors.email && <small style={{ color:'crimson' }}>{errors.email.message}</small>}</div>
      <div className="field"><span className="label">Contraseña</span><input className="input" type="password" {...register('password')} />{errors.password && <small style={{ color:'crimson' }}>{errors.password.message}</small>}</div>
      <label className="hstack"><input type="checkbox" {...register('mfa_required')} /> Requiere MFA</label>
      <button className="btn primary" type="submit">Crear</button>
    </form>
  );
}
