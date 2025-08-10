import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { api } from '../../utils/http';
import { useNavigate } from 'react-router-dom';

const schema = z.object({
  sede_codigo: z.string().min(2).max(10),
  fecha_registro: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  titulo: z.string().min(3).max(200),
  descripcion: z.string().max(2000).optional(),
});

type Form = z.infer<typeof schema>;

export function ExpedienteCreatePage() {
  const { register, handleSubmit, formState: { errors } } = useForm<Form>({ resolver: zodResolver(schema) });
  const navigate = useNavigate();

  const onSubmit = async (v: Form) => {
    try {
      const r = await api.post('/expedientes', v);
      const id = r.data?.expediente_id;
      navigate(`/expedientes/${id}`);
    } catch (e:any) {
      alert(e?.response?.data?.error || 'Error');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} style={{ display:'grid', gap:8, maxWidth:480 }}>
      <h2>Nuevo expediente</h2>
      <label>Sede<input {...register('sede_codigo')} /></label>
      {errors.sede_codigo && <small style={{ color:'crimson' }}>{errors.sede_codigo.message}</small>}
      <label>Fecha<input placeholder="YYYY-MM-DD" {...register('fecha_registro')} /></label>
      {errors.fecha_registro && <small style={{ color:'crimson' }}>{errors.fecha_registro.message}</small>}
      <label>Título<input {...register('titulo')} /></label>
      {errors.titulo && <small style={{ color:'crimson' }}>{errors.titulo.message}</small>}
      <label>Descripción<textarea {...register('descripcion')} /></label>
      <button type="submit">Crear</button>
    </form>
  );
}
