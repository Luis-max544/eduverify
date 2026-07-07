import React, { useState, useEffect } from 'react';
import {
  ArrowLeft, ArrowRight, GraduationCap, BellRing, Heart, Share2, Bookmark,
  Bot, Reply, Trash2, Check, Clapperboard, FolderOpen, X, Star
} from 'lucide-react';
import { comments as commentsApi, favorites as favoritesApi, playlists as playlistsApi, videos as videosApi, cursos as cursosApi } from '../api';
import TutorIA from './TutorIA';
import { useToast } from './Toast';
import Modal from './Modal';

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
  toggleSuscripcion = () => {},
  cursoActivoId = null,
  abrirLeccionDeCurso = () => {}
}) {
  // Estados principales
  const [localVideo, setLocalVideo] = useState(video);
  const notify = useToast();
  const [panelAdmin, setPanelAdmin] = useState(null);
  const [editTitulo, setEditTitulo] = useState(video?.titulo || '');
  const [editDescripcion, setEditDescripcion] = useState(video?.descripcion || '');
  const [editCategoria, setEditCategoria] = useState(video?.categoria || 'Programación');
  const [copiado, setCopiado] = useState(false);
  const [mostrarModalGuardar, setMostrarModalGuardar] = useState(false);
  const [nombreNuevaCarpeta, setNombreNuevaCarpeta] = useState('');
  const [comentarios, setComentarios] = useState([]);
  const [nuevoComentarioTexto, setNuevoComentarioTexto] = useState('');
  const [idComentarioRespondiendo, setIdComentarioRespondiendo] = useState(null);
  const [textoRespuesta, setTextoRespuesta] = useState('');

  // 🎓 Contexto de curso (cuando la lección se abrió desde un curso)
  const [pestanaPanel, setPestanaPanel] = useState('comentarios');
  const [cursoCtx, setCursoCtx] = useState(null);
  const [progresoCurso, setProgresoCurso] = useState({ inscrito: false, completadas: [], porcentaje: 0 });

  useEffect(() => {
    if (!cursoActivoId) { setCursoCtx(null); return; }
    cursosApi.get(cursoActivoId).then(setCursoCtx).catch(() => setCursoCtx(null));
    cursosApi.progreso(cursoActivoId).then(setProgresoCurso).catch(() => {});
  }, [cursoActivoId]);

  // 📸 Foto de perfil del usuario actual
  const fotoPerfilUsuarioActual = usuario?.avatar_url || '';

  // 📂 Carpetas (playlists) del usuario desde el API
  const [misListas, setMisListas] = useState([]);

  const cargarListas = () => {
    playlistsApi.list().then(setMisListas).catch(() => {});
  };

  const cargarComentarios = (videoId) => {
    commentsApi.list(videoId).then(setComentarios).catch(() => setComentarios([]));
  };

  useEffect(() => {
    cargarListas();
  }, []);

  // 🔄 Sincronizar con cambios de video
  useEffect(() => {
    if (!video) return;
    cargarComentarios(video.id);
    setPanelAdmin(null);
    setLocalVideo(video);
    setEditTitulo(video.titulo);
    setEditDescripcion(video.descripcion || '');
    setEditCategoria(video.categoria || 'Programación');
  }, [video]);

  // Si no hay video seleccionado (después de los hooks, por reglas de React)
  if (!video || !localVideo) {
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

  // 🎯 Funciones auxiliares
  const obtenerYoutubeId = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const urlFinal = localVideo.url_video;
  const youtubeId = obtenerYoutubeId(urlFinal);
  const esContenidoEnVivo = localVideo.tipo === 'envivo' || youtubeId !== null;

  // ❤️ Favoritos (optimista + persistencia en el API)
  const esFavorito = favoritos.some(f => f.id === localVideo.id);
  const manejarCorazon = () => {
    if (esFavorito) {
      setFavoritos(favoritos.filter(f => f.id !== localVideo.id));
      favoritesApi.remove(localVideo.id).catch(() => {});
    } else {
      setFavoritos([localVideo, ...favoritos]);
      favoritesApi.add(localVideo.id).catch(() => {});
    }
  };

  // 🔗 Compartir
  const manejarCompartir = () => {
    navigator.clipboard.writeText(urlFinal || window.location.href);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2500);
  };

  // 📁 Guardar en carpeta (playlists del API)
  const toggleVideoEnCarpeta = async (lista) => {
    const existe = (lista.videos || []).some(v => v.id === localVideo.id);
    try {
      if (existe) {
        await playlistsApi.removeVideo(lista.id, localVideo.id);
      } else {
        await playlistsApi.addVideo(lista.id, localVideo.id);
      }
      cargarListas();
    } catch (err) {
      notify.error(`Error al actualizar la carpeta: ${err.message}`);
    }
  };

  const crearNuevaCarpeta = async (e) => {
    e.preventDefault();
    const nombre = nombreNuevaCarpeta.trim();
    if (!nombre) return;
    if (misListas.some(l => l.nombre === nombre)) return notify.error("Esa carpeta ya existe.");
    try {
      const nueva = await playlistsApi.create(nombre);
      await playlistsApi.addVideo(nueva.id, localVideo.id);
      cargarListas();
      setNombreNuevaCarpeta('');
    } catch (err) {
      notify.error(`Error al crear la carpeta: ${err.message}`);
    }
  };

  // 💬 Manejo de comentarios (persisten en el API)
  const handleCrearComentarioRaiz = async (e) => {
    e.preventDefault();
    if (!nuevoComentarioTexto.trim()) return;
    try {
      await commentsApi.create(localVideo.id, { texto: nuevoComentarioTexto.trim() });
      setNuevoComentarioTexto('');
      cargarComentarios(localVideo.id);
    } catch (err) {
      notify.error(`Error al publicar el comentario: ${err.message}`);
    }
  };

  const handleCrearRespuesta = async (e, comentarioId) => {
    e.preventDefault();
    if (!textoRespuesta.trim()) return;
    try {
      await commentsApi.create(localVideo.id, { texto: textoRespuesta.trim(), parent_id: comentarioId });
      setTextoRespuesta('');
      setIdComentarioRespondiendo(null);
      cargarComentarios(localVideo.id);
    } catch (err) {
      notify.error(`Error al publicar la respuesta: ${err.message}`);
    }
  };

  // El GET público no marca `liked`, así que el estado se actualiza con la respuesta del toggle
  const handleLikeComentario = async (comentarioId) => {
    try {
      const { likes, liked } = await commentsApi.like(comentarioId);
      setComentarios(prev => prev.map(c => c.id === comentarioId ? { ...c, likes, liked } : c));
    } catch (err) {
      console.error('Error al dar like:', err.message);
    }
  };

  const handleLikeRespuestaInterna = async (comentarioId, respuestaId) => {
    try {
      const { likes, liked } = await commentsApi.like(respuestaId);
      setComentarios(prev => prev.map(c => {
        if (c.id !== comentarioId) return c;
        return { ...c, respuestas: (c.respuestas || []).map(r => r.id === respuestaId ? { ...r, likes, liked } : r) };
      }));
    } catch (err) {
      console.error('Error al dar like:', err.message);
    }
  };

  const handleEliminarComentario = async (comentarioId) => {
    if (!window.confirm('¿Eliminar este comentario?')) return;
    try {
      await commentsApi.remove(comentarioId);
      cargarComentarios(localVideo.id);
    } catch (err) {
      notify.error(`Error al eliminar el comentario: ${err.message}`);
    }
  };

  // ✏️ Guardar edición del video (solo dueño); PATCH devuelve fila cruda → refetch
  const handleGuardarEdicion = async (e) => {
    e.preventDefault();
    try {
      await videosApi.update(localVideo.id, {
        titulo: editTitulo,
        descripcion: editDescripcion,
        categoria: editCategoria,
      });
      const actualizado = await videosApi.get(localVideo.id);
      setLocalVideo(actualizado);
      setPanelAdmin(null);
    } catch (err) {
      notify.error(`Error al guardar los cambios: ${err.message}`);
    }
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
  const esDuenoDelVideo = ['profesor', 'creador'].includes(usuario?.rol) &&
    localVideo.autor_id === usuario?.id;

  // 📸 Foto del creador del video
  const fotoCreadorVideo = localVideo.author_avatar_url || '';

  // 🔔 Estado de suscripción
  const estaSuscrito = suscripciones.some(s => s.professor_id === localVideo.autor_id);
  const esPropioCanal = localVideo.autor_id === usuario?.id;

  // 🎓 Datos derivados del curso activo
  const leccionesCurso = cursoCtx?.lecciones || [];
  const completadasSet = new Set(progresoCurso.completadas);
  const leccionCompletada = completadasSet.has(localVideo.id);
  const idxLeccionActual = leccionesCurso.findIndex(l => l.id === localVideo.id);
  const siguienteLeccion = idxLeccionActual >= 0 ? leccionesCurso[idxLeccionActual + 1] : null;

  const toggleLeccionCompletada = async () => {
    if (!cursoActivoId) return;
    try {
      const accion = leccionCompletada ? cursosApi.descompletarLeccion : cursosApi.completarLeccion;
      const { porcentaje } = await accion(cursoActivoId, localVideo.id);
      setProgresoCurso(prev => ({
        ...prev,
        porcentaje,
        completadas: leccionCompletada
          ? prev.completadas.filter(id => id !== localVideo.id)
          : [...prev.completadas, localVideo.id],
      }));
    } catch (err) {
      notify.error(`Error al actualizar el progreso: ${err.message}`);
    }
  };

  return (
    <div className="animate-fade-in pb-16 select-none relative font-sans">
      
      {/* Botón Volver */}
      <button 
        onClick={() => setVista('catalogo')} 
        className="mb-5 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-blue-500 transition-colors"
      >
        <ArrowLeft size={12} /> Volver al catálogo principal
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

          {/* 🎓 BARRA DE CURSO (solo con contexto de curso) */}
          {cursoCtx && (
            <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center gap-3 justify-between ${darkMode ? 'bg-gray-900/40 border-white/5' : 'bg-white border-gray-200 shadow-sm'}`}>
              <div className="min-w-0">
                <p className="text-[9px] font-black uppercase tracking-widest text-blue-500 flex items-center gap-1.5"><GraduationCap size={12} /> {cursoCtx.nombre}</p>
                <p className="text-[10px] text-gray-400 font-mono font-bold uppercase mt-0.5">
                  Lección {idxLeccionActual + 1} de {leccionesCurso.length} • Progreso {progresoCurso.porcentaje}%
                </p>
              </div>
              {progresoCurso.inscrito && (
                <div className="flex gap-2 flex-wrap shrink-0">
                  <button
                    onClick={toggleLeccionCompletada}
                    className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition ${
                      leccionCompletada
                        ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                        : 'bg-blue-600 hover:bg-blue-500 text-white shadow-sm'
                    } inline-flex items-center gap-1.5`}
                  >
                    {leccionCompletada ? <><Check size={12} /> Completada</> : 'Marcar completada'}
                  </button>
                  {siguienteLeccion && (
                    <button
                      onClick={() => abrirLeccionDeCurso(siguienteLeccion, cursoActivoId)}
                      className="px-4 py-2 rounded-full bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 text-[10px] font-black uppercase tracking-widest hover:opacity-80 inline-flex items-center gap-1.5"
                    >
                      Siguiente lección <ArrowRight size={12} />
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* METADATOS */}
          <div className="px-1 text-left">
            <h2 className={`text-base md:text-lg font-black tracking-tight uppercase ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {localVideo.titulo}
              {localVideo.es_premium && (
                <span className="ml-2 bg-amber-500/10 text-amber-500 text-[8px] font-black uppercase px-1.5 py-0.5 rounded inline-flex items-center gap-1 align-middle">
                  <Star size={10} className="fill-current" /> Premium
                </span>
              )}
            </h2>
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-3 pb-4 border-b border-gray-200 dark:border-white/[0.04]">
              
              {/* Información del autor con botón de suscripción */}
              <div
                onClick={() => abrirCanalProfesor && abrirCanalProfesor(localVideo.autor_id)}
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
                    Docente
                  </p>
                </div>

                {/* Botón de Suscripción (oculto en el propio canal) */}
                {!esPropioCanal && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSuscripcion(localVideo.autor_id);
                    }}
                    className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition inline-flex items-center gap-1.5 ${
                      estaSuscrito ? 'bg-gray-200 text-gray-800' : 'bg-red-600 text-white'
                    }`}
                  >
                    {estaSuscrito ? <>Suscrito <BellRing size={12} /></> : 'Suscribirse'}
                  </button>
                )}

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
                  <Heart size={13} className={esFavorito ? 'fill-current' : ''} /> {esFavorito ? 'Le encanta' : 'Corazón'}
                </button>
                <button 
                  onClick={manejarCompartir} 
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 hover:opacity-80 relative"
                >
                  <Share2 size={13} /> <span>Compartir</span>
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
                  <Bookmark size={13} /> Guardar
                </button>
              </div>
            </div>

            {/* Descripción */}
            <div className={`mt-4 p-4 rounded-2xl text-xs leading-relaxed ${darkMode ? 'bg-white/[0.02] text-gray-300' : 'bg-gray-100 text-gray-800'}`}>
              <div className="flex gap-3 font-mono text-[10px] font-bold text-gray-400 mb-1.5">
                <span>{localVideo.vistas || '0'} vistas</span>
                <span>•</span>
                <span>{localVideo.created_at ? new Date(localVideo.created_at).toLocaleDateString() : 'Recién publicado'}</span>
              </div>
              <p className="font-medium">{localVideo.descripcion || 'Sin descripción adicional para esta clase académica.'}</p>
            </div>

            {/* Panel de edición (solo dueño) */}
            {panelAdmin === 'editar' && (
              <form onSubmit={handleGuardarEdicion} className={`mt-4 p-4 rounded-2xl border space-y-3 animate-fade-in ${darkMode ? 'bg-gray-900/40 border-white/10' : 'bg-white border-gray-200 shadow-sm'}`}>
                <h4 className="text-[10px] font-black uppercase tracking-widest text-blue-500">Editar Clase</h4>
                <input
                  type="text" required minLength={3} value={editTitulo} onChange={(e) => setEditTitulo(e.target.value)}
                  placeholder="Título de la clase"
                  className={`w-full rounded-xl px-3 py-2 text-xs outline-none border bg-transparent focus:border-blue-500 ${darkMode ? 'border-white/10 text-white' : 'border-gray-200 text-gray-900'}`}
                />
                <textarea
                  rows={3} value={editDescripcion} onChange={(e) => setEditDescripcion(e.target.value)}
                  placeholder="Descripción"
                  className={`w-full rounded-xl px-3 py-2 text-xs outline-none border bg-transparent focus:border-blue-500 resize-none ${darkMode ? 'border-white/10 text-white' : 'border-gray-200 text-gray-900'}`}
                />
                <select
                  value={editCategoria} onChange={(e) => setEditCategoria(e.target.value)}
                  className={`w-full rounded-xl px-3 py-2 text-xs outline-none border focus:border-blue-500 ${darkMode ? 'bg-gray-900 border-white/10 text-white' : 'bg-white border-gray-200 text-gray-900'}`}
                >
                  {['Programación', 'Ciberseguridad', 'Matemáticas', 'Electrónica', 'Arte'].map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => setPanelAdmin(null)} className="px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wide text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5">Cancelar</button>
                  <button type="submit" className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold uppercase tracking-wide shadow-sm">Guardar cambios</button>
                </div>
              </form>
            )}
          </div>

          {/* COMENTARIOS / TUTOR IA */}
          <div className="pt-4 text-left">
            <div className="flex gap-5 mb-5 border-b border-gray-200 dark:border-white/[0.04]">
              <button
                onClick={() => setPestanaPanel('comentarios')}
                className={`pb-3 text-xs font-black uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 ${
                  pestanaPanel === 'comentarios' ? 'border-blue-500 text-gray-900 dark:text-white' : 'border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
                }`}
              >
                Comentarios <span className="text-[10px] font-mono bg-gray-100 dark:bg-white/5 text-gray-400 px-2 py-0.5 rounded-lg">{comentarios.length}</span>
              </button>
              <button
                onClick={() => setPestanaPanel('tutor')}
                className={`pb-3 text-xs font-black uppercase tracking-wider border-b-2 transition-all ${
                  pestanaPanel === 'tutor' ? 'border-blue-500 text-gray-900 dark:text-white' : 'border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
                } flex items-center gap-1.5`}
              >
                <Bot size={14} /> Tutor IA
              </button>
            </div>

            {pestanaPanel === 'tutor' && <TutorIA video={localVideo} darkMode={darkMode} />}

            {pestanaPanel === 'comentarios' && (
            <>
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
                const yaDioLikeC = Boolean(c.liked);
                return (
                  <div key={c.id} className="flex gap-3.5 group relative">
                    <div className="w-9 h-9 rounded-full font-bold text-xs flex items-center justify-center text-white shrink-0 shadow overflow-hidden bg-gray-600">
                      {c.autor_avatar_url ? (
                        <img src={c.autor_avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span>{c.autor?.charAt(0).toUpperCase()}</span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-black text-gray-900 dark:text-white truncate">{c.autor}</span>
                        <span className="text-[9px] text-gray-400 font-medium font-mono">{c.created_at ? new Date(c.created_at).toLocaleDateString() : ''}</span>
                      </div>

                      <p className="text-xs text-gray-700 dark:text-gray-300 font-medium whitespace-pre-wrap leading-relaxed">{c.texto}</p>

                      <div className="flex items-center gap-4 pt-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                        <button
                          onClick={() => handleLikeComentario(c.id)}
                          className={`flex items-center gap-1.5 font-mono hover:text-red-500 ${yaDioLikeC ? 'text-red-500' : ''}`}
                        >
                          <Heart size={12} className={yaDioLikeC ? 'fill-current' : ''} /> <span className="text-[11px] font-semibold text-gray-500">{c.likes}</span>
                        </button>
                        <button
                          onClick={() => setIdComentarioRespondiendo(idComentarioRespondiendo === c.id ? null : c.id)}
                          className="hover:text-gray-900 dark:hover:text-white flex items-center gap-1"
                        >
                          <Reply size={12} /> Responder
                        </button>
                        {c.user_id === usuario?.id && (
                          <button
                            onClick={() => handleEliminarComentario(c.id)}
                            className="hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1"
                          >
                            <Trash2 size={12} /> Eliminar
                          </button>
                        )}
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
                            const yaDioLikeR = Boolean(r.liked);
                            return (
                              <div key={r.id} className="flex gap-2.5 pt-1">
                                <div className="w-6 h-6 rounded-full font-bold text-[10px] flex items-center justify-center text-white shrink-0 overflow-hidden bg-blue-500">
                                  {r.autor_avatar_url ? (
                                    <img src={r.autor_avatar_url} alt="" className="w-full h-full object-cover" />
                                  ) : (
                                    <span>{r.autor?.charAt(0).toUpperCase()}</span>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="text-[11px] font-black text-gray-900 dark:text-white truncate">{r.autor}</span>
                                    <span className="text-[9px] text-gray-400 font-mono">{r.created_at ? new Date(r.created_at).toLocaleDateString() : ''}</span>
                                  </div>
                                  <p className="text-xs text-gray-600 dark:text-gray-400 font-medium mt-0.5 leading-relaxed">{r.texto}</p>
                                  
                                  <div className="flex items-center gap-3 pt-1 text-[9px] font-bold uppercase tracking-wider text-gray-400">
                                    <button
                                      onClick={() => handleLikeRespuestaInterna(c.id, r.id)}
                                      className={`flex items-center gap-1.5 font-mono hover:text-red-500 ${yaDioLikeR ? 'text-red-500' : ''}`}
                                    >
                                      <Heart size={11} className={yaDioLikeR ? 'fill-current' : ''} /> <span className="font-sans font-bold text-gray-500">{r.likes || 0}</span>
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
            </>
            )}
          </div>
        </div>

        {/* COLUMNA LATERAL - Lecciones del curso o videos sugeridos */}
        <div className="space-y-4 text-left">
          {cursoCtx ? (
            <>
              <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-1 flex items-center gap-1.5"><GraduationCap size={13} /> Lecciones del curso</h3>
              <div className="grid grid-cols-1 gap-2.5">
                {leccionesCurso.map((l, idx) => {
                  const esActual = l.id === localVideo.id;
                  const hecha = completadasSet.has(l.id);
                  const ytIdL = obtenerYoutubeId(l.url_video);
                  const miniaturaL = ytIdL ? `https://img.youtube.com/vi/${ytIdL}/hqdefault.jpg` : null;
                  return (
                    <div
                      key={l.id}
                      onClick={() => !esActual && abrirLeccionDeCurso(l, cursoActivoId)}
                      className={`p-2 rounded-xl border flex gap-3 items-center transition-all ${
                        esActual
                          ? 'border-blue-500/40 bg-blue-600/5 cursor-default'
                          : `cursor-pointer hover:scale-[1.01] ${darkMode ? 'bg-gray-900/40 border-white/5 hover:bg-gray-900' : 'bg-white border-gray-200 shadow-sm hover:shadow'}`
                      }`}
                    >
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-black shrink-0 ${
                        hecha ? 'bg-emerald-500 text-white' : darkMode ? 'bg-white/5 text-gray-400' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {hecha ? <Check size={11} /> : idx + 1}
                      </span>
                      <div className="w-20 aspect-video bg-gray-950 rounded-lg overflow-hidden shrink-0 flex items-center justify-center">
                        {miniaturaL ? <img src={miniaturaL} alt="" className="w-full h-full object-cover" /> : <Clapperboard size={16} className="opacity-30 text-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className={`text-[11px] font-black uppercase truncate tracking-wide ${esActual ? 'text-blue-500' : darkMode ? 'text-white' : 'text-gray-900'}`}>
                          {l.titulo}
                          {l.es_premium && <span className="ml-1.5 text-amber-500 text-[8px] font-black uppercase inline-flex items-center gap-0.5"><Star size={9} className="fill-current" /> Premium</span>}
                        </h4>
                        <p className="text-[9px] text-gray-400 font-mono font-bold uppercase">{l.duracion || '00:00'}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
          <>
          <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-1">Clases Sugeridas</h3>
          {sugeridos.length === 0 ? (
            <p className="text-[11px] text-gray-400 font-medium italic px-1">No hay más videos sugeridos en este momento.</p>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {sugeridos.map((v) => {
                const ytId = obtenerYoutubeId(v.url_video);
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
                        <Clapperboard size={16} className="opacity-30 text-white" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 space-y-0.5">
                      <h4 className={`text-[11px] font-black uppercase truncate tracking-wide ${
                        darkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        {v.titulo}
                        {v.es_premium && <span className="ml-1.5 text-amber-500 text-[8px] font-black uppercase inline-flex items-center gap-0.5"><Star size={9} className="fill-current" /> Premium</span>}
                      </h4>
                      <p className="text-[10px] text-gray-400 truncate font-semibold">{v.autor}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          </>
          )}
        </div>
      </div>

      {/* MODAL DE CARPETAS */}
      <Modal open={mostrarModalGuardar} onClose={() => setMostrarModalGuardar(false)} title="Organizar Asignatura" icon={FolderOpen} darkMode={darkMode} maxWidth="max-w-md">
        <div className="space-y-2 max-h-60 overflow-y-auto pr-1 mb-5 scrollbar-none">
              {misListas.length === 0 && (
                <p className="text-xs italic text-gray-400 px-1">Aún no tienes carpetas. Crea la primera abajo.</p>
              )}
              {misListas.map((lista) => {
                const estaGuardado = (lista.videos || []).some(v => v.id === localVideo.id);
                return (
                  <label
                    key={lista.id}
                    className={`flex items-center gap-3.5 p-3.5 rounded-2xl cursor-pointer transition-all border ${
                      estaGuardado
                        ? 'bg-blue-600/5 border-blue-500/20 text-blue-600 dark:text-blue-400 font-bold'
                        : 'bg-transparent border-transparent hover:bg-gray-100 dark:hover:bg-white/5'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={estaGuardado}
                      onChange={() => toggleVideoEnCarpeta(lista)}
                      className="w-5 h-5 rounded-md text-blue-600 border-gray-300 accent-blue-600 cursor-pointer"
                    />
                    <div className="flex-1 truncate text-xs tracking-wide">
                      <span>{lista.nombre}</span>
                    </div>
                  </label>
                );
              })}
            </div>

            {/* Crear carpeta nueva */}
            <form onSubmit={crearNuevaCarpeta} className="flex gap-2 pt-3 border-t border-gray-100 dark:border-white/5">
              <input
                type="text"
                value={nombreNuevaCarpeta}
                onChange={(e) => setNombreNuevaCarpeta(e.target.value)}
                placeholder="Nombre de la carpeta nueva..."
                className={`flex-1 rounded-xl px-3 py-2 text-xs outline-none border bg-transparent focus:border-blue-500 ${
                  darkMode ? 'border-white/10 text-white' : 'border-gray-200 text-gray-900'
                }`}
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold uppercase tracking-wide shadow-sm"
              >
                + Crear
              </button>
            </form>
      </Modal>
    </div>
  );
}