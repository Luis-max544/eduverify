import React, { useState, useEffect } from 'react';
import { Clapperboard, Folder, ListVideo, GraduationCap, Star } from 'lucide-react';
import { users as usersApi, profesorPlaylists } from '../api';

export default function Canal({ canal, setVideoSeleccionado, darkMode, abrirCurso }) {
  const [pestanaActiva, setPestanaActiva] = useState('VIDEOS');
  const [perfil, setPerfil] = useState(null);
  const [misVideos, setMisVideos] = useState([]);
  const [lasPlaylists, setLasPlaylists] = useState([]);

  useEffect(() => {
    if (!canal?.id) return;
    usersApi.profile(canal.id).then(setPerfil).catch(() => {});
    usersApi.videos(canal.id, { page: 1, limit: 50 }).then(d => setMisVideos(d.items)).catch(() => {});
    profesorPlaylists.publicList(canal.id).then(setLasPlaylists).catch(() => setLasPlaylists([]));
  }, [canal?.id]);

  const autorNombre = perfil?.nombre || 'Docente EduVerify';

  const obtenerYoutubeId = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  return (
    <div className="space-y-6 animate-fade-in select-none font-sans pb-16 text-left">

      {/* BANNER DEL PERFIL PÚBLICO */}
      <div
        className="w-full h-28 md:h-36 rounded-3xl bg-gradient-to-r from-slate-100 via-slate-200 to-slate-100 dark:from-cyan-900/10 dark:to-gray-900/40 border border-gray-200 dark:border-white/5 relative overflow-hidden flex items-center justify-center bg-cover bg-center"
        style={{ backgroundImage: perfil?.banner_url ? `url(${perfil.banner_url})` : 'none' }}
      >
        {!perfil?.banner_url && (
          <span className="text-xl md:text-3xl font-black text-gray-400/40 font-mono tracking-widest uppercase">{autorNombre} Channel</span>
        )}
      </div>

      {/* INFORMACIÓN DEL CANAL */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 px-2">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-cyan-600 font-black text-white text-2xl flex items-center justify-center shadow-lg shrink-0 overflow-hidden">
            {perfil?.avatar_url ? (
              <img src={perfil.avatar_url} alt={autorNombre} className="w-full h-full object-cover" />
            ) : (
              <span>{autorNombre.charAt(0).toUpperCase()}</span>
            )}
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className={`text-lg font-black uppercase tracking-wide ${darkMode ? 'text-white' : 'text-gray-900'}`}>{autorNombre}</h1>
              <span className="bg-cyan-500/10 text-cyan-500 text-[8px] font-black uppercase px-2 py-0.5 rounded-md tracking-wider border border-cyan-500/10">Verificado</span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-gray-400 font-bold font-mono flex-wrap uppercase">
              <span>{perfil?.subscriber_count ?? 0} suscriptores</span>
              <span>•</span>
              <span>{perfil?.video_count ?? misVideos.length} videos</span>
            </div>
            <p className="text-xs text-gray-400 font-medium">Profesor verificado de EduVerify.</p>
          </div>
        </div>
      </div>

      {/* PESTAÑAS DE COMPONENTES DE YOUTUBE */}
      <div className="flex gap-6 border-b border-gray-200 dark:border-white/[0.04] px-2">
        {['INICIO', 'VIDEOS', 'CURSOS', 'ACERCA DE'].map((tab) => {
          const isActive = pestanaActiva === tab;
          return (
            <button
              key={tab}
              onClick={() => setPestanaActiva(tab)}
              className={`pb-3 text-xs font-black uppercase tracking-wider border-b-2 transition-all
                ${isActive ? 'border-cyan-500 text-gray-900 dark:text-white' : 'border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'}`}
            >
              {tab}
            </button>
          );
        })}
      </div>

      {/* RENDERIZADO DE SECCIONES */}
      <div className="px-2">

        {/* PESTAÑA A: VIDEOS DEL CANAL */}
        {(pestanaActiva === 'VIDEOS' || pestanaActiva === 'INICIO') && (
          <div className="space-y-4">
            {misVideos.length === 0 ? (
              <p className="text-center py-10 text-xs text-gray-400 uppercase font-mono tracking-wider">Este canal no tiene videos públicos todavía.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 gap-y-7">
                {misVideos.map((v) => {
                  const ytId = obtenerYoutubeId(v.url_video);
                  const miniatura = ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : null;

                  return (
                    <div
                      key={v.id}
                      onClick={() => setVideoSeleccionado && setVideoSeleccionado(v)}
                      className="flex flex-col gap-2 cursor-pointer group text-left"
                    >
                      <div className="w-full aspect-video bg-gray-900 rounded-xl overflow-hidden relative border border-gray-200/10 shadow-sm">
                        {miniatura ? <img src={miniatura} alt="" className="w-full h-full object-cover group-hover:scale-[1.02] transition duration-300" /> : <div className="w-full h-full flex items-center justify-center"><Clapperboard size={28} className="opacity-20 text-white" /></div>}
                      <span className="absolute bottom-2 right-2 bg-black/80 text-white font-mono text-[9px] px-1.5 py-0.2 rounded font-bold">{v.duracion || '00:00'}</span>
                      {v.es_premium && (
                        <span className="absolute top-2 left-2 bg-amber-500 text-gray-950 text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md shadow-lg inline-flex items-center gap-1">
                          <Star size={9} className="fill-current" /> Premium
                        </span>
                      )}
                    </div>
                      <div className="space-y-0.5 pr-1">
                        <h4 className={`text-xs font-black uppercase truncate group-hover:text-cyan-500 transition-colors ${darkMode ? 'text-white' : 'text-gray-900'}`}>{v.titulo}</h4>
                        <p className="text-[10px] font-mono font-bold text-gray-400 uppercase">{v.vistas || 0} vistas • {v.created_at ? new Date(v.created_at).toLocaleDateString() : ''}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* PESTAÑA B: CURSOS PÚBLICOS DEL PROFESOR */}
        {pestanaActiva === 'CURSOS' && (
          lasPlaylists.length === 0 ? (
            <p className="text-center py-10 text-xs text-gray-400 uppercase font-mono tracking-wider">Este canal no tiene cursos públicos.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {lasPlaylists.map((playlist) => {
                const videosDeLista = playlist.videos || [];
                const primerVideo = videosDeLista[0] || {};
                const ytId = obtenerYoutubeId(primerVideo.url_video);
                const miniaturaPlaylist = ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : null;

                return (
                  <div
                    key={playlist.id}
                    onClick={() => abrirCurso && abrirCurso(playlist.id)}
                    className="flex flex-col gap-2 cursor-pointer group text-left"
                  >
                    <div className="w-full aspect-video bg-gray-900 rounded-xl overflow-hidden relative border border-gray-200/10 shadow-md">
                      {miniaturaPlaylist ? (
                        <img src={miniaturaPlaylist} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-[var(--clr-surface-elevated)] dark:bg-gray-900 flex items-center justify-center"><Folder size={28} className="text-[var(--clr-text-muted)] opacity-40" /></div>
                      )}

                      <div className="absolute right-0 top-0 bottom-0 w-2/5 bg-black/70 backdrop-blur-[4px] flex flex-col items-center justify-center text-white border-l border-white/5 space-y-1">
                        <ListVideo size={16} />
                        <span className="text-[10px] font-black tracking-wider font-mono uppercase">{videosDeLista.length} videos</span>
                      </div>
                    </div>

                    <div className="space-y-0.5 px-0.5">
                      <h4 className={`text-xs font-black uppercase tracking-wide truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>{playlist.nombre}</h4>
                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider inline-flex items-center gap-1">
                        <GraduationCap size={11} /> Curso
                        {playlist.promedio_estrellas != null && (
                          <span className="text-amber-500 normal-case inline-flex items-center gap-0.5"> • <Star size={10} className="fill-current" /> {playlist.promedio_estrellas} ({playlist.total_reviews})</span>
                        )}
                      </p>
                      {playlist.descripcion && (
                        <p className="text-[10px] text-gray-400 font-medium truncate">{playlist.descripcion}</p>
                      )}
                      <button className="text-[10px] font-bold text-gray-400 hover:text-cyan-500 hover:underline block pt-1">Ver curso completo</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )
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
