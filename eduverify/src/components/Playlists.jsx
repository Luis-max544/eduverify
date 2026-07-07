import React, { useState, useEffect } from 'react';
import { ArrowLeft, Folder, FolderOpen, X } from 'lucide-react';
import { playlists as playlistsApi } from '../api';

export default function Playlists({ usuario, setVideoSeleccionado }) {
  const [listas, setListas] = useState([]);
  const [carpetaActivaId, setCarpetaActivaId] = useState(null);

  useEffect(() => {
    if (!usuario) return;
    playlistsApi.list().then(setListas).catch(() => {});
  }, [usuario?.id]);

  const eliminarCarpeta = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('¿Eliminar esta carpeta?')) return;
    try {
      await playlistsApi.remove(id);
      setListas(prev => prev.filter(l => l.id !== id));
    } catch (err) {
      alert(`Error al eliminar la carpeta: ${err.message}`);
    }
  };

  const obtenerYoutubeId = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const carpetaActiva = listas.find(l => l.id === carpetaActivaId);

  if (carpetaActiva) {
    const videosDeCarpeta = carpetaActiva.videos || [];
    return (
      <div className="space-y-6 animate-fade-in select-none">
        <button
          onClick={() => setCarpetaActivaId(null)}
          className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-blue-500 transition"
        >
          <ArrowLeft size={12} /> Volver a tus carpetas
        </button>

        <div className="border-b border-gray-200 dark:border-white/[0.04] pb-3">
          <h2 className="text-base font-black uppercase tracking-wider text-blue-500 flex items-center gap-2">
            <Folder size={16} /> Carpeta: {carpetaActiva.nombre}
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">{videosDeCarpeta.length} lecciones archivadas en este módulo.</p>
        </div>

        {videosDeCarpeta.length === 0 ? (
          <p className="text-xs italic text-gray-400 py-4">Esta carpeta está vacía.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-6">
            {videosDeCarpeta.map((v) => {
              const ytId = obtenerYoutubeId(v.url_video);
              const urlMiniatura = ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : null;
              return (
                <div key={v.id} onClick={() => setVideoSeleccionado(v)} className="flex flex-col gap-2 group cursor-pointer">
                  <div className="w-full aspect-video bg-gray-900 rounded-2xl overflow-hidden border border-gray-200 dark:border-white/5 relative">
                    {urlMiniatura ? <img src={urlMiniatura} alt="Cover" className="w-full h-full object-cover group-hover:scale-105 transition duration-500" /> : <div className="w-full h-full bg-gray-950"></div>}
                  </div>
                  <h4 className="text-xs font-bold uppercase truncate tracking-wide text-gray-900 dark:text-gray-100 group-hover:text-blue-500 transition-colors">{v.titulo}</h4>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in select-none">
      <div className="border-b border-gray-200 dark:border-white/[0.04] pb-4">
        <h2 className="text-base font-black uppercase tracking-wider text-blue-500 flex items-center gap-2">
          <Folder size={16} /> Videos Guardados (Tus Carpetas)
        </h2>
        <p className="text-xs text-gray-400 mt-0.5">Módulos y colecciones de estudio organizadas de forma personalizada.</p>
      </div>

      {listas.length === 0 ? (
        <div className="min-h-[250px] flex flex-col items-center justify-center border border-dashed rounded-3xl border-gray-300 dark:border-white/5 p-6 text-center">
          <Folder size={28} className="mb-2 opacity-40 text-gray-400" />
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400">No tienes carpetas aún</p>
          <p className="text-[11px] text-gray-500 mt-1 max-w-xs">Crea nuevas carpetas temáticas usando el botón "Guardar" del reproductor.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {listas.map((lista) => {
            const numVideos = (lista.videos || []).length;

            return (
              <div
                key={lista.id}
                onClick={() => setCarpetaActivaId(lista.id)}
                className="flex flex-col gap-3 group cursor-pointer"
              >
                <div className="w-full aspect-video bg-gradient-to-br from-blue-600/10 to-gray-200 dark:from-blue-900/20 dark:to-gray-900 rounded-2xl border border-gray-200 dark:border-white/5 relative flex items-center justify-center shadow-sm group-hover:shadow-md transition-all duration-300 overflow-hidden">
                  <div className="text-center space-y-1 z-10">
                    <FolderOpen size={32} className="transition-transform group-hover:scale-110 duration-300 text-blue-500/60" />
                  </div>
                  <button
                    type="button"
                    onClick={(e) => eliminarCarpeta(e, lista.id)}
                    className="absolute top-2 left-2 z-20 w-6 h-6 rounded-lg bg-black/60 text-white font-bold opacity-0 group-hover:opacity-100 hover:bg-red-600 transition-all inline-flex items-center justify-center"
                    title="Eliminar carpeta"
                  >
                    <X size={12} />
                  </button>
                  <div className="absolute top-0 right-0 bottom-0 w-1/3 bg-gray-950/80 backdrop-blur-[2px] flex flex-col items-center justify-center text-white border-l border-white/5">
                    <span className="text-sm font-black font-mono">{numVideos}</span>
                    <span className="text-[8px] font-bold uppercase tracking-widest text-gray-400 mt-0.5">Clases</span>
                  </div>
                </div>
                <div className="px-1">
                  <h4 className="text-xs font-black uppercase tracking-wide truncate text-gray-900 dark:text-gray-100 group-hover:text-blue-500 transition-colors">
                    {lista.nombre}
                  </h4>
                  <p className="text-[10px] text-gray-400 font-semibold mt-0.5">Colección de Asignaturas</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
