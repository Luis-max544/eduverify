import { History, BookOpen, Clapperboard } from 'lucide-react';
import { getYoutubeId } from '../utils/youtube';

export default function Historial({ historial = [], setVideoSeleccionado }) {
  return (
    <div className="space-y-6 animate-fade-in select-none pb-16">
      <div className="border-b border-[var(--clr-border-subtle)] pb-4">
        <h1 className="text-2xl font-bold text-[var(--clr-text-primary)] tracking-tight flex items-center gap-2">
          <History size={20} className="text-[var(--clr-accent)]" /> Historial
        </h1>
        <p className="text-sm text-[var(--clr-text-muted)] mt-0.5">
          {historial.length} {historial.length === 1 ? 'clase vista' : 'clases vistas'}
        </p>
      </div>

      {historial.length === 0 ? (
        <div className="min-h-[250px] flex flex-col items-center justify-center border-2 border-dashed rounded-2xl border-[var(--clr-border)] p-8 text-center">
          <BookOpen size={28} className="mb-3 text-[var(--clr-text-muted)] opacity-40" />
          <p className="text-sm font-semibold text-[var(--clr-text-muted)]">Historial vacío</p>
          <p className="text-xs text-[var(--clr-text-muted)] mt-1 max-w-xs opacity-70">
            Las clases que mires se registrarán aquí automáticamente.
          </p>
        </div>
      ) : (
        <div className="max-w-5xl space-y-2">
          {historial.map((v, index) => {
            if (!v) return null;
            const ytId = getYoutubeId(v.url_video);
            const thumb = ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : null;

            return (
              <div
                key={v.id || index}
                onClick={() => setVideoSeleccionado(v)}
                className="flex flex-col sm:flex-row items-center gap-4 p-3 rounded-xl border bg-[var(--clr-surface)] border-[var(--clr-border-subtle)] hover:border-[var(--clr-accent)]/30 hover:shadow-sm transition-all duration-200 cursor-pointer group"
              >
                <div className="w-full sm:w-44 aspect-video bg-[var(--clr-surface-elevated)] rounded-lg overflow-hidden shrink-0 relative">
                  {thumb ? (
                    <img src={thumb} alt={v.titulo} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Clapperboard size={22} className="text-[var(--clr-text-muted)] opacity-30" />
                    </div>
                  )}
                  {v.duracion && (
                    <span className="absolute bottom-1.5 right-1.5 bg-black/75 text-white font-mono text-[10px] px-1.5 py-0.5 rounded">
                      {v.duracion}
                    </span>
                  )}
                </div>

                <div className="flex-1 min-w-0 py-1 space-y-1 w-full text-left">
                  {v.categoria && (
                    <span className="text-[10px] font-medium text-[var(--clr-accent)] uppercase tracking-wide">
                      {v.categoria}
                    </span>
                  )}
                  <h4 className="text-sm font-semibold text-[var(--clr-text-primary)] truncate group-hover:text-[var(--clr-accent)] transition-colors mt-0.5">
                    {v.titulo}
                  </h4>
                  <p className="text-xs text-[var(--clr-text-muted)]">{v.autor || 'Docente EduVerify'}</p>
                  <p className="text-xs text-[var(--clr-text-muted)] font-mono">
                    {v.watched_at
                      ? `Visto el ${new Date(v.watched_at).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })}`
                      : 'Visto recientemente'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
