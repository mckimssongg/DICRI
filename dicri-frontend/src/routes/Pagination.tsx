import { useMemo } from 'react';

type Props = { page:number; pageSize:number; total:number; onPage:(p:number)=>void };
export function Pagination({ page, pageSize, total, onPage }: Props) {
  const pages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize]);
  return (
    <div className="hstack">
      <button className="btn" onClick={() => onPage(1)} disabled={page<=1}>«</button>
      <button className="btn" onClick={() => onPage(page-1)} disabled={page<=1}>Anterior</button>
      <span className="badge">Página {page} de {pages}</span>
      <button className="btn" onClick={() => onPage(page+1)} disabled={page>=pages}>Siguiente</button>
      <button className="btn" onClick={() => onPage(pages)} disabled={page>=pages}>»</button>
    </div>
  );
}
