import React, { useState, useEffect } from 'react';

export default function Reproductor({ 
  video, 
  usuario, 
  setVista, 
  darkMode, 
  favoritos = [], 
  setFavoritos, 
  abrirCanalProfesor, 
  videosGlobales = [], 
  setVideoSeleccionado,
  suscripciones = [],
  toggleSuscripcion = () => {}
}) {
  // Si no hay video seleccionado
  if (!video) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-gray-500">No se ha seleccionado ninguna video-clase.</p>
        <button 
          onClick={() => setVista('catalogo')} 
          className="mt-4 text-xs font-bold text-blue-500 uppercase"
        >
          Volver al catálogo
        </button>
      </div>
    );
  }

  // Estados principales
  const [localVideo, setLocalVideo] = useState(video);
  const [panelAdmin, setPanelAdmin] = useState(null);
  const [editTitulo, setEditTitulo] = useState(video.titulo);
  const [editDescripcion, setEditDescripcion] = useState(video.descripcion || '');
  const [editCategoria, setEditCategoria] = useState(video.categoria || 'Programación');
  const [copiado, setCopiado] = useState(false);
  const [mostrarModalGuardar, setMostrarModalGuardar] = useState(false);
  const [nombreNuevaCarpeta, setNombreNuevaCarpeta] = useState('');
  const [comentarios, setComentarios] = useState([]);
  const [nuevoComentarioTexto, setNuevoComentarioTexto] = useState('');
  const [idComentarioRespondiendo, setIdComentarioRespondiendo] = useState(null);
  const [textoRespuesta, setTextoRespuesta] = useState('');

  // 📸 Foto de perfil del usuario actual
  const fotoPerfilUsuarioActual = localStorage.getItem(`eduverify_foto_${usuario?.email}`) || '';

  // 📂 Listas guardadas del usuario
  const [misListas, setMisListas] = useState(() => {
    const guardadas = localStorage.getItem(`eduverify_listas_${usuario?.email}`);
    return guardadas ? JSON.parse(guardadas) : { "Clases Guardadas": [] };
  });

  // 🔄 Sincronizar con cambios de video
  useEffect(() => {
    const forosGuardados = localStorage.getItem(`eduverify_foros_video_${video.id}`);
    if (forosGuardados) {
      setComentarios(JSON.parse(forosGuardados));
    } else {
      setComentarios([]); 
    }
    setPanelAdmin(null);
    setLocalVideo(video);
    setEditTitulo(video.titulo);
    setEditDescripcion(video.descripcion || '');
    setEditCategoria(video.categoria || 'Programación');
  }, [video]);

  // 💾 Guardar comentarios
  useEffect(() => {
    if (video?.id) {
      localStorage.setItem(`eduverify_foros_video_${video.id}`, JSON.stringify(comentarios));
    }
  }, [comentarios, video]);

  // 💾 Guardar listas
  useEffect(() => {
    localStorage.setItem(`eduverify_listas_${usuario?.email}`, JSON.stringify(misListas));
  }, [misListas, usuario]);

  // 🎯 Funciones auxiliares
  const obtenerYoutubeId = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const urlFinal = localVideo.url_video || localVideo.url;
  const youtubeId = obtenerYoutubeId(urlFinal);
  const esContenidoEnVivo = localVideo.tipo === 'envivo' || youtubeId !== null;

  // ❤️ Favoritos
  const esFavorito = favoritos.some(f => f.id === localVideo.id);
  const manejarCorazon = () => {
    if (esFavorito) {
      setFavoritos(favoritos.filter(f => f.id !== localVideo.id));
    } else {
      setFavoritos([localVideo, ...favoritos]);
    }
  };

  // 🔗 Compartir
  const manejarCompartir = () => {
    navigator.clipboard.writeText(urlFinal || window.location.href);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2500);
  };

  // 📁 Guardar en carpeta
  const toggleVideoEnCarpeta = (nombreCarpeta) => {
    const listaActual = misListas[nombreCarpeta] || [];
    const existe = listaActual.some(v => v.id === localVideo.id);
    let nuevaLista = existe ? listaActual.filter(v => v.id !== localVideo.id) : [localVideo, ...listaActual];
    setMisListas({ ...misListas, [nombreCarpeta]: nuevaLista });
  };

  const crearNuevaCarpeta = (e) => {
    e.preventDefault();
    if (!nombreNuevaCarpeta.trim()) return;
    if (misListas[nombreNuevaCarpeta.trim()]) return alert("⚠️ Esa carpeta ya existe.");
    setMisListas({ ...misListas, [nombreNuevaCarpeta.trim()]: [localVideo] });
    setNombreNuevaCarpeta('');
  };

  // 💬 Manejo de comentarios
  const handleCrearComentarioRaiz = (e) => {
    e.preventDefault();
    if (!nuevoComentarioTexto.trim()) return;

    const nuevoC = {
      id: Date.now(),
      autor: usuario?.nombre || "Usuario Anónimo",
      email: usuario?.email || "",
      foto: fotoPerfilUsuarioActual, // Usamos la foto del usuario actual
      rol: usuario?.rol || "estudiante",
      texto: nuevoComentarioTexto.trim(),
      fecha: "Hace 1 minuto",
      likes: 0,
      usuariosLiked: [],
      respuestas: []
    };

    setComentarios([nuevoC, ...comentarios]);
    setNuevoComentarioTexto('');
  };

  const handleCrearRespuesta = (e, comentarioId) => {
    e.preventDefault();
    if (!textoRespuesta.trim()) return;

    const nuevaR = {
      id: Date.now(),
      autor: usuario?.nombre || "Usuario Anónimo",
      email: usuario?.email || "",
      rol: usuario?.rol || "estudiante",
      foto: fotoPerfilUsuarioActual, // Usamos la foto del usuario actual
      texto: textoRespuesta.trim(),
      fecha: "Hace 1 minuto",
      likes: 0,
      usuariosLiked: []
    };

    setComentarios(comentarios.map(c => {
      if (c.id === comentarioId) {
        return { ...c, respuestas: [...(c.respuestas || []), nuevaR] };
      }
      return c;
    }));

    setTextoRespuesta('');
    setIdComentarioRespondiendo(null);
  };

  const handleLikeComentario = (comentarioId) => {
    setComentarios(comentarios.map(c => {
      if (c.id === comentarioId) {
        const yaDioLike = c.usuariosLiked?.includes(usuario?.email);
        const nuevosLikes = yaDioLike ? c.likes - 1 : c.likes + 1;
        const nuevosUsuarios = yaDioLike 
          ? (c.usuariosLiked || []).filter(e => e !== usuario?.email)
          : [...(c.usuariosLiked || []), usuario?.email];
        return { ...c, likes: nuevosLikes, usuariosLiked: nuevosUsuarios };
      }
      return c;
    }));
  };

  const handleLikeRespuestaInterna = (comentarioId, respuestaId) => {
    setComentarios(comentarios.map(c => {
      if (c.id === comentarioId) {
        const respuestasActualizadas = c.respuestas.map(r => {
          if (r.id === respuestaId) {
            const yaDioLike = r.usuariosLiked?.includes(usuario?.email);
            const nuevosLikes = yaDioLike ? r.likes - 1 : r.likes + 1;
            const nuevosUsuarios = yaDioLike 
              ? (r.usuariosLiked || []).filter(e => e !== usuario?.email)
              : [...(r.usuariosLiked || []), usuario?.email];
            return { ...r, likes: nuevosLikes, usuariosLiked: nuevosUsuarios };
          }
          return r;
        });
        return { ...c, respuestas: respuestasActualizadas };
      }
      return c;
    }));
  };

  // 📋 Videos sugeridos
  const sugeridos = [...videosGlobales]
    .filter(v => v.id !== localVideo.id)
    .sort((a, b) => {
      const aRelacionado = a.categoria === localVideo.categoria ? 1 : 0;
      const bRelacionado = b.categoria === localVideo.categoria ? 1 : 0;
      return bRelacionado - aRelacionado;
    });

  // 👨‍🏫 Verificar si es dueño del video
  const esDuenoDelVideo = usuario?.rol === 'profesor' && (
    String(localVideo.usuario_id) === String(usuario?.id) || 
    localVideo.autor === usuario?.nombre
  );

  // 📸 Foto del creador del video
  const fotoCreadorVideo = localStorage.getItem(`eduverify_foto_${localVideo.email_autor}`) || '';

  // 🔔 Estado de suscripción
  const estaSuscrito = suscripciones.some(s => s.nombre === localVideo.autor);

  return (
    <div className="animate-fade-in pb-16 select-none relative font-sans">
      
      {/* Botón Volver */}
      <button 
        onClick={() => setVista('catalogo')} 
        className="mb-5 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-blue-500 transition-colors"
      >
        ← Volver al catálogo principal
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* COLUMNA PRINCIPAL */}
        <div className="lg:col-span-2 space-y-5">
          
          {/* REPRODUCTOR */}
          <div className="w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-gray-200 dark:border-white/5 relative">
            {esContenidoEnVivo && youtubeId ? (
              <iframe
                width="100%" height="100%"
                src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0`}
                title={localVideo.titulo} frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen className="w-full h-full object-cover"
              ></iframe>
            ) : (
              <video src={urlFinal} controls autoPlay className="w-full h-full object-cover outline-none" />
            )}
          </div>

          {/* METADATOS */}
          <div className="px-1 text-left">
            <h2 className={`text-base md:text-lg font-black tracking-tight uppercase ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {localVideo.titulo}
            </h2>
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-3 pb-4 border-b border-gray-200 dark:border-white/[0.04]">
              
              {/* Información del autor con botón de suscripción */}
              <div 
                onClick={() => abrirCanalProfesor && abrirCanalProfesor(localVideo.autor)}
                className="flex items-center gap-3 cursor-pointer group select-none flex-wrap"
              >
                <div className="w-10 h-10 rounded-full bg-blue-600 font-black text-white text-sm shadow-md overflow-hidden shrink-0 flex items-center justify-center">
                  {fotoCreadorVideo ? (
                    <img src={fotoCreadorVideo} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span>{localVideo.autor?.charAt(0).toUpperCase() || 'E'}</span>
                  )}
                </div>
                <div>
                  <h4 className="text-xs font-black text-gray-900 dark:text-gray-100 group-hover:text-blue-500 transition-colors">
                    {localVideo.autor || 'Docente EduVerify'}
                  </h4>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">
                    {localVideo.rol === 'estudiante' || localVideo.rol === 'alumno' ? 'Alumno' : 'Docente'}
                  </p>
                </div>

                {/* Botón de Suscripción */}
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleSuscripcion(localVideo.autor);
                  }}
                  className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition ${
                    estaSuscrito ? 'bg-gray-200 text-gray-800' : 'bg-red-600 text-white'
                  }`}
                >
                  {estaSuscrito ? 'Suscrito 🔔' : 'Suscribirse'}
                </button>

                {/* Botón Editar (solo dueño) */}
                {esDuenoDelVideo && (
                  <button 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      setPanelAdmin(panelAdmin === 'editar' ? null : 'editar'); 
                    }} 
                    className={`text-[10px] font-black uppercase tracking-wider px-3.5 py-2 rounded-full transition-all ml-4 ${
                      panelAdmin === 'editar' 
                        ? 'bg-blue-600 text-white' 
                        : darkMode 
                          ? 'bg-white/10 text-gray-200 hover:bg-white/20' 
                          : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                    }`}
                  >
                    Editar Clase
                  </button>
                )}
              </div>

              {/* Acciones */}
              <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-gray-400 self-start sm:self-auto flex-wrap">
                <button 
                  onClick={manejarCorazon} 
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full transition active:scale-95 ${
                    esFavorito 
                      ? 'bg-red-500/10 text-red-500 border border-red-500/20' 
                      : 'bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 hover:opacity-80'
                  }`}
                >
                  {esFavorito ? '❤️ Le encanta' : '🤍 Corazón'}
                </button>
                <button 
                  onClick={manejarCompartir} 
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 hover:opacity-80 relative"
                >
                  <span>↪️ Compartir</span>
                  {copiado && (
                    <span className="absolute -top-9 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-[9px] px-2 py-1 rounded shadow-xl animate-bounce">
                      ¡Copiado!
                    </span>
                  )}
                </button>
                <button 
                  onClick={() => setMostrarModalGuardar(true)} 
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 hover:opacity-80"
                >
                  📥 Guardar
                </button>
              </div>
            </div>

            {/* Descripción */}
            <div className={`mt-4 p-4 rounded-2xl text-xs leading-relaxed ${darkMode ? 'bg-white/[0.02] text-gray-300' : 'bg-gray-100 text-gray-800'}`}>
              <div className="flex gap-3 font-mono text-[10px] font-bold text-gray-400 mb-1.5">
                <span>{localVideo.vistas || '0'} vistas</span>
                <span>•</span>
                <span>{localVideo.fecha_subida || '2026-06-25'}</span>
              </div>
              <p className="font-medium">{localVideo.descripcion || 'Sin descripción adicional para esta clase académica.'}</p>
            </div>
          </div>

          {/* COMENTARIOS */}
          <div className="pt-4 text-left">
            <h3 className="text-xs font-black uppercase tracking-wider text-gray-900 dark:text-white mb-5 flex items-center gap-2">
              Comentarios <span className="text-[10px] font-mono bg-gray-100 dark:bg-white/5 text-gray-400 px-2 py-0.5 rounded-lg">{comentarios.length}</span>
            </h3>

            {/* Input de comentario */}
            <form onSubmit={handleCrearComentarioRaiz} className="flex gap-3.5 mb-6 items-start">
              <div className="w-9 h-9 rounded-full font-bold text-xs flex items-center justify-center text-white shrink-0 shadow-sm overflow-hidden bg-blue-600">
                {fotoPerfilUsuarioActual ? (
                  <img src={fotoPerfilUsuarioActual} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span>{usuario?.nombre?.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div className="flex-1 space-y-2">
                <input
                  type="text" 
                  value={nuevoComentarioTexto} 
                  onChange={(e) => setNuevoComentarioTexto(e.target.value)} 
                  placeholder="Añade un comentario público..."
                  className={`w-full pb-2 pt-1 border-b text-xs outline-none bg-transparent transition focus:border-gray-900 dark:focus:border-white border-gray-200 dark:border-white/10 ${
                    darkMode ? 'text-white' : 'text-black'
                  }`}
                />
                {nuevoComentarioTexto.trim() && (
                  <div className="flex justify-end gap-2 animate-fade-in">
                    <button 
                      type="button" 
                      onClick={() => setNuevoComentarioTexto('')} 
                      className="px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wide text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5"
                    >
                      Cancelar
                    </button>
                    <button 
                      type="submit" 
                      className="px-4 py-1.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-[10px] uppercase tracking-wide transition shadow-sm"
                    >
                      Comentar
                    </button>
                  </div>
                )}
              </div>
            </form>

            {/* Feed de comentarios */}
            <div className="space-y-5">
              {comentarios.map((c) => {
                const yaDioLikeC = c.usuariosLiked?.includes(usuario?.email);
                return (
                  <div key={c.id} className="flex gap-3.5 group relative">
                    <div className="w-9 h-9 rounded-full font-bold text-xs flex items-center justify-center text-white shrink-0 shadow overflow-hidden bg-gray-600">
                      {c.foto ? (
                        <img src={c.foto} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span>{c.autor.charAt(0).toUpperCase()}</span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-black text-gray-900 dark:text-white truncate">{c.autor}</span>
                        <span className="text-[9px] text-gray-400 font-medium font-mono">{c.fecha}</span>
                      </div>
                      
                      <p className="text-xs text-gray-700 dark:text-gray-300 font-medium whitespace-pre-wrap leading-relaxed">{c.texto}</p>

                      <div className="flex items-center gap-4 pt-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                        <button 
                          onClick={() => handleLikeComentario(c.id)} 
                          className={`flex items-center gap-1.5 font-mono hover:text-red-500 ${yaDioLikeC ? 'text-red-500' : ''}`}
                        >
                          {yaDioLikeC ? '❤️' : '🤍'} <span className="text-[11px] font-semibold text-gray-500">{c.likes}</span>
                        </button>
                        <button 
                          onClick={() => setIdComentarioRespondiendo(idComentarioRespondiendo === c.id ? null : c.id)} 
                          className="hover:text-gray-900 dark:hover:text-white"
                        >
                          ↳ Responder
                        </button>
                      </div>

                      {/* Respuesta input */}
                      {idComentarioRespondiendo === c.id && (
                        <form onSubmit={(e) => handleCrearRespuesta(e, c.id)} className="flex gap-3 mt-3 animate-fade-in items-start">
                          <div className="w-7 h-7 rounded-full font-bold text-[10px] flex items-center justify-center text-white shrink-0 overflow-hidden bg-blue-600">
                            {fotoPerfilUsuarioActual ? (
                              <img src={fotoPerfilUsuarioActual} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <span>{usuario?.nombre?.charAt(0).toUpperCase()}</span>
                            )}
                          </div>
                          <div className="flex-1 space-y-2">
                            <input
                              type="text" 
                              required 
                              value={textoRespuesta} 
                              onChange={(e) => setTextoRespuesta(e.target.value)} 
                              placeholder={`Responder a ${c.autor}...`}
                              className={`w-full pb-1.5 text-xs outline-none bg-transparent border-b border-gray-200 dark:border-white/10 ${
                                darkMode ? 'text-white' : 'text-black'
                              }`}
                            />
                          </div>
                        </form>
                      )}

                      {/* Respuestas existentes */}
                      {c.respuestas?.length > 0 && (
                        <div className="mt-3 space-y-3.5 pl-3 border-l-2 border-gray-200 dark:border-white/10">
                          {c.respuestas.map((r) => {
                            const yaDioLikeR = r.usuariosLiked?.includes(usuario?.email);
                            return (
                              <div key={r.id} className="flex gap-2.5 pt-1">
                                <div className="w-6 h-6 rounded-full font-bold text-[10px] flex items-center justify-center text-white shrink-0 overflow-hidden bg-blue-500">
                                  {r.foto ? (
                                    <img src={r.foto} alt="" className="w-full h-full object-cover" />
                                  ) : (
                                    <span>{r.autor.charAt(0).toUpperCase()}</span>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="text-[11px] font-black text-gray-900 dark:text-white truncate">{r.autor}</span>
                                    <span className="text-[9px] text-gray-400 font-mono">{r.fecha}</span>
                                  </div>
                                  <p className="text-xs text-gray-600 dark:text-gray-400 font-medium mt-0.5 leading-relaxed">{r.texto}</p>
                                  
                                  <div className="flex items-center gap-3 pt-1 text-[9px] font-bold uppercase tracking-wider text-gray-400">
                                    <button 
                                      onClick={() => handleLikeRespuestaInterna(c.id, r.id)} 
                                      className={`flex items-center gap-1.5 font-mono hover:text-red-500 ${yaDioLikeR ? 'text-red-500' : ''}`}
                                    >
                                      {yaDioLikeR ? '❤️' : '🤍'} <span className="font-sans font-bold text-gray-500">{r.likes || 0}</span>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* COLUMNA LATERAL - Videos sugeridos */}
        <div className="space-y-4 text-left">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-1">Clases Sugeridas</h3>
          {sugeridos.length === 0 ? (
            <p className="text-[11px] text-gray-400 font-medium italic px-1">No hay más videos sugeridos en este momento.</p>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {sugeridos.map((v) => {
                const ytId = obtenerYoutubeId(v.url_video || v.url);
                const miniatura = ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : null;
                return (
                  <div 
                    key={v.id} 
                    onClick={() => setVideoSeleccionado && setVideoSeleccionado(v)} 
                    className={`p-2 rounded-xl border flex gap-3 cursor-pointer transition-all duration-200 hover:scale-[1.01] ${
                      darkMode 
                        ? 'bg-gray-900/40 border-white/5 hover:bg-gray-900' 
                        : 'bg-white border-gray-200 shadow-sm hover:shadow'
                    }`}
                  >
                    <div className="w-28 aspect-video bg-gray-950 rounded-lg overflow-hidden shrink-0 flex items-center justify-center">
                      {miniatura ? (
                        <img src={miniatura} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-sm opacity-30">🎬</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 space-y-0.5">
                      <h4 className={`text-[11px] font-black uppercase truncate tracking-wide ${
                        darkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        {v.titulo}
                      </h4>
                      <p className="text-[10px] text-gray-400 truncate font-semibold">{v.autor}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* MODAL DE CARPETAS */}
      {mostrarModalGuardar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-fade-in">
          <div className={`w-full max-w-md p-7 rounded-[2rem] border shadow-2xl transition-all duration-300 ${
            darkMode ? 'bg-gray-900 border-white/10 text-white' : 'bg-white border-gray-200 text-gray-900'
          }`}>
            <div className="flex justify-between items-center pb-4 border-b border-gray-100 dark:border-white/5 mb-5">
              <div className="flex items-center gap-2.5">
                <span className="text-xl">📂</span>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-blue-600 dark:text-blue-400">
                    Organizar Asignatura
                  </h3>
                </div>
              </div>
              <button 
                onClick={() => setMostrarModalGuardar(false)} 
                className="w-8 h-8 flex items-center justify-center rounded-xl bg-gray-100 dark:bg-white/5 text-gray-400 hover:text-red-500 font-bold text-sm"
              >
                ✕
              </button>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1 mb-5 scrollbar-none">
              {Object.keys(misListas).map((nombreCarpeta) => {
                const estaGuardado = misListas[nombreCarpeta].some(v => v.id === localVideo.id);
                return (
                  <label 
                    key={nombreCarpeta} 
                    className={`flex items-center gap-3.5 p-3.5 rounded-2xl cursor-pointer transition-all border ${
                      estaGuardado 
                        ? 'bg-blue-600/5 border-blue-500/20 text-blue-600 dark:text-blue-400 font-bold' 
                        : 'bg-transparent border-transparent hover:bg-gray-100 dark:hover:bg-white/5'
                    }`}
                  >
                    <input 
                      type="checkbox" 
                      checked={estaGuardado} 
                      onChange={() => toggleVideoEnCarpeta(nombreCarpeta)} 
                      className="w-5 h-5 rounded-md text-blue-600 border-gray-300 accent-blue-600 cursor-pointer" 
                    />
                    <div className="flex-1 truncate text-xs tracking-wide">
                      <span>{nombreCarpeta}</span>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}