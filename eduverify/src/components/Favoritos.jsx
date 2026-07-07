import React from 'react';
import { Heart, Clapperboard } from 'lucide-react';

export default function Favoritos({ favoritos = [], setVideoSeleccionado }) {
  const obtenerYoutubeId = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  return (
    <div className="space-y-6 animate-fade-in select-none">
      <div className="border-b border-gray-200 dark:border-white/[0.04] pb-4">
        <h2 className="text-base font-black uppercase tracking-wider text-red-500 flex items-center gap-2">
          <Heart size={16} className="fill-current" /> Tus Clases Favoritas
        </h2>
        <p className="text-xs text-gray-400 mt-0.5">Lista guardada de tus asignaturas y recursos predilectos.</p>
      </div>

      {favoritos.length === 0 ? (
        <div className="min-h-[250px] flex flex-col items-center justify-center border border-dashed rounded-3xl border-gray-300 dark:border-white/5 p-6 text-center">
          <Heart size={28} className="mb-2 opacity-40 text-gray-400" />
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Sin favoritos todavía</p>
          <p className="text-[11px] text-gray-500 mt-1 max-w-xs">Haz clic en el botón del "Corazón" dentro del reproductor para coleccionar tus clases aquí.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8">
          {favoritos.map((v) => {
            if (!v) return null;
            const ytId = obtenerYoutubeId(v.url_video);
            const urlMiniatura = ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : null;

            return (
              <div 
                key={v.id} 
                onClick={() => setVideoSeleccionado(v)}
                className="flex flex-col gap-2.5 group cursor-pointer relative"
              >
                {/* Contenedor de Imagen */}
                <div className="w-full aspect-video bg-gray-900 rounded-2xl overflow-hidden border border-gray-200 dark:border-white/5 relative shadow-sm group-hover:shadow-md transition-all duration-300">
                  {urlMiniatura ? (
                    <img src={urlMiniatura} alt={v.titulo} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-red-900/20 to-gray-950 flex items-center justify-center">
                      <Clapperboard size={24} className="opacity-20 text-white" />
                    </div>
                  )}
                  {/* Badge de Corazón Absoluto */}
                  <span className="absolute top-2.5 right-2.5 bg-red-600 text-white p-1.5 rounded-xl shadow-xl">
                    <Heart size={12} className="fill-current" />
                  </span>
                  <span className="absolute bottom-2 right-2 bg-black/80 text-white font-mono text-[9px] px-1.5 py-0.2 rounded font-bold">
                    {v.duracion || '12:30'}
                  </span>
                </div>

                {/* Textos inferiores */}
                <div className="px-1 min-w-0">
                  <h4 className="text-xs font-bold leading-tight line-clamp-2 uppercase tracking-wide group-hover:text-red-500 transition-colors text-gray-900 dark:text-gray-100">
                    {v.titulo}
                  </h4>
                  <p className="text-[10px] text-gray-400 font-semibold mt-1">{v.autor || 'Docente EduVerify'}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}