import React, { useState, useEffect } from 'react';
import {
  ArrowLeft, ArrowRight, GraduationCap, BellRing, Heart, Share2, Bookmark,
  Bot, Reply, Trash2, Check, Clapperboard, FolderOpen, X, Star, FileText, Lock,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import { comments as commentsApi, favorites as favoritesApi, playlists as playlistsApi, videos as videosApi, cursos as cursosApi } from '../api';
import { getYoutubeId } from '../utils/youtube';
import TutorIA from './TutorIA';
import { useToast } from './Toast';
import Modal from './Modal';
import QuizModal from './QuizModal';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '../context/NavigationContext';
import { useSocial } from '../context/SocialContext';
import { usePlayer } from '../context/PlayerContext';
import { useCatalog } from '../context/CatalogContext';

export default function Reproductor() {
  const { usuario, darkMode } = useAuth();
  const { setVista } = useNavigation();
  const { favoritos, setFavoritos, suscripciones, toggleSuscripcion } = useSocial();
  const { videoSeleccionado: video, cursoActivo: cursoActivoId, abrirCanalProfesor, abrirLeccionDeCurso, abrirCurso, seleccionarYRegistrarVideo: setVideoSeleccionado } = usePlayer();
  const { videosDemo: videosGlobales } = useCatalog();

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
  const [pestanaPanel, setPestanaPanel] = useState('descripcion');
  const [cursoCtx, setCursoCtx] = useState(null);
  const [progresoCurso, setProgresoCurso] = useState({ inscrito: false, completadas: [], porcentaje: 0, quizzes_aprobados: [] });
  const [quizModal, setQuizModal] = useState(null);
  const [modalQuizRequerido, setModalQuizRequerido] = useState(false);
  const [confirmReintento, setConfirmReintento] = useState(false);
  const [sidebarCursoAbierto, setSidebarCursoAbierto] = useState(true);
  const [pdfsCurso, setPdfsCurso] = useState([]);

  useEffect(() => {
    if (!cursoActivoId) { setCursoCtx(null); setPdfsCurso([]); return; }
    cursosApi.get(cursoActivoId).then(setCursoCtx).catch(() => setCursoCtx(null));
    cursosApi.progreso(cursoActivoId).then(setProgresoCurso).catch(() => {});
    cursosApi.getPdfs(cursoActivoId).then(setPdfsCurso).catch(() => setPdfsCurso([]));
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
          className="mt-4 text-xs font-bold text-cyan-500 uppercase"
        >
          Volver al catálogo
        </button>
      </div>
    );
  }

  const BASE_API = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  const token = localStorage.getItem('eduverify_token');
  const streamUrl = localVideo.minio_key
    ? `${BASE_API}/api/videos/${localVideo.id}/stream${token ? `?token=${token}` : ''}`
    : null;
  const urlFinal = streamUrl || localVideo.url_video;
  const subtitlesUrl = localVideo.subtitles_key ? `${BASE_API}/api/videos/${localVideo.id}/subtitles` : null;
  const youtubeId = getYoutubeId(localVideo.url_video);
  const esContenidoEnVivo = !localVideo.minio_key && (localVideo.tipo === 'envivo' || youtubeId !== null);
  const eProcesando = localVideo.status === 'uploading';
  const esBloqueadoPremium = localVideo.es_premium && !usuario?.premium && usuario?.id !== (localVideo.usuario_id ?? localVideo.autor_id);

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
  const tienePdf = pdfsCurso.length > 0;
  const puedeUsarTutor = Boolean(usuario?.premium) && tienePdf;

  const leccionesCurso = cursoCtx?.lecciones || [];
  const completadasSet = new Set(progresoCurso.completadas);
  const leccionCompletada = completadasSet.has(localVideo.id);
  const idxLeccionActual = leccionesCurso.findIndex(l => l.id === localVideo.id);
  const siguienteLeccion = idxLeccionActual >= 0 ? leccionesCurso[idxLeccionActual + 1] : null;
  const leccionAnterior = idxLeccionActual > 0 ? leccionesCurso[idxLeccionActual - 1] : null;
  const quizId = leccionesCurso.find(l => l.id === localVideo.id)?.quiz_id ?? null;
  const quizObligatorio = leccionesCurso.find(l => l.id === localVideo.id)?.quiz_obligatorio ?? true;
  const quizzesAprobadosSet = new Set(progresoCurso.quizzes_aprobados ?? []);
  const quizAprobado = !quizId || quizzesAprobadosSet.has(quizId);

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

  // ─── COURSE PLAYER LAYOUT ────────────────────────────────────────────────
  if (cursoActivoId) {
    const volverAlCurso = () => abrirCurso ? abrirCurso(cursoActivoId) : setVista('mis-cursos');

    const playerBlock = esBloqueadoPremium ? (
      <div className="w-full h-full bg-gray-950 flex flex-col items-center justify-center gap-4">
        <Lock size={40} className="text-amber-500 opacity-70" />
        <p className="text-white font-bold text-sm">Contenido exclusivo Premium</p>
        <button onClick={() => setVista('premium')} className="bg-amber-500 text-gray-950 font-black text-xs uppercase tracking-widest px-5 py-2 rounded-full hover:bg-amber-400 transition-colors">Activar Premium</button>
      </div>
    ) : eProcesando ? (
      <div className="w-full h-full bg-gray-950 flex flex-col items-center justify-center gap-3">
        <Clapperboard size={32} className="text-cyan-500 opacity-60 animate-pulse" />
        <p className="text-white font-bold text-sm">Video en procesamiento...</p>
      </div>
    ) : esContenidoEnVivo && youtubeId ? (
      <iframe width="100%" height="100%" src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0`} title={localVideo.titulo} frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen className="w-full h-full" />
    ) : (
      <video src={urlFinal} controls autoPlay className="w-full h-full object-contain outline-none">
        {subtitlesUrl && <track kind="subtitles" src={subtitlesUrl} label="Español" default />}
      </video>
    );

    const primerBloqueadaIdx = leccionesCurso.findIndex((l, idx) => {
      if (idx === 0) return false;
      const prev = leccionesCurso[idx - 1];
      return !completadasSet.has(prev.id) || (prev.quiz_id && (prev.quiz_obligatorio ?? true) && !quizzesAprobadosSet.has(prev.quiz_id));
    });

    return (
      <div className="h-full flex flex-col select-none">

        {/* ── HEADER ── */}
        <header className={`h-14 shrink-0 border-b flex items-center gap-3 px-4 ${darkMode ? 'border-white/[0.06] bg-gray-950' : 'border-gray-200 bg-white'}`}>
          <button
            onClick={volverAlCurso}
            className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 hover:text-cyan-500 transition-colors shrink-0"
          >
            <ArrowLeft size={13} />
            <span className="hidden sm:inline max-w-[180px] truncate">{cursoCtx?.nombre || 'Curso'}</span>
          </button>

          <div className="flex-1 flex items-center gap-3 min-w-0 max-w-sm mx-auto">
            <div className="flex-1 bg-gray-200 dark:bg-white/10 rounded-full h-1.5 overflow-hidden">
              <div className="bg-cyan-500 h-1.5 rounded-full transition-all duration-500" style={{ width: `${progresoCurso.porcentaje}%` }} />
            </div>
            <span className="text-[9px] font-black uppercase tracking-wider text-gray-400 whitespace-nowrap hidden md:block">
              {idxLeccionActual >= 0 ? `${idxLeccionActual + 1}/${leccionesCurso.length}` : ''} • {progresoCurso.porcentaje}%
            </span>
          </div>

          {progresoCurso.inscrito && (
            <button
              onClick={toggleLeccionCompletada}
              className={`shrink-0 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-1.5 transition ${
                leccionCompletada
                  ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                  : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-sm'
              }`}
            >
              {leccionCompletada ? <><Check size={12} /> Completada</> : 'Marcar completada'}
            </button>
          )}
        </header>

        {/* ── BODY ── */}
        <div className="flex flex-1 overflow-hidden relative">

          {/* LEFT — video + tabs */}
          <div className="flex flex-col flex-1 min-w-0 overflow-hidden">

            {/* Video */}
            <div className="w-full bg-black flex-none" style={{ height: 'min(56.25vw, 45vh)' }}>{playerBlock}</div>

            {/* Lesson title */}
            <div className={`shrink-0 px-4 pt-3 pb-2 border-b ${darkMode ? 'border-white/[0.04]' : 'border-gray-100'}`}>
              <h2 className="text-sm font-black tracking-tight text-gray-900 dark:text-white truncate">
                {localVideo.titulo}
                {localVideo.es_premium && <span className="ml-2 bg-amber-500/10 text-amber-500 text-[8px] font-black uppercase px-1.5 py-0.5 rounded inline-flex items-center gap-1 align-middle"><Star size={9} className="fill-current" /> Premium</span>}
              </h2>
            </div>

            {/* Tab bar */}
            <div className={`shrink-0 flex gap-5 px-4 border-b overflow-x-auto ${darkMode ? 'border-white/[0.04]' : 'border-gray-200'}`}>
              <button onClick={() => setPestanaPanel('descripcion')} className={`pb-2.5 pt-2 text-xs font-black uppercase tracking-wider border-b-2 transition-all whitespace-nowrap ${pestanaPanel === 'descripcion' ? 'border-cyan-500 text-gray-900 dark:text-white' : 'border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'}`}>Descripción</button>
              {quizId && <button onClick={() => setPestanaPanel('quiz')} className={`pb-2.5 pt-2 text-xs font-black uppercase tracking-wider border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${pestanaPanel === 'quiz' ? 'border-amber-500 text-gray-900 dark:text-white' : 'border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'}`}><GraduationCap size={13} /> Quiz</button>}
              <button onClick={() => setPestanaPanel('comentarios')} className={`pb-2.5 pt-2 text-xs font-black uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${pestanaPanel === 'comentarios' ? 'border-cyan-500 text-gray-900 dark:text-white' : 'border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'}`}>Comentarios <span className="text-[10px] font-mono bg-gray-100 dark:bg-white/5 text-gray-400 px-1.5 py-0.5 rounded">{comentarios.length}</span></button>
              <button onClick={() => setPestanaPanel('tutor')} className={`pb-2.5 pt-2 text-xs font-black uppercase tracking-wider border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${pestanaPanel === 'tutor' ? 'border-cyan-500 text-gray-900 dark:text-white' : 'border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'}`}><Bot size={13} /> Tutor IA {!puedeUsarTutor && <Lock size={9} className="opacity-40" />}</button>
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-y-auto p-4">
              {pestanaPanel === 'descripcion' && (
                <div className="space-y-3 max-w-2xl">
                  <p className={`text-xs leading-relaxed font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {localVideo.descripcion || 'Sin descripción adicional para esta clase.'}
                  </p>
                  <div className="flex gap-2 flex-wrap pt-1">
                    {(() => { const p = pdfsCurso.find(p => p.video_id === localVideo.id); return p ? <a href={p.url} target="_blank" rel="noreferrer" className="px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-colors inline-flex items-center gap-1"><FileText size={11} /> PDF lección</a> : null; })()}
                    {(() => { const p = pdfsCurso.find(p => p.video_id === null); return p ? <a href={p.url} target="_blank" rel="noreferrer" className="px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-colors inline-flex items-center gap-1"><FileText size={11} /> PDF curso</a> : null; })()}
                  </div>
                  <div className="flex gap-2 flex-wrap pt-1 border-t border-gray-100 dark:border-white/[0.04]">
                    {leccionAnterior && <button onClick={() => abrirLeccionDeCurso(leccionAnterior, cursoActivoId)} className="px-4 py-2 rounded-full bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 text-[10px] font-black uppercase tracking-widest hover:opacity-80 inline-flex items-center gap-1.5"><ArrowLeft size={12} /> Lección anterior</button>}
                    {siguienteLeccion && <button onClick={() => { if (quizId && quizObligatorio && !quizAprobado) { setModalQuizRequerido(true); } else { abrirLeccionDeCurso(siguienteLeccion, cursoActivoId); } }} className="px-4 py-2 rounded-full bg-cyan-600 hover:bg-cyan-500 text-white text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-1.5">Siguiente lección <ArrowRight size={12} /></button>}
                  </div>
                </div>
              )}

              {pestanaPanel === 'quiz' && quizId && (
                <div className="flex flex-col items-center justify-center py-10 gap-4">
                  <GraduationCap size={40} className={`opacity-60 ${quizAprobado ? 'text-emerald-500' : 'text-amber-500'}`} />
                  {!progresoCurso.inscrito ? (
                    <>
                      <p className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Inscríbete al curso</p>
                      <p className="text-xs text-gray-400 text-center max-w-xs">Debes estar inscrito para acceder al quiz de esta lección.</p>
                      <button
                        onClick={async () => { try { await cursosApi.inscribir(cursoActivoId); const p = await cursosApi.progreso(cursoActivoId); setProgresoCurso(p); } catch (e) { notify.error(e.message); } }}
                        className="px-6 py-3 rounded-full bg-cyan-600 hover:bg-cyan-500 text-white font-black text-xs uppercase tracking-widest shadow-sm transition-colors"
                      >Inscribirse al curso</button>
                    </>
                  ) : quizAprobado ? (
                    <>
                      <p className="text-sm font-bold text-emerald-500">✓ Quiz aprobado</p>
                      <button onClick={() => setConfirmReintento(true)} className="px-6 py-3 rounded-full bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 font-black text-xs uppercase tracking-widest hover:opacity-80 transition-opacity">Reintentar</button>
                    </>
                  ) : (
                    <>
                      <p className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Quiz de la lección</p>
                      <button onClick={() => setQuizModal(quizId)} className="px-6 py-3 rounded-full bg-amber-500 text-gray-950 font-black text-xs uppercase tracking-widest hover:bg-amber-400 transition-colors shadow-sm">Comenzar Quiz</button>
                    </>
                  )}
                </div>
              )}

              {pestanaPanel === 'tutor' && (
                !usuario?.premium ? (
                  <div className="flex flex-col items-center justify-center py-10 gap-4">
                    <Bot size={36} className="text-gray-300 dark:text-gray-600" />
                    <p className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Tutor IA — Solo Premium</p>
                    <p className="text-xs text-gray-400 text-center max-w-xs">Activa tu cuenta Premium para acceder al tutor con inteligencia artificial.</p>
                    <button onClick={() => setVista('premium')} className="px-6 py-3 rounded-full bg-amber-500 hover:bg-amber-400 text-gray-950 font-black text-xs uppercase tracking-widest transition-colors shadow-sm">Activar Premium</button>
                  </div>
                ) : !tienePdf ? (
                  <div className="flex flex-col items-center justify-center py-10 gap-4">
                    <FileText size={36} className="text-gray-300 dark:text-gray-600" />
                    <p className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Sin material disponible</p>
                    <p className="text-xs text-gray-400 text-center max-w-xs">El Tutor IA necesita un PDF del curso o lección para poder responder preguntas.</p>
                  </div>
                ) : (
                  <TutorIA video={localVideo} darkMode={darkMode} />
                )
              )}

              {pestanaPanel === 'comentarios' && (
                <>
                <form onSubmit={handleCrearComentarioRaiz} className="flex gap-3 mb-5 items-start max-w-2xl">
                  <div className="w-8 h-8 rounded-full font-bold text-xs flex items-center justify-center text-white shrink-0 overflow-hidden bg-cyan-600">
                    {fotoPerfilUsuarioActual ? <img src={fotoPerfilUsuarioActual} alt="" className="w-full h-full object-cover" /> : <span>{usuario?.nombre?.charAt(0).toUpperCase()}</span>}
                  </div>
                  <div className="flex-1 space-y-2">
                    <input type="text" value={nuevoComentarioTexto} onChange={(e) => setNuevoComentarioTexto(e.target.value)} placeholder="Añade un comentario..." className={`w-full pb-2 border-b text-xs outline-none bg-transparent ${darkMode ? 'border-white/10 text-white' : 'border-gray-200 text-black'}`} />
                    {nuevoComentarioTexto.trim() && (
                      <div className="flex justify-end gap-2">
                        <button type="button" onClick={() => setNuevoComentarioTexto('')} className="px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wide text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5">Cancelar</button>
                        <button type="submit" className="px-4 py-1.5 rounded-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-[10px] uppercase tracking-wide transition shadow-sm">Comentar</button>
                      </div>
                    )}
                  </div>
                </form>
                <div className="space-y-4 max-w-2xl">
                  {comentarios.map((c) => (
                    <div key={c.id} className="flex gap-3 group">
                      <div className="w-8 h-8 rounded-full font-bold text-xs flex items-center justify-center text-white shrink-0 overflow-hidden bg-gray-600">{c.autor_avatar_url ? <img src={c.autor_avatar_url} alt="" className="w-full h-full object-cover" /> : <span>{c.autor?.charAt(0).toUpperCase()}</span>}</div>
                      <div className="flex-1 min-w-0 space-y-0.5">
                        <div className="flex items-center gap-2 flex-wrap"><span className="text-xs font-black text-gray-900 dark:text-white">{c.autor}</span><span className="text-[9px] text-gray-400 font-mono">{c.created_at ? new Date(c.created_at).toLocaleDateString() : ''}</span></div>
                        <p className="text-xs text-gray-700 dark:text-gray-300 font-medium whitespace-pre-wrap">{c.texto}</p>
                        <div className="flex items-center gap-4 pt-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                          <button onClick={() => handleLikeComentario(c.id)} className={`flex items-center gap-1 hover:text-red-500 ${c.liked ? 'text-red-500' : ''}`}><Heart size={11} className={c.liked ? 'fill-current' : ''} /> {c.likes}</button>
                          <button onClick={() => setIdComentarioRespondiendo(idComentarioRespondiendo === c.id ? null : c.id)} className="hover:text-gray-900 dark:hover:text-white flex items-center gap-1"><Reply size={11} /> Responder</button>
                          {c.user_id === usuario?.id && <button onClick={() => handleEliminarComentario(c.id)} className="opacity-0 group-hover:opacity-100 hover:text-red-500 flex items-center gap-1"><Trash2 size={11} /> Eliminar</button>}
                        </div>
                        {idComentarioRespondiendo === c.id && (
                          <form onSubmit={(e) => handleCrearRespuesta(e, c.id)} className="flex gap-2 mt-2">
                            <input type="text" required value={textoRespuesta} onChange={(e) => setTextoRespuesta(e.target.value)} placeholder={`Responder a ${c.autor}...`} className={`flex-1 pb-1 text-xs outline-none bg-transparent border-b ${darkMode ? 'border-white/10 text-white' : 'border-gray-200 text-black'}`} />
                          </form>
                        )}
                        {c.respuestas?.length > 0 && (
                          <div className="mt-2 space-y-2 pl-3 border-l-2 border-gray-200 dark:border-white/10">
                            {c.respuestas.map((r) => (
                              <div key={r.id} className="flex gap-2 pt-1">
                                <div className="w-6 h-6 rounded-full font-bold text-[10px] flex items-center justify-center text-white shrink-0 overflow-hidden bg-cyan-500">{r.autor_avatar_url ? <img src={r.autor_avatar_url} alt="" className="w-full h-full object-cover" /> : <span>{r.autor?.charAt(0).toUpperCase()}</span>}</div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5"><span className="text-[11px] font-black text-gray-900 dark:text-white">{r.autor}</span><span className="text-[9px] text-gray-400 font-mono">{r.created_at ? new Date(r.created_at).toLocaleDateString() : ''}</span></div>
                                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">{r.texto}</p>
                                  <button onClick={() => handleLikeRespuestaInterna(c.id, r.id)} className={`flex items-center gap-1 text-[9px] font-bold text-gray-400 hover:text-red-500 mt-1 ${r.liked ? 'text-red-500' : ''}`}><Heart size={10} className={r.liked ? 'fill-current' : ''} /> {r.likes || 0}</button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                </>
              )}
            </div>
          </div>

          {/* SIDEBAR TOGGLE */}
          <button
            onClick={() => setSidebarCursoAbierto(s => !s)}
            style={{ right: sidebarCursoAbierto ? '320px' : '0' }}
            className={`absolute top-1/2 -translate-y-1/2 z-10 w-5 h-10 flex items-center justify-center transition-all duration-200 ${darkMode ? 'bg-gray-800 border-white/10 text-gray-400 hover:text-white' : 'bg-white border-gray-200 text-gray-400 hover:text-gray-900'} border rounded-l-lg shadow-sm`}
          >
            {sidebarCursoAbierto ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
          </button>

          {/* RIGHT — lesson list */}
          <div className={`shrink-0 border-l overflow-y-auto transition-all duration-200 ${sidebarCursoAbierto ? 'w-80' : 'w-0 overflow-hidden'} ${darkMode ? 'border-white/[0.06]' : 'border-gray-200'}`}>
            <div className="p-3 space-y-3 min-w-80">
              <div className="px-1 pt-1">
                <p className="text-[9px] font-black uppercase tracking-widest text-cyan-500 truncate">{cursoCtx?.nombre}</p>
                <p className="text-[10px] text-gray-400 font-mono font-bold uppercase mt-0.5">{leccionesCurso.length} lecciones • {progresoCurso.porcentaje}% completado</p>
              </div>
              <div className="space-y-1.5">
                {leccionesCurso.map((l, idx) => {
                  const esActual = l.id === localVideo.id;
                  const hecha = completadasSet.has(l.id);
                  const ytIdL = getYoutubeId(l.url_video);
                  const miniaturaL = ytIdL ? `https://img.youtube.com/vi/${ytIdL}/hqdefault.jpg` : null;
                  const bloqueada = primerBloqueadaIdx >= 0 && idx >= primerBloqueadaIdx && !esActual;
                  const quizAprobadoL = l.quiz_id ? quizzesAprobadosSet.has(l.quiz_id) : false;
                  return (
                    <React.Fragment key={l.id}>
                      {idx === primerBloqueadaIdx && primerBloqueadaIdx > 0 && (
                        <div className="flex items-center gap-2 py-1 px-1">
                          <div className="flex-1 h-px bg-gray-200 dark:bg-white/10" />
                          <span className="text-[8px] font-black uppercase tracking-widest text-gray-400 whitespace-nowrap flex items-center gap-1"><Lock size={8} /> Completa anteriores</span>
                          <div className="flex-1 h-px bg-gray-200 dark:bg-white/10" />
                        </div>
                      )}
                      <div
                        onClick={() => !esActual && !bloqueada && abrirLeccionDeCurso(l, cursoActivoId)}
                        className={`p-2 rounded-xl border flex gap-2.5 items-center transition-all ${
                          esActual
                            ? 'border-cyan-500/40 bg-cyan-600/5 cursor-default'
                            : bloqueada
                            ? `cursor-default ${darkMode ? 'bg-gray-900/40 border-white/5' : 'bg-white border-gray-100'}`
                            : `cursor-pointer hover:scale-[1.01] ${darkMode ? 'bg-gray-900/40 border-white/5 hover:bg-gray-900' : 'bg-white border-gray-100 hover:border-gray-200 hover:shadow-sm'}`
                        }`}
                      >
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-black shrink-0 ${hecha ? 'bg-emerald-500 text-white' : darkMode ? 'bg-white/5 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>
                          {hecha ? <Check size={9} /> : idx + 1}
                        </span>
                        <div className="w-16 aspect-video bg-gray-950 rounded-md overflow-hidden shrink-0 flex items-center justify-center">
                          {miniaturaL ? <img src={miniaturaL} alt="" className="w-full h-full object-cover" /> : <Clapperboard size={12} className="opacity-30 text-white" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className={`text-[10px] font-black uppercase leading-tight truncate ${esActual ? 'text-cyan-500' : darkMode ? 'text-white' : 'text-gray-800'}`}>{l.titulo}</h4>
                          <p className="text-[8px] text-gray-400 font-mono font-bold uppercase mt-0.5">{l.duracion || '00:00'}</p>
                          {l.quiz_id && (
                            <span className={`inline-flex items-center gap-0.5 text-[8px] font-black uppercase mt-0.5 ${quizAprobadoL ? 'text-emerald-500' : (l.quiz_obligatorio ?? true) ? 'text-amber-500' : 'text-gray-400'}`}>
                              {quizAprobadoL ? <Check size={7} /> : <GraduationCap size={7} />}
                              {quizAprobadoL ? 'aprobado' : (l.quiz_obligatorio ?? true) ? 'requerido' : 'opcional'}
                            </span>
                          )}
                        </div>
                      </div>
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Modals */}
        <Modal open={modalQuizRequerido} onClose={() => setModalQuizRequerido(false)} title="Quiz requerido" darkMode={darkMode} maxWidth="max-w-sm">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">Debes aprobar el quiz de esta lección antes de continuar a la siguiente.</p>
          <div className="flex gap-3 justify-end">
            <button onClick={() => setModalQuizRequerido(false)} className="px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wide text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5">Cancelar</button>
            <button onClick={() => { setModalQuizRequerido(false); setQuizModal(quizId); }} className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-gray-950 text-[10px] font-black uppercase tracking-wide shadow-sm inline-flex items-center gap-1.5"><GraduationCap size={12} /> Hacer Quiz</button>
          </div>
        </Modal>
        <Modal open={confirmReintento} onClose={() => setConfirmReintento(false)} title="Reintentar quiz" darkMode={darkMode} maxWidth="max-w-sm">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">Ya aprobaste este quiz. ¿Quieres intentarlo de nuevo?</p>
          <div className="flex gap-3 justify-end">
            <button onClick={() => setConfirmReintento(false)} className="px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wide text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5">Cancelar</button>
            <button onClick={() => { setConfirmReintento(false); setQuizModal(quizId); }} className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-gray-950 text-[10px] font-black uppercase tracking-wide shadow-sm inline-flex items-center gap-1.5"><GraduationCap size={12} /> Sí, reintentar</button>
          </div>
        </Modal>
        <QuizModal open={Boolean(quizModal)} onClose={() => setQuizModal(null)} onPass={() => cursosApi.progreso(cursoActivoId).then(setProgresoCurso).catch(() => {})} cursoId={cursoActivoId} quizId={quizModal} darkMode={darkMode} />
      </div>
    );
  }
  // ─── END COURSE PLAYER ──────────────────────────────────────────────────

  // ─── STANDALONE PLAYER LAYOUT ───────────────────────────────────────────────
  return (
    <div className="h-full flex flex-col select-none overflow-hidden">

      {/* ── HEADER ── */}
      <header className={`h-14 shrink-0 border-b flex items-center gap-3 px-4 ${darkMode ? 'border-white/[0.06] bg-gray-950' : 'border-gray-200 bg-white'}`}>
        <button
          onClick={() => setVista('catalogo')}
          className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest text-gray-400 hover:text-cyan-500 transition-colors shrink-0"
        >
          <ArrowLeft size={13} />
          <span className="hidden sm:inline">Catálogo</span>
        </button>

        <div className="flex-1 min-w-0 hidden sm:block">
          <p className={`text-xs font-bold truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {localVideo.titulo}
            {localVideo.es_premium && <span className="ml-2 bg-amber-500/10 text-amber-500 text-[8px] font-black uppercase px-1.5 py-0.5 rounded inline-flex items-center gap-1 align-middle"><Star size={9} className="fill-current" /> Premium</span>}
          </p>
          <p className="text-[10px] text-gray-400 truncate">{localVideo.autor}</p>
        </div>

        <div className="flex items-center gap-1 shrink-0 ml-auto">
          <button
            onClick={manejarCorazon}
            title={esFavorito ? 'Quitar de favoritos' : 'Añadir a favoritos'}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-90 ${esFavorito ? 'bg-red-500/10 text-red-500' : darkMode ? 'text-gray-400 hover:bg-white/10 hover:text-gray-100' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'}`}
          >
            <Heart size={16} className={esFavorito ? 'fill-current' : ''} />
          </button>
          <button
            onClick={manejarCompartir}
            title="Compartir"
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-90 relative ${darkMode ? 'text-gray-400 hover:bg-white/10 hover:text-gray-100' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'}`}
          >
            <Share2 size={16} />
            {copiado && <span className="absolute top-full mt-1.5 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[9px] px-2 py-1 rounded shadow-xl whitespace-nowrap pointer-events-none">¡Copiado!</span>}
          </button>
          <button
            onClick={() => setMostrarModalGuardar(true)}
            title="Guardar en carpeta"
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-90 ${darkMode ? 'text-gray-400 hover:bg-white/10 hover:text-gray-100' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'}`}
          >
            <Bookmark size={16} />
          </button>
        </div>
      </header>

      {/* ── BODY ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* LEFT — video + scrollable info */}
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">

          {/* Video */}
          <div className="w-full bg-black flex-none" style={{ height: 'min(56.25vw, 48vh)' }}>
            {esBloqueadoPremium ? (
              <div className="w-full h-full bg-gray-950 flex flex-col items-center justify-center gap-4">
                <Lock size={40} className="text-amber-500 opacity-70" />
                <p className="text-white font-bold text-sm">Contenido exclusivo Premium</p>
                <button onClick={() => setVista('premium')} className="bg-amber-500 text-gray-950 font-black text-xs uppercase tracking-widest px-6 py-2.5 rounded-full hover:bg-amber-400 transition-colors">Activar Premium</button>
              </div>
            ) : eProcesando ? (
              <div className="w-full h-full bg-gray-950 flex flex-col items-center justify-center gap-3">
                <Clapperboard size={36} className="text-cyan-500 opacity-60 animate-pulse" />
                <p className="text-white font-bold text-sm">Video en procesamiento...</p>
                <p className="text-gray-400 text-[11px]">Estará disponible en unos momentos</p>
              </div>
            ) : esContenidoEnVivo && youtubeId ? (
              <iframe width="100%" height="100%" src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0`} title={localVideo.titulo} frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen className="w-full h-full" />
            ) : (
              <video src={urlFinal} controls autoPlay className="w-full h-full object-contain outline-none">
                {subtitlesUrl && <track kind="subtitles" src={subtitlesUrl} label="Español" default />}
              </video>
            )}
          </div>

          {/* Scrollable content below video */}
          <div className="flex-1 overflow-y-auto">

            {/* Author + meta bar */}
            <div className={`px-5 py-4 border-b ${darkMode ? 'border-white/[0.05]' : 'border-gray-100'}`}>
              <p className={`text-sm font-bold mb-3 sm:hidden ${darkMode ? 'text-white' : 'text-gray-900'}`}>{localVideo.titulo}</p>
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div onClick={() => abrirCanalProfesor && abrirCanalProfesor(localVideo.autor_id)} className="flex items-center gap-3 cursor-pointer group">
                  <div className="w-9 h-9 rounded-full bg-cyan-600 font-black text-white text-sm overflow-hidden shrink-0 flex items-center justify-center">
                    {fotoCreadorVideo ? <img src={fotoCreadorVideo} alt="" className="w-full h-full object-cover" /> : <span>{localVideo.autor?.charAt(0).toUpperCase() || 'E'}</span>}
                  </div>
                  <div>
                    <p className={`text-xs font-bold group-hover:text-cyan-500 transition-colors ${darkMode ? 'text-white' : 'text-gray-900'}`}>{localVideo.autor || 'Docente EduVerify'}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{localVideo.vistas || 0} vistas · {localVideo.created_at ? new Date(localVideo.created_at).toLocaleDateString('es', { year: 'numeric', month: 'short', day: 'numeric' }) : 'Recién publicado'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!esPropioCanal && (
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleSuscripcion(localVideo.autor_id); }}
                      className={`px-4 py-2 rounded-full text-xs font-bold transition-all inline-flex items-center gap-1.5 ${estaSuscrito ? darkMode ? 'bg-white/5 text-gray-400 border border-white/10' : 'bg-gray-100 text-gray-600 border border-gray-200' : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-sm'}`}
                    >
                      {estaSuscrito ? <><BellRing size={13} /> Suscrito</> : 'Suscribirse'}
                    </button>
                  )}
                  {esDuenoDelVideo && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setPanelAdmin(panelAdmin === 'editar' ? null : 'editar'); }}
                      className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${panelAdmin === 'editar' ? 'bg-cyan-600 text-white' : darkMode ? 'bg-white/5 text-gray-300 hover:bg-white/10' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                    >
                      Editar
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Edit panel */}
            {panelAdmin === 'editar' && (
              <form onSubmit={handleGuardarEdicion} className={`mx-5 my-4 p-4 rounded-2xl border space-y-3 ${darkMode ? 'bg-gray-900/40 border-white/10' : 'bg-white border-gray-200 shadow-sm'}`}>
                <h4 className="text-[10px] font-black uppercase tracking-widest text-cyan-500">Editar Clase</h4>
                <input type="text" required minLength={3} value={editTitulo} onChange={(e) => setEditTitulo(e.target.value)} placeholder="Título de la clase" className={`w-full rounded-xl px-3 py-2 text-xs outline-none border bg-transparent focus:border-cyan-500 ${darkMode ? 'border-white/10 text-white' : 'border-gray-200 text-gray-900'}`} />
                <textarea rows={3} value={editDescripcion} onChange={(e) => setEditDescripcion(e.target.value)} placeholder="Descripción" className={`w-full rounded-xl px-3 py-2 text-xs outline-none border bg-transparent focus:border-cyan-500 resize-none ${darkMode ? 'border-white/10 text-white' : 'border-gray-200 text-gray-900'}`} />
                <select value={editCategoria} onChange={(e) => setEditCategoria(e.target.value)} className={`w-full rounded-xl px-3 py-2 text-xs outline-none border focus:border-cyan-500 ${darkMode ? 'bg-gray-900 border-white/10 text-white' : 'bg-white border-gray-200 text-gray-900'}`}>
                  {['Programación', 'Ciberseguridad', 'Matemáticas', 'Electrónica', 'Arte'].map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => setPanelAdmin(null)} className="px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wide text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5">Cancelar</button>
                  <button type="submit" className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-[10px] font-bold uppercase tracking-wide shadow-sm">Guardar cambios</button>
                </div>
              </form>
            )}

            {/* Tab bar — sticky so it anchors while content scrolls */}
            <div className={`flex gap-0 border-b px-5 overflow-x-auto sticky top-0 z-10 ${darkMode ? 'border-white/[0.05] bg-gray-950' : 'border-gray-100 bg-white'}`}>
              <button onClick={() => setPestanaPanel('descripcion')} className={`pb-3 pt-3 mr-5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all whitespace-nowrap ${pestanaPanel === 'descripcion' ? 'border-cyan-500 text-gray-900 dark:text-white' : 'border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'}`}>Descripción</button>
              {quizId && <button onClick={() => setPestanaPanel('quiz')} className={`pb-3 pt-3 mr-5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${pestanaPanel === 'quiz' ? 'border-amber-500 text-gray-900 dark:text-white' : 'border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'}`}><GraduationCap size={13} /> Quiz</button>}
              <button onClick={() => setPestanaPanel('comentarios')} className={`pb-3 pt-3 mr-5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${pestanaPanel === 'comentarios' ? 'border-cyan-500 text-gray-900 dark:text-white' : 'border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'}`}>
                Comentarios
                {comentarios.length > 0 && <span className="text-[10px] bg-gray-100 dark:bg-white/5 text-gray-400 px-1.5 py-0.5 rounded">{comentarios.length}</span>}
              </button>
              <button onClick={() => setPestanaPanel('tutor')} className={`pb-3 pt-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${pestanaPanel === 'tutor' ? 'border-cyan-500 text-gray-900 dark:text-white' : 'border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'}`}><Bot size={13} /> Tutor IA {!puedeUsarTutor && <Lock size={9} className="opacity-40" />}</button>
            </div>

            {/* Tab content */}
            <div className="p-5 max-w-2xl">
              {pestanaPanel === 'descripcion' && (
                <div className="space-y-4">
                  <p className={`text-sm leading-relaxed ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {localVideo.descripcion || 'Sin descripción adicional para esta clase académica.'}
                  </p>
                  {cursoCtx && progresoCurso.inscrito && (
                    <div className={`p-4 rounded-2xl border space-y-3 mt-4 ${darkMode ? 'bg-gray-900/40 border-white/5' : 'bg-gray-50 border-gray-200'}`}>
                      <p className="text-[9px] font-black uppercase tracking-widest text-cyan-500 flex items-center gap-1.5"><GraduationCap size={12} /> {cursoCtx.nombre}</p>
                      <p className="text-[10px] text-gray-400 font-mono font-bold uppercase">Lección {idxLeccionActual + 1} de {leccionesCurso.length} • {progresoCurso.porcentaje}% completado</p>
                      <div className="w-full bg-gray-200 dark:bg-white/10 rounded-full h-1.5"><div className="bg-cyan-500 h-1.5 rounded-full transition-all" style={{ width: `${progresoCurso.porcentaje}%` }} /></div>
                      <div className="flex gap-2 flex-wrap">
                        <button onClick={toggleLeccionCompletada} className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition inline-flex items-center gap-1.5 ${leccionCompletada ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-sm'}`}>{leccionCompletada ? <><Check size={12} /> Completada</> : 'Marcar completada'}</button>
                        {(() => { const pdfL = pdfsCurso.find(p => p.video_id === localVideo.id); return pdfL ? <a href={pdfL.url} target="_blank" rel="noreferrer" className="px-4 py-2 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-colors inline-flex items-center gap-1.5"><FileText size={12} /> PDF lección</a> : null; })()}
                        {(() => { const pdfC = pdfsCurso.find(p => p.video_id === null); return pdfC ? <a href={pdfC.url} target="_blank" rel="noreferrer" className="px-4 py-2 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-colors inline-flex items-center gap-1.5"><FileText size={12} /> PDF curso</a> : null; })()}
                        {leccionAnterior && <button onClick={() => abrirLeccionDeCurso(leccionAnterior, cursoActivoId)} className="px-4 py-2 rounded-full bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 text-[10px] font-black uppercase tracking-widest hover:opacity-80 inline-flex items-center gap-1.5"><ArrowLeft size={12} /> Anterior</button>}
                        {siguienteLeccion && <button onClick={() => { if (quizId && quizObligatorio && !quizAprobado) { setModalQuizRequerido(true); } else { abrirLeccionDeCurso(siguienteLeccion, cursoActivoId); } }} className="px-4 py-2 rounded-full bg-cyan-600 hover:bg-cyan-500 text-white text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-1.5">Siguiente <ArrowRight size={12} /></button>}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {pestanaPanel === 'quiz' && quizId && (
                <div className="flex flex-col items-center justify-center py-10 gap-4">
                  <GraduationCap size={40} className={`opacity-60 ${quizAprobado ? 'text-emerald-500' : 'text-amber-500'}`} />
                  {!progresoCurso.inscrito ? (
                    <>
                      <p className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Inscríbete al curso</p>
                      <p className="text-xs text-gray-400 text-center max-w-xs">Debes estar inscrito para acceder al quiz de esta lección.</p>
                      <button onClick={async () => { try { await cursosApi.inscribir(cursoActivoId); const p = await cursosApi.progreso(cursoActivoId); setProgresoCurso(p); } catch (e) { notify.error(e.message); } }} className="px-6 py-3 rounded-full bg-cyan-600 hover:bg-cyan-500 text-white font-black text-xs uppercase tracking-widest shadow-sm transition-colors">Inscribirse al curso</button>
                    </>
                  ) : quizAprobado ? (
                    <>
                      <p className="text-sm font-bold text-emerald-500">✓ Quiz aprobado</p>
                      <button onClick={() => setConfirmReintento(true)} className="px-6 py-3 rounded-full bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 font-black text-xs uppercase tracking-widest hover:opacity-80 transition-opacity">Reintentar</button>
                    </>
                  ) : (
                    <>
                      <p className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Quiz de la lección</p>
                      <button onClick={() => setQuizModal(quizId)} className="px-6 py-3 rounded-full bg-amber-500 text-gray-950 font-black text-xs uppercase tracking-widest hover:bg-amber-400 transition-colors shadow-sm">Comenzar Quiz</button>
                    </>
                  )}
                </div>
              )}

              {pestanaPanel === 'tutor' && (
                !usuario?.premium ? (
                  <div className="flex flex-col items-center justify-center py-10 gap-4">
                    <Bot size={36} className="text-gray-300 dark:text-gray-600" />
                    <p className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Tutor IA — Solo Premium</p>
                    <p className="text-xs text-gray-400 text-center max-w-xs">Activa tu cuenta Premium para acceder al tutor con inteligencia artificial.</p>
                    <button onClick={() => setVista('premium')} className="px-6 py-3 rounded-full bg-amber-500 hover:bg-amber-400 text-gray-950 font-black text-xs uppercase tracking-widest transition-colors shadow-sm">Activar Premium</button>
                  </div>
                ) : !tienePdf ? (
                  <div className="flex flex-col items-center justify-center py-10 gap-4">
                    <FileText size={36} className="text-gray-300 dark:text-gray-600" />
                    <p className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Sin material disponible</p>
                    <p className="text-xs text-gray-400 text-center max-w-xs">El Tutor IA necesita un PDF del curso o lección para poder responder preguntas.</p>
                  </div>
                ) : (
                  <TutorIA video={localVideo} darkMode={darkMode} />
                )
              )}

              {pestanaPanel === 'comentarios' && (
                <>
                  <form onSubmit={handleCrearComentarioRaiz} className="flex gap-3 mb-6 items-start">
                    <div className="w-8 h-8 rounded-full font-bold text-xs flex items-center justify-center text-white shrink-0 overflow-hidden bg-cyan-600">
                      {fotoPerfilUsuarioActual ? <img src={fotoPerfilUsuarioActual} alt="" className="w-full h-full object-cover" /> : <span>{usuario?.nombre?.charAt(0).toUpperCase()}</span>}
                    </div>
                    <div className="flex-1 space-y-2">
                      <input type="text" value={nuevoComentarioTexto} onChange={(e) => setNuevoComentarioTexto(e.target.value)} placeholder="Añade un comentario público..." className={`w-full pb-2 border-b text-xs outline-none bg-transparent transition ${darkMode ? 'border-white/10 text-white focus:border-white/30' : 'border-gray-200 text-black focus:border-gray-400'}`} />
                      {nuevoComentarioTexto.trim() && (
                        <div className="flex justify-end gap-2">
                          <button type="button" onClick={() => setNuevoComentarioTexto('')} className="px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wide text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5">Cancelar</button>
                          <button type="submit" className="px-4 py-1.5 rounded-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-[10px] uppercase tracking-wide transition shadow-sm">Comentar</button>
                        </div>
                      )}
                    </div>
                  </form>
                  <div className="space-y-5">
                    {comentarios.map((c) => {
                      const yaDioLikeC = Boolean(c.liked);
                      return (
                        <div key={c.id} className="flex gap-3 group">
                          <div className="w-8 h-8 rounded-full font-bold text-xs flex items-center justify-center text-white shrink-0 overflow-hidden bg-gray-600">{c.autor_avatar_url ? <img src={c.autor_avatar_url} alt="" className="w-full h-full object-cover" /> : <span>{c.autor?.charAt(0).toUpperCase()}</span>}</div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2"><span className="text-xs font-bold text-gray-900 dark:text-white">{c.autor}</span><span className="text-[10px] text-gray-400">{c.created_at ? new Date(c.created_at).toLocaleDateString() : ''}</span></div>
                            <p className="text-xs text-gray-700 dark:text-gray-300 mt-1 leading-relaxed whitespace-pre-wrap">{c.texto}</p>
                            <div className="flex items-center gap-4 mt-2 text-[11px] text-gray-400">
                              <button onClick={() => handleLikeComentario(c.id)} className={`flex items-center gap-1.5 hover:text-red-500 transition-colors ${yaDioLikeC ? 'text-red-500' : ''}`}><Heart size={12} className={yaDioLikeC ? 'fill-current' : ''} /> {c.likes}</button>
                              <button onClick={() => setIdComentarioRespondiendo(idComentarioRespondiendo === c.id ? null : c.id)} className="hover:text-gray-900 dark:hover:text-white flex items-center gap-1"><Reply size={12} /> Responder</button>
                              {c.user_id === usuario?.id && <button onClick={() => handleEliminarComentario(c.id)} className="opacity-0 group-hover:opacity-100 hover:text-red-500 flex items-center gap-1 transition-opacity"><Trash2 size={12} /> Eliminar</button>}
                            </div>
                            {idComentarioRespondiendo === c.id && (
                              <form onSubmit={(e) => handleCrearRespuesta(e, c.id)} className="flex gap-2 mt-3">
                                <input type="text" required value={textoRespuesta} onChange={(e) => setTextoRespuesta(e.target.value)} placeholder={`Responder a ${c.autor}...`} className={`flex-1 pb-1.5 text-xs outline-none bg-transparent border-b ${darkMode ? 'border-white/10 text-white' : 'border-gray-200 text-black'}`} />
                              </form>
                            )}
                            {c.respuestas?.length > 0 && (
                              <div className="mt-3 pl-3 border-l-2 border-gray-200 dark:border-white/10 space-y-3">
                                {c.respuestas.map((r) => {
                                  const yaDioLikeR = Boolean(r.liked);
                                  return (
                                    <div key={r.id} className="flex gap-2 pt-1">
                                      <div className="w-6 h-6 rounded-full font-bold text-[10px] flex items-center justify-center text-white shrink-0 overflow-hidden bg-cyan-500">{r.autor_avatar_url ? <img src={r.autor_avatar_url} alt="" className="w-full h-full object-cover" /> : <span>{r.autor?.charAt(0).toUpperCase()}</span>}</div>
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-1.5"><span className="text-[11px] font-bold text-gray-900 dark:text-white">{r.autor}</span><span className="text-[10px] text-gray-400">{r.created_at ? new Date(r.created_at).toLocaleDateString() : ''}</span></div>
                                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 leading-relaxed">{r.texto}</p>
                                        <button onClick={() => handleLikeRespuestaInterna(c.id, r.id)} className={`flex items-center gap-1.5 text-[11px] mt-1 hover:text-red-500 transition-colors ${yaDioLikeR ? 'text-red-500' : 'text-gray-400'}`}><Heart size={11} className={yaDioLikeR ? 'fill-current' : ''} /> {r.likes || 0}</button>
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
        </div>

        {/* RIGHT — sidebar */}
        <div className={`w-72 shrink-0 border-l overflow-y-auto hidden lg:block ${darkMode ? 'border-white/[0.06]' : 'border-gray-200'}`}>
          <div className="p-4 space-y-3">
            {cursoCtx ? (
              <>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-1.5 px-1"><GraduationCap size={12} /> Lecciones del curso</p>
                {(() => {
                  const primerBloqueadaIdx = leccionesCurso.findIndex((l, idx) => {
                    if (idx === 0) return false;
                    const prev = leccionesCurso[idx - 1];
                    return !completadasSet.has(prev.id) || (prev.quiz_id && (prev.quiz_obligatorio ?? true) && !quizzesAprobadosSet.has(prev.quiz_id));
                  });
                  return (
                    <div className="space-y-1.5">
                      {leccionesCurso.map((l, idx) => {
                        const esActual = l.id === localVideo.id;
                        const hecha = completadasSet.has(l.id);
                        const ytIdL = getYoutubeId(l.url_video);
                        const miniaturaL = ytIdL ? `https://img.youtube.com/vi/${ytIdL}/hqdefault.jpg` : null;
                        const bloqueada = primerBloqueadaIdx >= 0 && idx >= primerBloqueadaIdx && !esActual;
                        const quizAprobadoL = l.quiz_id ? quizzesAprobadosSet.has(l.quiz_id) : false;
                        return (
                          <React.Fragment key={l.id}>
                            {idx === primerBloqueadaIdx && primerBloqueadaIdx > 0 && (
                              <div className="flex items-center gap-2 py-1 px-1">
                                <div className="flex-1 h-px bg-gray-200 dark:bg-white/10" />
                                <span className="text-[8px] font-black uppercase tracking-widest text-gray-400 whitespace-nowrap flex items-center gap-1"><Lock size={8} /> Completa anteriores</span>
                                <div className="flex-1 h-px bg-gray-200 dark:bg-white/10" />
                              </div>
                            )}
                            <div
                              onClick={() => !esActual && !bloqueada && abrirLeccionDeCurso(l, cursoActivoId)}
                              className={`p-2 rounded-xl border flex gap-2 items-center transition-all ${
                                esActual ? 'border-cyan-500/40 bg-cyan-600/5 cursor-default'
                                : bloqueada ? `cursor-default opacity-50 ${darkMode ? 'bg-gray-900/40 border-white/5' : 'bg-white border-gray-100'}`
                                : `cursor-pointer hover:scale-[1.01] ${darkMode ? 'bg-gray-900/40 border-white/5 hover:bg-gray-900' : 'bg-white border-gray-100 hover:border-gray-200 hover:shadow-sm'}`
                              }`}
                            >
                              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-black shrink-0 ${hecha ? 'bg-emerald-500 text-white' : darkMode ? 'bg-white/5 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>
                                {hecha ? <Check size={9} /> : idx + 1}
                              </span>
                              <div className="w-14 aspect-video bg-gray-950 rounded overflow-hidden shrink-0 flex items-center justify-center">
                                {miniaturaL ? <img src={miniaturaL} alt="" className="w-full h-full object-cover" /> : <Clapperboard size={10} className="opacity-30 text-white" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={`text-[10px] font-bold truncate ${esActual ? 'text-cyan-500' : darkMode ? 'text-white' : 'text-gray-800'}`}>{l.titulo}</p>
                                <p className="text-[9px] text-gray-400 font-mono mt-0.5">{l.duracion || '—'}</p>
                                {l.quiz_id && <span className={`text-[8px] font-bold ${quizAprobadoL ? 'text-emerald-500' : (l.quiz_obligatorio ?? true) ? 'text-amber-500' : 'text-gray-400'}`}>{quizAprobadoL ? '✓ quiz' : (l.quiz_obligatorio ?? true) ? '⚡ quiz' : '○ quiz'}</span>}
                              </div>
                            </div>
                          </React.Fragment>
                        );
                      })}
                    </div>
                  );
                })()}
              </>
            ) : (
              <>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-1">Más clases</p>
                {sugeridos.length === 0 ? (
                  <p className="text-xs text-gray-400 px-1 italic">No hay más clases sugeridas.</p>
                ) : (
                  <div className="space-y-2">
                    {sugeridos.map((v) => {
                      const ytId = getYoutubeId(v.url_video);
                      const miniatura = ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : null;
                      return (
                        <div
                          key={v.id}
                          onClick={() => setVideoSeleccionado && setVideoSeleccionado(v)}
                          className={`p-2 rounded-xl border flex gap-2.5 cursor-pointer transition-all hover:scale-[1.01] ${darkMode ? 'bg-gray-900/40 border-white/5 hover:bg-gray-900' : 'bg-white border-gray-100 hover:border-gray-200 hover:shadow-sm'}`}
                        >
                          <div className="w-20 aspect-video bg-gray-950 rounded-lg overflow-hidden shrink-0 flex items-center justify-center">
                            {miniatura ? <img src={miniatura} alt="" className="w-full h-full object-cover" /> : <Clapperboard size={14} className="opacity-30 text-white" />}
                          </div>
                          <div className="flex-1 min-w-0 py-0.5">
                            <p className={`text-[10px] font-bold leading-tight line-clamp-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{v.titulo}{v.es_premium && <span className="ml-1 text-amber-500 text-[8px]"> ★</span>}</p>
                            <p className="text-[9px] text-gray-400 mt-1 truncate">{v.autor}</p>
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
      </div>

      {/* MODAL DE CARPETAS */}
      <Modal open={mostrarModalGuardar} onClose={() => setMostrarModalGuardar(false)} title="Organizar Asignatura" icon={FolderOpen} darkMode={darkMode} maxWidth="max-w-md">
        <div className="space-y-2 max-h-60 overflow-y-auto pr-1 mb-5">
          {misListas.length === 0 && <p className="text-xs italic text-gray-400 px-1">Aún no tienes carpetas. Crea la primera abajo.</p>}
          {misListas.map((lista) => {
            const estaGuardado = (lista.videos || []).some(v => v.id === localVideo.id);
            return (
              <label key={lista.id} className={`flex items-center gap-3.5 p-3.5 rounded-2xl cursor-pointer transition-all border ${estaGuardado ? 'bg-cyan-600/5 border-cyan-500/20 text-cyan-600 dark:text-cyan-400 font-bold' : 'bg-transparent border-transparent hover:bg-gray-100 dark:hover:bg-white/5'}`}>
                <input type="checkbox" checked={estaGuardado} onChange={() => toggleVideoEnCarpeta(lista)} className="w-5 h-5 rounded-md text-cyan-600 border-gray-300 accent-cyan-600 cursor-pointer" />
                <span className="flex-1 truncate text-xs">{lista.nombre}</span>
              </label>
            );
          })}
        </div>
        <form onSubmit={crearNuevaCarpeta} className="flex gap-2 pt-3 border-t border-gray-100 dark:border-white/5">
          <input type="text" value={nombreNuevaCarpeta} onChange={(e) => setNombreNuevaCarpeta(e.target.value)} placeholder="Nombre de la carpeta nueva..." className={`flex-1 rounded-xl px-3 py-2 text-xs outline-none border bg-transparent focus:border-cyan-500 ${darkMode ? 'border-white/10 text-white' : 'border-gray-200 text-gray-900'}`} />
          <button type="submit" className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-[10px] font-bold uppercase tracking-wide shadow-sm">+ Crear</button>
        </form>
      </Modal>

      <Modal open={modalQuizRequerido} onClose={() => setModalQuizRequerido(false)} title="Quiz requerido" darkMode={darkMode} maxWidth="max-w-sm">
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">Debes aprobar el quiz de esta lección antes de continuar a la siguiente.</p>
        <div className="flex gap-3 justify-end">
          <button onClick={() => setModalQuizRequerido(false)} className="px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wide text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5">Cancelar</button>
          <button onClick={() => { setModalQuizRequerido(false); setQuizModal(quizId); }} className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-gray-950 text-[10px] font-black uppercase tracking-wide shadow-sm inline-flex items-center gap-1.5"><GraduationCap size={12} /> Hacer Quiz</button>
        </div>
      </Modal>

      <Modal open={confirmReintento} onClose={() => setConfirmReintento(false)} title="Reintentar quiz" darkMode={darkMode} maxWidth="max-w-sm">
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">Ya aprobaste este quiz. ¿Quieres intentarlo de nuevo?</p>
        <div className="flex gap-3 justify-end">
          <button onClick={() => setConfirmReintento(false)} className="px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wide text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5">Cancelar</button>
          <button onClick={() => { setConfirmReintento(false); setQuizModal(quizId); }} className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-gray-950 text-[10px] font-black uppercase tracking-wide shadow-sm inline-flex items-center gap-1.5"><GraduationCap size={12} /> Sí, reintentar</button>
        </div>
      </Modal>

      <QuizModal open={Boolean(quizModal)} onClose={() => setQuizModal(null)} onPass={() => cursosApi.progreso(cursoActivoId).then(setProgresoCurso).catch(() => {})} cursoId={cursoActivoId} quizId={quizModal} darkMode={darkMode} />
    </div>
  );
}