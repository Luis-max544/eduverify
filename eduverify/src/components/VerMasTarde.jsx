import React, { useState, useEffect } from 'react';

export default function VerMasTarde({ setVideoSeleccionado }) {
  const [lista, setLista] = useState([]);

  useEffect(() => {
    // Leer dinámicamente de la lista real del usuario autenticado
    const sesion = localStorage.getItem('usuario_eduverify');
    if (sesion) {
      const user = JSON.parse(sesion);
      const listasGuardadas = localStorage.getItem(`eduverify_listas_${user.email}`);
      if (listasGuardadas) {
        const parsed = JSON.parse(listasGuardadas);
        setLista(parsed["Ver más tarde"] || []);
      }
    }
  }, []);

  const obtenerYoutubeId = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  return (
    <div className="space-y-6 animate-fade-in select-none">
      <div className="border-b border-gray-200 dark:border-white/[0.04] pb-4">
        <h2 className="text-base font-black uppercase tracking-wider text-orange-500 flex items-center gap-2">
          ⏰ Lista: Ver más tarde
        </h2>
        <p className="text-xs text-gray-400 mt-0.5">Clases y ponencias reservadas para tu estudio posterior.</p>
      </div>

      {lista.length === 0 ? (
        <div className="min-h-[250px] flex flex-col items-center justify-center border border-dashed rounded-3xl border-gray-300 dark:border-white/5 p-6 text-center">
          <span className="text-2xl mb-2 opacity-40">⏰</span>
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400">No hay videos pendientes</p>
          <p className="text-[11px] text-gray-500 mt-1 max-w-xs">Agrega videos desde el reproductor para verlos con calma después.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* BANNER IZQUIERDO MINIMALISTA (Reemplazo del reloj falso) */}
          <div className="p-5 rounded-3xl bg-gradient-to-b from-orange-600/10 via-transparent to-transparent border border-orange-500/10 space-y-3">
            <div className="w-full aspect-video rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 flex flex-col items-center justify-center text-white shadow-lg p-4 text-center">
              <span className="text-3xl">📖</span>
              <h3 className="text-sm font-black uppercase tracking-wider mt-2">Pendientes</h3>
            </div>
            <div className="px-1 space-y-1">
              <p className="text-xs font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider">Tu Colección Privada</p>
              <p className="text-[11px] text-gray-400 font-mono">{lista.length} lecciones guardadas</p>
            </div>
          </div>

          {/* LISTADO DERECHO PREMIUM NUMERADO */}
          <div className="lg:col-span-2 space-y-2">
            {lista.map((v, index) => {
              const ytId = obtenerYoutubeId(v.url_video || v.url);
              const urlMiniatura = ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : null;

              return (
                <div 
                  key={v.id || index}
                  onClick={() => setVideoSeleccionado(v)}
                  className="flex items-center gap-4 p-2.5 rounded-2xl border bg-white dark:bg-gray-900/40 border-gray-100 dark:border-white/[0.02] hover:border-orange-500/20 hover:bg-white dark:hover:bg-gray-950 transition cursor-pointer group"
                >
                  <span className="font-mono text-xs font-black text-gray-400 w-4 text-center">
                    {index + 1}
                  </span>
                  
                  <div className="w-24 aspect-video bg-gray-900 rounded-xl overflow-hidden shrink-0 relative">
                    {urlMiniatura ? (
                      <img src={urlMiniatura} alt="Cover" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-950 text-xs">🎬</div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1 text-left">
                    <h4 className="text-xs font-bold text-gray-900 dark:text-gray-100 truncate uppercase tracking-wide group-hover:text-orange-500 transition-colors">
                      {v.titulo}
                    </h4>
                    <p className="text-[10px] text-gray-400 font-medium mt-0.5">{v.autor || 'Docente'}</p>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      )}
    </div>
  );
}