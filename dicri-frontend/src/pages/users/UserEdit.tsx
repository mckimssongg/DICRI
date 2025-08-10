import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { api } from '../../utils/http';
import { useNavigate, useParams } from 'react-router-dom';

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

  useEffect(() => {
    (async () => {
      const r = await api.get(`/users/${id}`);
      reset({ email: r.data.email, is_active: !!r.data.is_active, mfa_required: !!r.data.mfa_required });
    })();
  }, [id, reset]);

  const onSubmit = async (v: Form) => {
    try {
      await api.put(`/users/${id}`, v);
      navigate(`/users/${id}`);
    } catch (e:any) { alert(e?.response?.data?.error || 'Error'); }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} style={{ display:'grid', gap:8, maxWidth:400 }}>
      <h2>Editar usuario</h2>
      <label>Email<input {...register('email')} /></label>
      {errors.email && <small style={{ color:'crimson' }}>{errors.email.message}</small>}
      <label><input type="checkbox" {...register('is_active')} /> Activo</label>
      <label><input type="checkbox" {...register('mfa_required')} /> Requiere MFA</label>
      <button type="submit">Guardar</button>
    </form>
  );
}
