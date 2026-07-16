import { useState } from 'react';
import { GraduationCap, Star, BookOpen, Lock } from 'lucide-react';

const CATEGORIAS = ['Todos', 'Programación', 'Ciberseguridad', 'Matemáticas', 'Electrónica', 'Arte'];

const AVATAR_COLORS = ['#0891B2','#7C3AED','#059669','#D97706','#DC2626','#2563EB','#0D9488'];
function avatarColor(name = '') {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

function StarRating({ value }) {
  if (!value) return null;
  return (
    <span className="flex items-center gap-0.5 text-amber-400">
      <Star size={10} className="fill-current" />
      <span className="text-[10px] font-bold tabular-nums">{value.toFixed(1)}</span>
    </span>
  );
}

export default function Catalogo({ cursosPublicos = [], abrirCurso, abrirCanalProfesor, busqueda = '' }) {
  const [categoriaActiva, setCategoriaActiva] = useState('Todos');

  const cursosFiltrados = cursosPublicos.filter((c) => {
    const porCategoria = categoriaActiva === 'Todos' || c.categoria === categoriaActiva;
    const q = busqueda.trim().toLowerCase();
    const porBusqueda = !q ||
      c.nombre?.toLowerCase().includes(q) ||
      c.descripcion?.toLowerCase().includes(q) ||
      c.autor?.nombre?.toLowerCase().includes(q);
    return porCategoria && porBusqueda;
  });

  return (
    <div className="animate-fade-in select-none font-sans pb-16 space-y-6">

      {/* PAGE HEADER */}
      <div className="flex items-end justify-between pt-1 px-1">
        <div>
          <h1 className="text-2xl font-bold text-[var(--clr-text-primary)] tracking-tight">
            {categoriaActiva === 'Todos' ? 'Explorar cursos' : categoriaActiva}
          </h1>
          <p className="text-sm text-[var(--clr-text-muted)] mt-0.5">
            {cursosFiltrados.length} {cursosFiltrados.length === 1 ? 'curso' : 'cursos'} disponibles
          </p>
        </div>
      </div>

      {/* CATEGORY FILTER */}
      <div className="flex gap-0 border-b border-[var(--clr-border-subtle)] overflow-x-auto scrollbar-none -mb-1">
        {CATEGORIAS.map((cat) => {
          const isActive = categoriaActiva === cat;
          return (
            <button
              key={cat}
              onClick={() => setCategoriaActiva(cat)}
              className={`px-4 py-2.5 text-sm font-medium shrink-0 border-b-2 transition-all whitespace-nowrap
                ${isActive
                  ? 'border-[var(--clr-accent)] text-[var(--clr-accent)]'
                  : 'border-transparent text-[var(--clr-text-muted)] hover:text-[var(--clr-text-primary)] hover:border-[var(--clr-border)]'
                }
              `}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* CARD GRID */}
      {cursosFiltrados.length === 0 ? (
        <div className="min-h-[300px] flex flex-col items-center justify-center border-2 border-dashed rounded-2xl border-[var(--clr-border)] p-8 text-center">
          <GraduationCap size={32} className="mb-3 text-[var(--clr-text-muted)] opacity-40" />
          <p className="text-sm font-semibold text-[var(--clr-text-muted)]">Sin cursos en esta área</p>
          <p className="text-xs text-[var(--clr-text-muted)] mt-1 max-w-xs opacity-70">
            {busqueda ? `No hay resultados para "${busqueda}"` : 'Los docentes aún no han publicado cursos en esta categoría.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {cursosFiltrados.map((curso) => {
            const color = avatarColor(curso.autor?.nombre || '');
            return (
              <div
                key={curso.id}
                onClick={() => abrirCurso?.(curso)}
                className="flex flex-col group cursor-pointer rounded-xl border border-[var(--clr-border-subtle)] bg-[var(--clr-surface)] hover:shadow-md hover:border-[var(--clr-border)] transition-all duration-200 overflow-hidden"
              >
                {/* PORTADA */}
                <div className="w-full aspect-video bg-[var(--clr-surface-elevated)] relative overflow-hidden">
                  {curso.portada_url ? (
                    <img
                      src={curso.portada_url}
                      alt={curso.nombre}
                      className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <GraduationCap size={32} className="text-[var(--clr-text-muted)] opacity-30" />
                    </div>
                  )}

                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <BookOpen size={36} className="text-white drop-shadow-lg" />
                  </div>

                  {/* Premium badge */}
                  {curso.es_premium && (
                    <span className="absolute top-2 left-2 bg-amber-500 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full inline-flex items-center gap-1 shadow">
                      <Lock size={9} /> Premium
                    </span>
                  )}

                  {/* Categoria badge */}
                  {curso.categoria && (
                    <span className="absolute bottom-2 left-2 bg-black/60 text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
                      {curso.categoria}
                    </span>
                  )}
                </div>

                {/* CARD BODY */}
                <div className="p-3 flex gap-2.5 min-w-0 flex-1">
                  {/* Author avatar */}
                  <div
                    className="w-8 h-8 rounded-full font-semibold text-xs flex items-center justify-center text-white shrink-0 mt-0.5 overflow-hidden"
                    style={{ backgroundColor: color }}
                  >
                    {curso.autor?.avatar_url ? (
                      <img src={curso.autor.avatar_url} alt={curso.autor.nombre} className="w-full h-full object-cover" />
                    ) : (
                      (curso.autor?.nombre?.charAt(0) || 'P').toUpperCase()
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    {/* Title */}
                    <h4 className="text-sm font-semibold text-[var(--clr-text-primary)] leading-snug line-clamp-2 group-hover:text-[var(--clr-accent)] transition-colors">
                      {curso.nombre}
                    </h4>

                    {/* Author */}
                    <p
                      onClick={(e) => { e.stopPropagation(); abrirCanalProfesor?.(curso.autor?.id); }}
                      className="text-xs text-[var(--clr-text-muted)] mt-1 hover:text-[var(--clr-accent)] transition-colors inline-block hover:underline"
                    >
                      {curso.autor?.nombre || 'Docente EduVerify'}
                    </p>

                    {/* Stats row */}
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <StarRating value={curso.promedio_estrellas} />
                      <span className="text-[10px] text-[var(--clr-text-muted)] flex items-center gap-0.5">
                        <BookOpen size={9} />
                        {curso.total_lecciones ?? 0} lecciones
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
