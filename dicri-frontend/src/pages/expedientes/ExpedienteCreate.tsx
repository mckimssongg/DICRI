import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { api } from '../../utils/http';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../routes/MainLayout';
import { mapError } from '../../utils/errors';

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
  const toast = useToast();

  const onSubmit = async (v: Form) => {
    try {
      const r = await api.post('/expedientes', v);
      const id = r.data?.expediente_id;
  toast.push({ kind:'success', msg:'Expediente creado' });
      navigate(`/expedientes/${id}`);
    } catch (e:any) {
      toast.push({ kind:'error', msg: mapError(e) });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="card form" style={{ maxWidth:560, padding:16 }}>
      <h2 style={{ marginTop:0 }}>Nuevo expediente</h2>
      <div className="field"><span className="label">Sede</span><input className="input" {...register('sede_codigo')} />{errors.sede_codigo && <small style={{ color:'crimson' }}>{errors.sede_codigo.message}</small>}</div>
      <div className="field"><span className="label">Fecha</span><input className="input" placeholder="YYYY-MM-DD" {...register('fecha_registro')} />{errors.fecha_registro && <small style={{ color:'crimson' }}>{errors.fecha_registro.message}</small>}</div>
      <div className="field"><span className="label">Título</span><input className="input" {...register('titulo')} />{errors.titulo && <small style={{ color:'crimson' }}>{errors.titulo.message}</small>}</div>
      <div className="field"><span className="label">Descripción</span><textarea className="textarea" {...register('descripcion')} /></div>
      <button className="btn primary" type="submit">Crear</button>
    </form>
  );
}
