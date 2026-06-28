import React from 'react';

export default function Historial({ historial = [], setVideoSeleccionado }) {
  const obtenerYoutubeId = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  return (
    <div className="space-y-6 animate-fade-in select-none">
      <div className="border-b border-gray-200 dark:border-white/[0.04] pb-4">
        <h2 className="text-base font-black uppercase tracking-wider text-blue-500 flex items-center gap-2">
          🕒 Tu Historial de Aprendizaje
        </h2>
        <p className="text-xs text-gray-400 mt-0.5">Registro cronológico de tus últimas video-clases reproducidas.</p>
      </div>

      {historial.length === 0 ? (
        <div className="min-h-[250px] flex flex-col items-center justify-center border border-dashed rounded-3xl border-gray-300 dark:border-white/5 p-6 text-center">
          <span className="text-2xl mb-2 opacity-40">📖</span>
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Tu historial está vacío</p>
          <p className="text-[11px] text-gray-500 mt-1 max-w-xs">Las clases que mires en la plataforma se irán organizando en esta sección automáticamente.</p>
        </div>
      ) : (
        <div className="max-w-4xl space-y-3">
          {historial.map((v, index) => {
            if (!v) return null;
            const ytId = obtenerYoutubeId(v.url_video || v.url);
            const urlMiniatura = ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : null;

            return (
              <div 
                key={v.id || index}
                onClick={() => setVideoSeleccionado(v)}
                className="flex flex-col sm:flex-row items-center gap-4 p-3 rounded-2xl border bg-white dark:bg-gray-900/40 border-gray-200 dark:border-white/5 hover:border-blue-500/30 hover:shadow-md transition-all duration-300 cursor-pointer group"
              >
                {/* Miniatura Pro */}
                <div className="w-full sm:w-44 aspect-video bg-gray-900 rounded-xl overflow-hidden border border-gray-100 dark:border-white/5 shrink-0 relative">
                  {urlMiniatura ? (
                    <img src={urlMiniatura} alt="Portada" className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-900/20 to-gray-950">
                      <span className="text-lg opacity-30">🎬</span>
                    </div>
                  )}
                  <span className="absolute bottom-1.5 right-1.5 bg-black/80 text-white font-mono text-[9px] px-1.5 py-0.2 rounded font-bold">
                    {v.duracion || '12:30'}
                  </span>
                </div>

                {/* Textos */}
                <div className="flex-1 min-w-0 py-1 space-y-1 w-full text-left">
                  <span className="bg-blue-500/10 text-blue-500 text-[8px] font-extrabold px-2 py-0.5 rounded uppercase tracking-wider">
                    {v.categoria || 'General'}
                  </span>
                  <h4 className="text-sm font-black text-gray-900 dark:text-gray-100 truncate uppercase tracking-wide group-hover:text-blue-500 transition-colors mt-1">
                    {v.titulo}
                  </h4>
                  <p className="text-[11px] text-gray-400 font-semibold">{v.autor || 'Docente EduVerify'}</p>
                  <p className="text-[10px] text-gray-400 font-mono flex items-center gap-1">
                    <span>• Visto recientemente</span>
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