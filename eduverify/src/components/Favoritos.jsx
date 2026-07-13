import { Heart, Clapperboard, PlayCircle } from 'lucide-react';
import { favorites as favoritesApi } from '../api';
import { getYoutubeId } from '../utils/youtube';

export default function Favoritos({ favoritos = [], setFavoritos, setVideoSeleccionado }) {

  const handleUnfavorite = (e, video) => {
    e.stopPropagation();
    setFavoritos(prev => prev.filter(f => f.id !== video.id));
    favoritesApi.remove(video.id).catch(() => {});
  };

  return (
    <div className="space-y-6 animate-fade-in select-none pb-16">
      <div className="border-b border-[var(--clr-border-subtle)] pb-4">
        <h1 className="text-2xl font-bold text-[var(--clr-text-primary)] tracking-tight flex items-center gap-2">
          <Heart size={20} className="fill-current text-red-500" /> Favoritos
        </h1>
        <p className="text-sm text-[var(--clr-text-muted)] mt-0.5">
          {favoritos.length} {favoritos.length === 1 ? 'clase guardada' : 'clases guardadas'}
        </p>
      </div>

      {favoritos.length === 0 ? (
        <div className="min-h-[250px] flex flex-col items-center justify-center border-2 border-dashed rounded-2xl border-[var(--clr-border)] p-8 text-center">
          <Heart size={28} className="mb-3 text-[var(--clr-text-muted)] opacity-40" />
          <p className="text-sm font-semibold text-[var(--clr-text-muted)]">Sin favoritos todavía</p>
          <p className="text-xs text-[var(--clr-text-muted)] mt-1 max-w-xs opacity-70">
            Haz clic en el corazón del reproductor para guardar clases aquí.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {favoritos.map((v) => {
            if (!v) return null;
            const ytId = getYoutubeId(v.url_video);
            const thumb = ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : null;

            return (
              <div
                key={v.id}
                onClick={() => setVideoSeleccionado(v)}
                className="flex flex-col group cursor-pointer rounded-xl border border-[var(--clr-border-subtle)] bg-[var(--clr-surface)] hover:shadow-md hover:border-[var(--clr-border)] transition-all duration-200 overflow-hidden"
              >
                <div className="w-full aspect-video bg-[var(--clr-surface-elevated)] relative overflow-hidden">
                  {thumb ? (
                    <img src={thumb} alt={v.titulo} className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500" loading="lazy" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Clapperboard size={24} className="text-[var(--clr-text-muted)] opacity-30" />
                    </div>
                  )}

                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <PlayCircle size={36} className="text-white drop-shadow-lg" />
                  </div>

                  {/* Unfavorite button */}
                  <button
                    onClick={(e) => handleUnfavorite(e, v)}
                    className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-lg shadow-lg hover:bg-red-600 transition-colors"
                    aria-label="Quitar de favoritos"
                  >
                    <Heart size={11} className="fill-current" />
                  </button>

                  {v.duracion && (
                    <span className="absolute bottom-2 right-2 bg-black/75 text-white font-mono text-[10px] px-1.5 py-0.5 rounded font-medium">
                      {v.duracion}
                    </span>
                  )}
                </div>

                <div className="p-3">
                  {v.categoria && (
                    <span className="text-[10px] font-medium text-[var(--clr-accent)] uppercase tracking-wide block mb-1">
                      {v.categoria}
                    </span>
                  )}
                  <h4 className="text-sm font-semibold text-[var(--clr-text-primary)] leading-snug line-clamp-2 group-hover:text-[var(--clr-accent)] transition-colors">
                    {v.titulo}
                  </h4>
                  <p className="text-xs text-[var(--clr-text-muted)] mt-1">{v.autor || 'Docente EduVerify'}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
