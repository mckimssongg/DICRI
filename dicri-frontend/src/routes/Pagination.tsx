import { useMemo } from 'react';

type Props = { page:number; pageSize:number; total:number; onPage:(p:number)=>void };
export function Pagination({ page, pageSize, total, onPage }: Props) {
  const pages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize]);
  return (
    <div style={{ display:'flex', gap:8, alignItems:'center' }}>
      <button onClick={() => onPage(1)} disabled={page<=1}>«</button>
      <button onClick={() => onPage(page-1)} disabled={page<=1}>Anterior</button>
      <span>Página {page} de {pages}</span>
      <button onClick={() => onPage(page+1)} disabled={page>=pages}>Siguiente</button>
      <button onClick={() => onPage(pages)} disabled={page>=pages}>»</button>
    </div>
  );
}
