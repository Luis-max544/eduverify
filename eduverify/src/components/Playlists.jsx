import React, { useState, useEffect } from 'react';
import { ArrowLeft, Folder, FolderOpen, Trash2, Clapperboard, PlayCircle } from 'lucide-react';
import { playlists as playlistsApi } from '../api';
import { useToast } from './Toast';
import { getYoutubeId } from '../utils/youtube';
import { useAuth } from '../context/AuthContext';
import { usePlayer } from '../context/PlayerContext';

export default function Playlists() {
  const { usuario } = useAuth();
  const { seleccionarYRegistrarVideo } = usePlayer();

  const [listas, setListas] = useState([]);
  const notify = useToast();
  const [carpetaActivaId, setCarpetaActivaId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => {
    if (!usuario) return;
    playlistsApi.list().then(setListas).catch(() => {});
  }, [usuario?.id]);

  const eliminarCarpeta = async (id) => {
    try {
      await playlistsApi.remove(id);
      setListas(prev => prev.filter(l => l.id !== id));
      setConfirmDelete(null);
    } catch (err) {
      notify.error(`Error al eliminar: ${err.message}`);
    }
  };

  const carpetaActiva = listas.find(l => l.id === carpetaActivaId);

  if (carpetaActiva) {
    const videosDeCarpeta = carpetaActiva.videos || [];
    return (
      <div className="space-y-6 animate-fade-in select-none pb-16">
        <button
          onClick={() => setCarpetaActivaId(null)}
          className="inline-flex items-center gap-2 text-sm text-[var(--clr-text-muted)] hover:text-[var(--clr-accent)] transition-colors"
        >
          <ArrowLeft size={14} /> Volver a carpetas
        </button>

        <div className="border-b border-[var(--clr-border-subtle)] pb-4">
          <h1 className="text-2xl font-bold text-[var(--clr-text-primary)] tracking-tight flex items-center gap-2">
            <Folder size={20} className="text-[var(--clr-accent)]" /> {carpetaActiva.nombre}
          </h1>
          <p className="text-sm text-[var(--clr-text-muted)] mt-0.5">
            {videosDeCarpeta.length} {videosDeCarpeta.length === 1 ? 'clase' : 'clases'}
          </p>
        </div>

        {videosDeCarpeta.length === 0 ? (
          <p className="text-sm text-[var(--clr-text-muted)] italic py-4">Esta carpeta está vacía.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {videosDeCarpeta.map((v) => {
              const ytId = getYoutubeId(v.url_video);
              const thumb = ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : null;
              return (
                <div
                  key={v.id}
                  onClick={() => seleccionarYRegistrarVideo(v)}
                  className="flex flex-col group cursor-pointer rounded-xl border border-[var(--clr-border-subtle)] bg-[var(--clr-surface)] hover:shadow-md hover:border-[var(--clr-border)] transition-all overflow-hidden"
                >
                  <div className="w-full aspect-video bg-[var(--clr-surface-elevated)] relative overflow-hidden">
                    {thumb
                      ? <img src={thumb} alt={v.titulo} className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500" loading="lazy" />
                      : <div className="w-full h-full flex items-center justify-center"><Clapperboard size={22} className="text-[var(--clr-text-muted)] opacity-30" /></div>
                    }
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <PlayCircle size={36} className="text-white drop-shadow-lg" />
                    </div>
                  </div>
                  <div className="p-3">
                    <h4 className="text-sm font-semibold text-[var(--clr-text-primary)] line-clamp-2 group-hover:text-[var(--clr-accent)] transition-colors">
                      {v.titulo}
                    </h4>
                    {v.autor && <p className="text-xs text-[var(--clr-text-muted)] mt-1">{v.autor}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in select-none pb-16">
      <div className="border-b border-[var(--clr-border-subtle)] pb-4">
        <h1 className="text-2xl font-bold text-[var(--clr-text-primary)] tracking-tight flex items-center gap-2">
          <Folder size={20} className="text-[var(--clr-accent)]" /> Guardados
        </h1>
        <p className="text-sm text-[var(--clr-text-muted)] mt-0.5">Colecciones de estudio personalizadas.</p>
      </div>

      {listas.length === 0 ? (
        <div className="min-h-[250px] flex flex-col items-center justify-center border-2 border-dashed rounded-2xl border-[var(--clr-border)] p-8 text-center">
          <Folder size={28} className="mb-3 text-[var(--clr-text-muted)] opacity-40" />
          <p className="text-sm font-semibold text-[var(--clr-text-muted)]">Sin carpetas todavía</p>
          <p className="text-xs text-[var(--clr-text-muted)] mt-1 max-w-xs opacity-70">
            Usa el botón "Guardar" en el reproductor para crear y organizar carpetas.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {listas.map((lista) => {
            const videos = lista.videos || [];
            const numVideos = videos.length;
            const firstYtId = getYoutubeId(videos[0]?.url_video);
            const coverThumb = firstYtId ? `https://img.youtube.com/vi/${firstYtId}/mqdefault.jpg` : null;

            return (
              <div
                key={lista.id}
                onClick={() => setCarpetaActivaId(lista.id)}
                className="flex flex-col group cursor-pointer rounded-xl border border-[var(--clr-border-subtle)] bg-[var(--clr-surface)] hover:shadow-md hover:border-[var(--clr-border)] transition-all overflow-hidden"
              >
                <div className="w-full aspect-video bg-[var(--clr-surface-elevated)] relative overflow-hidden">
                  {coverThumb ? (
                    <img src={coverThumb} alt={lista.nombre} className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500 opacity-80" loading="lazy" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <FolderOpen size={32} className="text-[var(--clr-accent)] opacity-40" />
                    </div>
                  )}

                  <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs font-semibold font-mono px-2 py-0.5 rounded flex items-center gap-1">
                    <Folder size={10} /> {numVideos}
                  </div>

                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setConfirmDelete(lista.id); }}
                    className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-black/60 text-white hover:bg-red-600 transition-colors inline-flex items-center justify-center opacity-0 group-hover:opacity-100 sm:opacity-100"
                    aria-label="Eliminar carpeta"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>

                <div className="p-3">
                  <h4 className="text-sm font-semibold text-[var(--clr-text-primary)] truncate group-hover:text-[var(--clr-accent)] transition-colors">
                    {lista.nombre}
                  </h4>
                  <p className="text-xs text-[var(--clr-text-muted)] mt-0.5">
                    {numVideos} {numVideos === 1 ? 'clase' : 'clases'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setConfirmDelete(null)}>
          <div
            className="w-full max-w-sm p-5 rounded-2xl border shadow-xl bg-[var(--clr-surface)] border-[var(--clr-border)] animate-fade-in"
            onClick={e => e.stopPropagation()}
          >
            <p className="text-sm font-semibold text-[var(--clr-text-primary)] mb-1">¿Eliminar carpeta?</p>
            <p className="text-xs text-[var(--clr-text-muted)] mb-4">Esta acción no se puede deshacer.</p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setConfirmDelete(null)} className="px-4 py-2 text-sm rounded-lg text-[var(--clr-text-muted)] hover:bg-[var(--clr-base)] transition-colors">
                Cancelar
              </button>
              <button onClick={() => eliminarCarpeta(confirmDelete)} className="px-4 py-2 text-sm rounded-lg bg-[var(--clr-danger)] text-white hover:opacity-90 transition-opacity font-medium">
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
