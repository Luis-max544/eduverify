import { useState } from 'react';
import { Clapperboard, Star, PlayCircle } from 'lucide-react';
import { getYoutubeId } from '../utils/youtube';

// Deterministic avatar color from a string (avoids every avatar being the same blue)
const AVATAR_COLORS = ['#0891B2','#7C3AED','#059669','#D97706','#DC2626','#2563EB','#0D9488'];
function avatarColor(name = '') {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

const CATEGORIAS = ['Todos', 'Programación', 'Ciberseguridad', 'Matemáticas', 'Electrónica', 'Arte'];

export default function Catalogo({ setVideoSeleccionado, videosDemo = [], abrirCanalProfesor, busqueda = '' }) {
  const [categoriaActiva, setCategoriaActiva] = useState('Todos');

  const videosFiltrados = videosDemo.filter((v) => {
    const porCategoria = categoriaActiva === 'Todos' || v.categoria?.toLowerCase() === categoriaActiva.toLowerCase();
    const q = busqueda.trim().toLowerCase();
    const porBusqueda = !q || v.titulo?.toLowerCase().includes(q) || v.autor?.toLowerCase().includes(q);
    return porCategoria && porBusqueda;
  });

  return (
    <div className="animate-fade-in select-none font-sans pb-16 space-y-6">

      {/* PAGE HEADER */}
      <div className="flex items-end justify-between pt-1 px-1">
        <div>
          <h1 className="text-2xl font-bold text-[var(--clr-text-primary)] tracking-tight">
            {categoriaActiva === 'Todos' ? 'Explorar' : categoriaActiva}
          </h1>
          <p className="text-sm text-[var(--clr-text-muted)] mt-0.5">
            {videosFiltrados.length} {videosFiltrados.length === 1 ? 'recurso' : 'recursos'} disponibles
          </p>
        </div>
      </div>

      {/* CATEGORY FILTER — tab style */}
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
      {videosFiltrados.length === 0 ? (
        <div className="min-h-[300px] flex flex-col items-center justify-center border-2 border-dashed rounded-2xl border-[var(--clr-border)] p-8 text-center">
          <Clapperboard size={32} className="mb-3 text-[var(--clr-text-muted)] opacity-40" />
          <p className="text-sm font-semibold text-[var(--clr-text-muted)]">Sin contenido en esta área</p>
          <p className="text-xs text-[var(--clr-text-muted)] mt-1 max-w-xs opacity-70">
            {busqueda ? `No hay resultados para "${busqueda}"` : 'Los docentes aún no han publicado clases en esta categoría.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {videosFiltrados.map((video) => {
            const ytId = getYoutubeId(video.url_video);
            const thumb = ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : null;
            const color = avatarColor(video.autor || '');

            return (
              <div
                key={video.id}
                onClick={() => setVideoSeleccionado(video)}
                className="flex flex-col group cursor-pointer rounded-xl border border-[var(--clr-border-subtle)] bg-[var(--clr-surface)] hover:shadow-md hover:border-[var(--clr-border)] transition-all duration-200 overflow-hidden"
              >
                {/* THUMBNAIL */}
                <div className="w-full aspect-video bg-[var(--clr-surface-elevated)] relative overflow-hidden">
                  {thumb ? (
                    <img
                      src={thumb}
                      alt={video.titulo}
                      className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Clapperboard size={28} className="text-[var(--clr-text-muted)] opacity-30" />
                    </div>
                  )}

                  {/* Play overlay on hover */}
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <PlayCircle size={40} className="text-white drop-shadow-lg" />
                  </div>

                  {/* Duration */}
                  {video.duracion && (
                    <span className="absolute bottom-2 right-2 bg-black/75 text-white font-mono text-[10px] px-1.5 py-0.5 rounded font-medium">
                      {video.duracion}
                    </span>
                  )}

                  {/* Premium badge */}
                  {video.es_premium && (
                    <span className="absolute top-2 left-2 bg-[var(--clr-premium)] text-white text-[10px] font-semibold px-2 py-0.5 rounded-full inline-flex items-center gap-1 shadow">
                      <Star size={9} className="fill-current" /> Premium
                    </span>
                  )}
                </div>

                {/* CARD BODY */}
                <div className="p-3 flex gap-2.5 min-w-0">
                  {/* Author avatar */}
                  <div
                    className="w-8 h-8 rounded-full font-semibold text-xs flex items-center justify-center text-white shrink-0 mt-0.5 overflow-hidden"
                    style={{ backgroundColor: color }}
                  >
                    {video.author_avatar_url ? (
                      <img src={video.author_avatar_url} alt={video.autor} className="w-full h-full object-cover" />
                    ) : (
                      (video.autor?.charAt(0) || 'P').toUpperCase()
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    {/* Category chip */}
                    {video.categoria && (
                      <span className="text-[10px] font-medium text-[var(--clr-accent)] mb-1 block uppercase tracking-wide">
                        {video.categoria}
                      </span>
                    )}

                    {/* Title */}
                    <h4 className="text-sm font-semibold text-[var(--clr-text-primary)] leading-snug line-clamp-2 group-hover:text-[var(--clr-accent)] transition-colors">
                      {video.titulo}
                    </h4>

                    {/* Author */}
                    <p
                      onClick={(e) => { e.stopPropagation(); abrirCanalProfesor?.(video.autor_id); }}
                      className="text-xs text-[var(--clr-text-muted)] mt-1 hover:text-[var(--clr-accent)] transition-colors inline-block hover:underline"
                    >
                      {video.autor || 'Docente EduVerify'}
                    </p>

                    {/* Stats */}
                    <p className="text-xs text-[var(--clr-text-muted)] mt-0.5 font-mono tabular">
                      {video.vistas ?? 0} vistas
                      {video.created_at && ` · ${new Date(video.created_at).toLocaleDateString('es', { month: 'short', year: 'numeric' })}`}
                    </p>
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
