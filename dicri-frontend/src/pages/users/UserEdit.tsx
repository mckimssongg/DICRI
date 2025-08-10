import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { api } from '../../utils/http';
import { useNavigate, useParams } from 'react-router-dom';
import { useToast } from '../../routes/MainLayout';
import { mapError } from '../../utils/errors';

const schema = z.object({
  email: z.string().email(),
  is_active: z.boolean(),
  mfa_required: z.boolean(),
});

type Form = z.infer<typeof schema>;

export function UserEditPage() {
  const { id } = useParams();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<Form>({ resolver: zodResolver(schema) });
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    (async () => {
      const r = await api.get(`/users/${id}`);
      reset({ email: r.data.email, is_active: !!r.data.is_active, mfa_required: !!r.data.mfa_required });
    })();
  }, [id, reset]);

  const onSubmit = async (v: Form) => {
    try {
      await api.put(`/users/${id}`, v);
      toast.push({ kind:'success', msg:'Usuario actualizado' });
      navigate(`/users/${id}`);
  } catch (e:any) { toast.push({ kind:'error', msg: mapError(e) }); }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="card form" style={{ maxWidth:480, padding:16 }}>
      <h2 style={{ marginTop:0 }}>Editar usuario</h2>
      <div className="field"><span className="label">Email</span><input className="input" {...register('email')} />{errors.email && <small style={{ color:'crimson' }}>{errors.email.message}</small>}</div>
      <label className="hstack"><input type="checkbox" {...register('is_active')} /> Activo</label>
      <label className="hstack"><input type="checkbox" {...register('mfa_required')} /> Requiere MFA</label>
      <button className="btn primary" type="submit">Guardar</button>
    </form>
  );
}
