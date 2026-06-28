import React, { useState } from 'react';

export default function Canal({ canal, videosDemo = [], setVista, setVideoSeleccionado, darkMode }) {
  const [pestanaActiva, setPestanaActiva] = useState('VIDEOS');

  const autorNombre = canal?.nombre || 'Docente EduVerify';
  const misVideos = videosDemo.filter(v => v.autor === autorNombre);

  // Cargar de forma dinámica las playlists construidas por este profesor desde localStorage
  const lasPlaylists = (() => {
    const creadas = localStorage.getItem(`eduverify_playlists_creadas_${canal?.email || 'luisma.ge17@gmail.com'}`);
    return creadas ? JSON.parse(creadas) : {
      "Curso Completo React": misVideos.slice(0, 3),
      "Estructuras de Datos": misVideos.slice(2, 5)
    };
  })();

  const obtenerYoutubeId = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  return (
    <div className="space-y-6 animate-fade-in select-none font-sans pb-16 text-left">
      
      {/* BANNER DEL PERFIL PÚBLICO */}
      <div className="w-full h-28 md:h-36 rounded-3xl bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-blue-900/10 dark:to-gray-900/40 border border-gray-200 dark:border-white/5 relative overflow-hidden flex items-center justify-center">
        <span className="text-xl md:text-3xl font-black text-gray-400/40 font-mono tracking-widest uppercase">{autorNombre} Channel</span>
      </div>

      {/* INFORMACIÓN DEL CANAL */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 px-2">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-blue-600 font-black text-white text-2xl flex items-center justify-center shadow-lg shrink-0">
            <span>{autorNombre.charAt(0).toUpperCase()}</span>
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className={`text-lg font-black uppercase tracking-wide ${darkMode ? 'text-white' : 'text-gray-900'}`}>{autorNombre}</h1>
              <span className="bg-blue-500/10 text-blue-500 text-[8px] font-black uppercase px-2 py-0.5 rounded-md tracking-wider border border-blue-500/10">Verificado</span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-gray-400 font-bold font-mono flex-wrap uppercase">
              <span>@docente_utn</span>
              <span>•</span>
              <span>14.2K suscriptores</span>
              <span>•</span>
              <span>{misVideos.length} videos</span>
            </div>
            <p className="text-xs text-gray-400 font-medium">Profesor verificado de EduVerify.</p>
          </div>
        </div>
        <button className="bg-gray-900 text-white dark:bg-white dark:text-gray-950 font-black text-[10px] uppercase tracking-wider px-5 py-2.5 rounded-full shadow-sm">
          Suscrito
        </button>
      </div>

      {/* PESTAÑAS DE COMPONENTES DE YOUTUBE */}
      <div className="flex gap-6 border-b border-gray-200 dark:border-white/[0.04] px-2">
        {['INICIO', 'VIDEOS', 'PLAYLISTS', 'ACERCA DE'].map((tab) => {
          const isActive = pestanaActiva === tab;
          return (
            <button
              key={tab}
              onClick={() => setPestanaActiva(tab)}
              className={`pb-3 text-xs font-black uppercase tracking-wider border-b-2 transition-all
                ${isActive ? 'border-blue-500 text-gray-900 dark:text-white' : 'border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'}`}
            >
              {tab}
            </button>
          );
        })}
      </div>

      {/* 4. RENDERIZADO COMPLETO DE SECCIONES */}
      <div className="px-2">
        
        {/* PESTAÑA A: VIDEOS TRADICIONALES EN RESOLUCIÓN GRID (Fiel a image_ed6316.jpg) */}
        {(pestanaActiva === 'VIDEOS' || pestanaActiva === 'INICIO') && (
          <div className="space-y-4">
            {misVideos.length === 0 ? (
              <p className="text-center py-10 text-xs text-gray-400 uppercase font-mono tracking-wider">Este canal no tiene videos públicos todavía.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 gap-y-7">
                {misVideos.map((v) => {
                  const urlReal = v.url_video || v.url;
                  const ytId = obtenerYoutubeId(urlReal);
                  const miniatura = ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : null;

                  return (
                    <div 
                      key={v.id || Math.random()} 
                      onClick={() => { if (setVideoSeleccionado) setVideoSeleccionado(v); setVista('reproductor'); }}
                      className="flex flex-col gap-2 cursor-pointer group text-left"
                    >
                      <div className="w-full aspect-video bg-gray-900 rounded-xl overflow-hidden relative border border-gray-200/10 shadow-sm">
                        {miniatura ? <img src={miniatura} alt="" className="w-full h-full object-cover group-hover:scale-[1.02] transition duration-300" /> : <div className="text-xl opacity-20">🎬</div>}
                        <span className="absolute bottom-2 right-2 bg-black/80 text-white font-mono text-[9px] px-1.5 py-0.2 rounded font-bold">12:34</span>
                      </div>
                      <div className="space-y-0.5 pr-1">
                        <h4 className={`text-xs font-black uppercase truncate group-hover:text-blue-500 transition-colors ${darkMode ? 'text-white' : 'text-gray-900'}`}>{v.titulo}</h4>
                        <p className="text-[10px] font-mono font-bold text-gray-400 uppercase">{v.vistas || 0} vistas • Hace 2 días</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* PESTAÑA B: CUADRÍCULA DE PLAYLISTS CON OVERLAY DE CARPETA (Fiel a image_ecfdf7.jpg) */}
        {pestanaActiva === 'PLAYLISTS' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {Object.keys(lasPlaylists).map((playlistName) => {
              const videosDeLista = lasPlaylists[playlistName] || [];
              const primerVideo = videosDeLista[0] || {};
              const ytId = obtenerYoutubeId(primerVideo.url_video || primerVideo.url);
              const miniaturaPlaylist = ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : null;

              return (
                <div 
                  key={playlistName}
                  onClick={() => { if (videosDeLista.length > 0) { if(setVideoSeleccionado) setVideoSeleccionado(primerVideo); setVista('reproductor'); } }}
                  className="flex flex-col gap-2 cursor-pointer group text-left"
                >
                  {/* Pila de Carpeta Superpuesta de YouTube */}
                  <div className="w-full aspect-video bg-gray-900 rounded-xl overflow-hidden relative border border-gray-200/10 shadow-md">
                    {miniaturaPlaylist ? (
                      <img src={miniaturaPlaylist} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-blue-900/20 to-gray-950 flex items-center justify-center opacity-30">📁</div>
                    )}

                    {/* Lateral Derecho Translúcido Indicador del Total de Videos */}
                    <div className="absolute right-0 top-0 bottom-0 w-2/5 bg-black/70 backdrop-blur-[4px] flex flex-col items-center justify-center text-white border-l border-white/5 space-y-1">
                      <span className="text-sm">☰</span>
                      <span className="text-[10px] font-black tracking-wider font-mono uppercase">{videosDeLista.length} videos</span>
                    </div>
                  </div>

                  {/* Textos de la Playlist */}
                  <div className="space-y-0.5 px-0.5">
                    <h4 className={`text-xs font-black uppercase tracking-wide truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>{playlistName}</h4>
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Privado • Lista de reproducción</p>
                    <button className="text-[10px] font-bold text-gray-400 hover:text-blue-500 hover:underline block pt-1">Ver playlist completa</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {pestanaActiva === 'ACERCA DE' && (
          <div className={`p-5 rounded-3xl border text-xs leading-relaxed font-medium ${darkMode ? 'bg-gray-900/40 border-white/5 text-gray-300' : 'bg-white border-gray-200 text-gray-600 shadow-sm'}`}>
            <p>Canal oficial administrado por {autorNombre} para la distribución de materiales académicos STEM y Arte en la plataforma EduVerify.</p>
          </div>
        )}

      </div>
    </div>
  );
}