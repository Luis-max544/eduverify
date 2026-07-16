import React, { useState, useEffect } from 'react';
import {
  Palette, Clapperboard, Folder, ListVideo, GraduationCap, ChevronUp, ChevronDown,
  Image, User, X, ArrowLeft, Link, Star, Plus, Eye, EyeOff, ClipboardCheck, FileText
} from 'lucide-react';
import { videos as videosApi, users as usersApi, profesorPlaylists, uploadVideoToMinio } from '../api';
import { useToast } from './Toast';
import Modal from './Modal';

const CATEGORIAS = ['Programación', 'Ciberseguridad', 'Matemáticas', 'Electrónica', 'Arte'];

export default function PanelProfesor({ usuario, setUsuario, setVista, darkMode, videosGlobales = [], recargarVideos, setVideoSeleccionado, subVista = 'canal', setSubVista = () => {}, addToUploadQueue = () => {}, updateUploadProgress = () => {} }) {
  const [pestanaStudio, setPestanaStudio] = useState('VIDEOS');
  const notify = useToast();

  // PERSONALIZACIÓN DE CANAL (banner y avatar viven en el usuario del API)
  const [mostrarPersonalizar, setMostrarPersonalizar] = useState(false);
  const bannerCustom = usuario?.banner_url || '';
  const fotoCustom = usuario?.avatar_url || '';

  // Archivos seleccionados (File) + previsualización local
  const [archivoBanner, setArchivoBanner] = useState(null);
  const [archivoFoto, setArchivoFoto] = useState(null);
  const [inputBanner, setInputBanner] = useState('');
  const [inputFoto, setInputFoto] = useState('');

  // CRUD de Playlists del Profesor (API)
  const [misPlaylists, setMisPlaylists] = useState([]);
  const [mostrarCrearCurso, setMostrarCrearCurso] = useState(false);
  const [nuevoCursoNombre, setNuevoCursoNombre] = useState('');
  const [nuevoCursoDesc, setNuevoCursoDesc] = useState('');
  const [nuevoCursoCategoria, setNuevoCursoCategoria] = useState('Programación');
  const [nuevoCursoEsPremium, setNuevoCursoEsPremium] = useState(false);
  const [archivoPortada, setArchivoPortada] = useState(null);
  const [previewPortada, setPreviewPortada] = useState('');

  // Formulario de Alta de Videos Nuevos
  const [uploadMode, setUploadMode] = useState('url'); // 'url' | 'file'
  const [tituloLeccion, setTituloLeccion] = useState('');
  const [especialidad, setEspecialidad] = useState('Programación');
  const [videoUrl, setVideoUrl] = useState('');
  const [archivoVideoFile, setArchivoVideoFile] = useState(null);
  const [descripcion, setDescripcion] = useState('');
  const [esPremiumAlta, setEsPremiumAlta] = useState(false);
  const [esVisibleAlta, setEsVisibleAlta] = useState(true);
  const [playlistAlta, setPlaylistAlta] = useState('');
  const [editando, setEditando] = useState(null);
  const [editForm, setEditForm] = useState({ titulo: '', descripcion: '', categoria: 'Programación', es_premium: false, visible: true });
  const [editandoQuiz, setEditandoQuiz] = useState(null); // { playlistId, videoId }
  const [quizForm, setQuizForm] = useState({ titulo: '', min_aprobacion: 70, preguntas: [{ pregunta: '', opciones: ['', ''], correcta: 0 }] });
  const [cargandoQuiz, setCargandoQuiz] = useState(false);

  const [pdfsCurso, setPdfsCurso] = useState([]);
  const [subiendoPdf, setSubiendoPdf] = useState(false);
  const fileRef = React.useRef();

  const abrirEditor = (v) => {
    setEditForm({
      titulo: v.titulo || '',
      descripcion: v.descripcion || '',
      categoria: v.categoria || 'Programación',
      es_premium: v.es_premium || false,
      visible: v.visible !== false,
    });
    setEditando(v);
  };

  const [misVideosPropios, setMisVideosPropios] = useState([]);
  const cargarMisVideos = () => {
    if (!usuario?.id) return;
    usersApi.videos(usuario.id, { page: 1, limit: 100 }).then(d => setMisVideosPropios(d.items)).catch(() => {});
  };

  const cargarPlaylists = () => {
    profesorPlaylists.list().then(setMisPlaylists).catch(() => {});
  };

  useEffect(() => {
    cargarPlaylists();
    cargarMisVideos();
  }, []);

  useEffect(() => { cargarMisVideos(); }, [usuario?.id]);

  const obtenerYoutubeId = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  // Videos propios desde el API (incluye los ocultos que son del usuario)

  // Selección de imágenes locales: se guarda el File para subirlo y un dataURL para previsualizar
  const manejarCambioArchivoBanner = (e) => {
    const archivo = e.target.files[0];
    if (archivo) {
      setArchivoBanner(archivo);
      const lector = new FileReader();
      lector.onloadend = () => setInputBanner(lector.result);
      lector.readAsDataURL(archivo);
    }
  };

  const manejarCambioArchivoFoto = (e) => {
    const archivo = e.target.files[0];
    if (archivo) {
      setArchivoFoto(archivo);
      const lector = new FileReader();
      lector.onloadend = () => setInputFoto(lector.result);
      lector.readAsDataURL(archivo);
    }
  };

  const handleGuardarPersonalizacion = async (e) => {
    e.preventDefault();
    try {
      let nuevoUsuario = { ...usuario };
      if (archivoBanner) {
        const { banner_url } = await usersApi.uploadBanner(archivoBanner);
        nuevoUsuario.banner_url = banner_url;
      }
      if (archivoFoto) {
        const { avatar_url } = await usersApi.uploadAvatar(archivoFoto);
        nuevoUsuario.avatar_url = avatar_url;
      }
      setUsuario(nuevoUsuario);
      setArchivoBanner(null);
      setArchivoFoto(null);
      setInputBanner('');
      setInputFoto('');
      setMostrarPersonalizar(false);
      notify.success("¡Diseño del canal guardado y actualizado con éxito!");
    } catch (err) {
      notify.error(`Error al guardar el diseño: ${err.message}`);
    }
  };

  const manejarCambioPortada = (e) => {
    const archivo = e.target.files[0];
    if (archivo) {
      setArchivoPortada(archivo);
      const lector = new FileReader();
      lector.onloadend = () => setPreviewPortada(lector.result);
      lector.readAsDataURL(archivo);
    }
  };

  const resetCrearCurso = () => {
    setNuevoCursoNombre(''); setNuevoCursoDesc(''); setNuevoCursoCategoria('Programación');
    setNuevoCursoEsPremium(false); setArchivoPortada(null); setPreviewPortada('');
    setMostrarCrearCurso(false);
  };

  // CRUD PLAYLISTS: Crear, Renombrar, Eliminar (API)
  const handleCrearCurso = async (e) => {
    e.preventDefault();
    const nombre = nuevoCursoNombre.trim();
    if (!nombre) return;
    if (misPlaylists.some(p => p.nombre === nombre)) return notify.error("Ya tienes un curso con ese nombre.");
    try {
      const created = await profesorPlaylists.create({
        nombre,
        descripcion: nuevoCursoDesc.trim() || undefined,
        categoria: nuevoCursoCategoria,
        es_premium: nuevoCursoEsPremium,
      });
      if (archivoPortada) {
        await profesorPlaylists.uploadCover(created.id, archivoPortada);
      }
      cargarPlaylists();
      resetCrearCurso();
      notify.success('¡Curso creado!');
    } catch (err) {
      notify.error(`Error al crear el curso: ${err.message}`);
    }
  };

  const handleRenombrarPlaylist = async (playlist) => {
    const nuevoNombre = prompt(`Modificar nombre del curso "${playlist.nombre}" a:`, playlist.nombre);
    if (!nuevoNombre || !nuevoNombre.trim() || nuevoNombre.trim() === playlist.nombre) return;
    const nombreLimpio = nuevoNombre.trim();
    if (misPlaylists.some(p => p.nombre === nombreLimpio)) return notify.error("Ya existe otro curso con ese nombre.");
    try {
      await profesorPlaylists.update(playlist.id, { nombre: nombreLimpio });
      cargarPlaylists();
    } catch (err) {
      notify.error(`Error al renombrar el curso: ${err.message}`);
    }
  };

  // 🎓 Edición de curso: descripción + orden de lecciones
  const [gestionarPlaylistId, setGestionarPlaylistId] = useState(null);
  // Derived — stays live whenever misPlaylists refreshes after mutations
  const gestionarPlaylist = gestionarPlaylistId
    ? (misPlaylists.find(p => p.id === gestionarPlaylistId) ?? null)
    : null;
  const [descEdit, setDescEdit] = useState('');
  const [categoriaEdit, setCategoriaEdit] = useState('Programación');
  const [esPremiumEdit, setEsPremiumEdit] = useState(false);

  const abrirGestionarPlaylist = (playlist) => {
    setGestionarPlaylistId(playlist.id);
    setDescEdit(playlist.descripcion || '');
    setCategoriaEdit(playlist.categoria || 'Programación');
    setEsPremiumEdit(playlist.es_premium || false);
    cargarPdfs(playlist.id);
  };

  const handleGuardarDescripcion = async (playlist) => {
    try {
      await profesorPlaylists.update(playlist.id, { descripcion: descEdit.trim() || null });
      cargarPlaylists();
      notify.success('Descripción guardada.');
    } catch (err) {
      notify.error(`Error al guardar la descripción: ${err.message}`);
    }
  };

  const handleGuardarAjustesCurso = async (playlist) => {
    try {
      await profesorPlaylists.update(playlist.id, { categoria: categoriaEdit, es_premium: esPremiumEdit });
      cargarPlaylists();
      notify.success('Ajustes guardados.');
    } catch (err) {
      notify.error(`Error al guardar ajustes: ${err.message}`);
    }
  };

  const moverLeccion = async (playlist, idx, dir) => {
    const ids = (playlist.videos || []).map(v => v.id);
    const destino = idx + dir;
    if (destino < 0 || destino >= ids.length) return;
    [ids[idx], ids[destino]] = [ids[destino], ids[idx]];
    try {
      await profesorPlaylists.reorder(playlist.id, ids);
      cargarPlaylists();
    } catch (err) {
      notify.error(`Error al reordenar: ${err.message}`);
    }
  };

  const handleEliminarPlaylist = async (playlist) => {
    if (!confirm(`¿Estás seguro de eliminar el curso "${playlist.nombre}"?`)) return;
    try {
      await profesorPlaylists.remove(playlist.id);
      cargarPlaylists();
    } catch (err) {
      notify.error(`Error al eliminar el curso: ${err.message}`);
    }
  };

  // CRUD VIDEOS (el API deduce autor y usuario_id del token)
  const handlePublicarClase = async (e) => {
    e.preventDefault();
    if (!tituloLeccion.trim()) return notify.error('Completa el título.');
    if (uploadMode === 'url' && !videoUrl.trim()) return notify.error('Ingresa la URL del video.');
    if (uploadMode === 'file' && !archivoVideoFile) return notify.error('Selecciona un archivo de video.');
    if (!playlistAlta) return notify.error('Selecciona un curso para la lección.');

    const base = {
      titulo: tituloLeccion.trim(),
      descripcion: descripcion.trim(),
      categoria: especialidad,
      es_premium: esPremiumAlta,
      visible: esVisibleAlta,
      playlist_id: Number(playlistAlta),
    };

    try {
      if (uploadMode === 'url') {
        await videosApi.create({ ...base, url_video: videoUrl.trim() });
        notify.success('¡Clase publicada con éxito!');
      } else {
        const { id } = await videosApi.createWithUpload(base);
        const titulo = tituloLeccion.trim();
        addToUploadQueue({ id, titulo, progreso: 0, status: 'uploading' });
        notify.success('Subida iniciada en segundo plano');

        const file = archivoVideoFile;
        const uploadEndpoint = videosApi.uploadUrl(id);
        (async () => {
          try {
            await uploadVideoToMinio(uploadEndpoint, file, (pct) => updateUploadProgress(id, { progreso: pct }));
            updateUploadProgress(id, { status: 'done', progreso: 100 });
            if (recargarVideos) recargarVideos();
            cargarMisVideos();
          } catch {
            updateUploadProgress(id, { status: 'error' });
          }
        })();
      }

      if (recargarVideos && uploadMode === 'url') recargarVideos();
      cargarMisVideos();
      cargarPlaylists();
      setTituloLeccion(''); setDescripcion(''); setVideoUrl('');
      setArchivoVideoFile(null); setEsPremiumAlta(false); setEsVisibleAlta(true); setPlaylistAlta('');
      setSubVista('canal');
    } catch (err) {
      notify.error(`Error al publicar la clase: ${err.message}`);
    }
  };

  const handleEliminarVideo = async (idVideo) => {
    if (!confirm("¿Deseas eliminar este video de tu canal definitivamente?")) return;
    try {
      await videosApi.remove(idVideo);
      if (recargarVideos) recargarVideos();
      cargarMisVideos();
    } catch (err) {
      notify.error(`Error al eliminar el video: ${err.message}`);
    }
  };

  const handleGuardarEdicion = async (e) => {
    e.preventDefault();
    if (!editando) return;
    try {
      await videosApi.update(editando.id, {
        titulo: editForm.titulo.trim(),
        descripcion: editForm.descripcion.trim(),
        categoria: editForm.categoria,
        es_premium: editForm.es_premium,
        visible: editForm.visible,
      });
      // CLAUDE.md: PATCH returns raw row — refetch
      await videosApi.get(editando.id);
      if (recargarVideos) recargarVideos();
      cargarMisVideos();
      setEditando(null);
      notify.success('Cambios guardados.');
    } catch (err) {
      notify.error(`Error al guardar: ${err.message}`);
    }
  };

  const abrirQuizEditor = async (playlist, videoId) => {
    setEditandoQuiz({ playlistId: playlist.id, videoId });
    setQuizForm({ titulo: '', min_aprobacion: 70, preguntas: [{ pregunta: '', opciones: ['', ''], correcta: 0 }] });
    setCargandoQuiz(true);
    try {
      const quizzes = await profesorPlaylists.getQuizzes(playlist.id);
      const existente = quizzes.find(q => q.video_id === videoId);
      if (existente) {
        setQuizForm({
          titulo: existente.titulo || '',
          min_aprobacion: existente.min_aprobacion,
          preguntas: (existente.preguntas || []).length > 0
            ? existente.preguntas.map(p => {
                const opts = typeof p.opciones === 'string' ? JSON.parse(p.opciones) : p.opciones;
                return { pregunta: p.pregunta, opciones: Array.isArray(opts) ? opts : [], correcta: p.correcta };
              })
            : [{ pregunta: '', opciones: ['', ''], correcta: 0 }],
        });
      }
    } catch {
      notify.error('No se pudo cargar el quiz existente.');
    } finally {
      setCargandoQuiz(false);
    }
  };

  const handleGuardarQuiz = async (e) => {
    e.preventDefault();
    if (!editandoQuiz) return;
    const { titulo, min_aprobacion, preguntas } = quizForm;
    const validas = preguntas.filter(p => p.pregunta.trim() && p.opciones.every(o => o.trim()));
    if (validas.length === 0) return notify.error('Añade al menos una pregunta con opciones.');
    if (validas.some(p => p.correcta < 0 || p.correcta >= p.opciones.length)) return notify.error('Marca una opción correcta en cada pregunta.');
    try {
      await profesorPlaylists.saveQuiz(editandoQuiz.playlistId, {
        video_id: editandoQuiz.videoId,
        titulo: titulo.trim() || null,
        min_aprobacion,
        preguntas: validas.map((p, i) => ({ pregunta: p.pregunta.trim(), opciones: p.opciones.map(o => o.trim()), correcta: p.correcta, orden: i })),
      });
      cargarPlaylists();
      setEditandoQuiz(null);
      notify.success('Quiz guardado.');
    } catch (err) {
      notify.error(`Error al guardar el quiz: ${err.message}`);
    }
  };

  const handleEliminarQuiz = async () => {
    if (!editandoQuiz) return;
    if (!confirm('¿Eliminar el quiz de esta lección?')) return;
    try {
      const quizzes = await profesorPlaylists.getQuizzes(editandoQuiz.playlistId);
      const existente = quizzes.find(q => q.video_id === editandoQuiz.videoId);
      if (!existente) return;
      await profesorPlaylists.removeQuiz(editandoQuiz.playlistId, existente.id);
      cargarPlaylists();
      setEditandoQuiz(null);
      notify.success('Quiz eliminado.');
    } catch (err) {
      notify.error(`Error al eliminar: ${err.message}`);
    }
  };

  const agregarPregunta = () => {
    setQuizForm(prev => ({ ...prev, preguntas: [...prev.preguntas, { pregunta: '', opciones: ['', ''], correcta: 0 }] }));
  };

  const eliminarPregunta = (idx) => {
    setQuizForm(prev => ({ ...prev, preguntas: prev.preguntas.filter((_, i) => i !== idx) }));
  };

  const cargarPdfs = (playlistId) => {
    profesorPlaylists.getPdfs(playlistId).then(setPdfsCurso).catch(() => {});
  };

  const handleUploadPdf = async (playlistId, videoId = null) => {
    const file = fileRef.current?.files?.[0];
    if (!file) return notify.error('Selecciona un archivo PDF.');
    setSubiendoPdf(true);
    try {
      await profesorPlaylists.uploadPdf(playlistId, file, videoId);
      cargarPdfs(playlistId);
      notify.success('PDF subido.');
      if (fileRef.current) fileRef.current.value = '';
    } catch (err) {
      notify.error(`Error al subir PDF: ${err.message}`);
    } finally {
      setSubiendoPdf(false);
    }
  };

  const handleRemovePdf = async (playlistId, pdfId) => {
    if (!confirm('¿Eliminar este PDF?')) return;
    try {
      await profesorPlaylists.removePdf(playlistId, pdfId);
      cargarPdfs(playlistId);
      notify.success('PDF eliminado.');
    } catch (err) {
      notify.error(`Error al eliminar: ${err.message}`);
    }
  };

  return (
    <div className="relative min-h-screen pb-20 animate-fade-in select-none text-left">
      {subVista === 'canal' && (
        <>
          {/* BANNER DINÁMICO */}
          <div 
            className="w-full h-32 md:h-44 rounded-3xl border border-gray-200 dark:border-white/5 relative overflow-hidden mb-6 flex items-center justify-center bg-cover bg-center transition-all duration-300 bg-gray-100 dark:bg-gray-900"
            style={{ backgroundImage: bannerCustom ? `url(${bannerCustom})` : 'none' }}
          >
            {!bannerCustom && (
              <div className="absolute inset-0 bg-gradient-to-r from-slate-100 via-slate-200 to-slate-100 dark:from-cyan-900/20 dark:to-gray-900"></div>
            )}
            <div className="absolute inset-0 flex items-center justify-center opacity-10 font-black text-4xl md:text-7xl uppercase tracking-tighter text-gray-600 dark:text-white">
              EDUVERIFY CREATOR
            </div>
          </div>

          {/* PERFIL */}
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6 px-2 mb-10">
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-cyan-600 border-4 border-white dark:border-gray-950 shadow-xl flex items-center justify-center text-4xl text-white font-bold shrink-0 overflow-hidden">
              {fotoCustom ? (
                <img src={fotoCustom} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                usuario?.nombre?.charAt(0).toUpperCase() || 'P'
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">
                  {usuario?.nombre || 'Profesor'}
                </h1>
                <span className="bg-cyan-500/10 text-cyan-500 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border border-cyan-500/20">Tu canal</span>
              </div>
              <p className="text-sm text-gray-500 mt-1">Administración directa de videos, transmisiones en vivo y materiales didácticos descargables.</p>
              <div className="flex gap-4 mt-3 text-xs font-bold text-gray-400 uppercase tracking-widest">
                <span>{misVideosPropios.length} Publicaciones</span>
              </div>
            </div>

            <div className="flex gap-2.5 w-full md:w-auto flex-wrap">
              <button
                onClick={() => { setArchivoBanner(null); setArchivoFoto(null); setInputBanner(''); setInputFoto(''); setMostrarPersonalizar(true); }}
                className="flex-1 md:flex-none bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white font-bold py-2.5 px-6 rounded-full text-xs transition-all active:scale-95 inline-flex items-center justify-center gap-1.5"
              >
                <Palette size={14} /> Personalizar canal
              </button>
              <button
                onClick={() => setSubVista('subir')}
                className="flex-1 md:flex-none bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2.5 px-6 rounded-full text-xs shadow-lg shadow-cyan-600/10 transition-transform active:scale-95 inline-flex items-center justify-center gap-1.5"
              >
                <Plus size={14} /> Subir Video
              </button>
            </div>
          </div>

          {/* TABS DE STUDIO */}
          <div className="flex gap-6 border-b border-gray-200 dark:border-white/[0.04] mb-6 px-2">
            <button onClick={() => setPestanaStudio('VIDEOS')} className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${pestanaStudio === 'VIDEOS' ? 'border-cyan-500 text-gray-900 dark:text-white' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>Videos</button>
            <button onClick={() => setPestanaStudio('PLAYLISTS')} className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${pestanaStudio === 'PLAYLISTS' ? 'border-cyan-500 text-gray-900 dark:text-white' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>Cursos</button>
          </div>

          {/* LISTADOS */}
          <div className={darkMode ? "p-5 rounded-3xl border bg-gray-900/40 border-white/5 shadow-sm" : "p-5 rounded-3xl border bg-white border-gray-200 shadow-sm"}>
            {pestanaStudio === 'VIDEOS' && (
              <div className="grid grid-cols-1 gap-4">
                {misVideosPropios.length === 0 ? (
                  <p className="text-center py-10 text-xs text-gray-400 uppercase font-mono tracking-wider">No has publicado ningún video todavía.</p>
                ) : (
                  misVideosPropios.map((v) => {
                    const ytId = obtenerYoutubeId(v.url_video);
                    const urlMiniatura = ytId ? "https://img.youtube.com/vi/" + ytId + "/hqdefault.jpg" : null;

                    return (
                      <div key={v.id || Math.random()} className={darkMode ? "flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl border transition-colors bg-gray-950/40 border-white/5 hover:bg-gray-950" : "flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl border transition-colors bg-white border-[var(--clr-border-subtle)] hover:shadow-sm"}
                        ><div onClick={() => { if(setVideoSeleccionado) { setVideoSeleccionado(v); setVista('reproductor'); } }} className="w-full sm:w-40 aspect-video bg-gray-900 rounded-xl overflow-hidden border border-white/5 shrink-0 relative flex items-center justify-center cursor-pointer hover:opacity-90">
                          {urlMiniatura ? <img src={urlMiniatura} alt="" className="w-full h-full object-cover" /> : <Clapperboard size={28} className="opacity-30 text-white" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 onClick={() => { if(setVideoSeleccionado) { setVideoSeleccionado(v); setVista('reproductor'); } }} className={`text-sm font-bold truncate cursor-pointer hover:text-cyan-500 transition-colors ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            {v.titulo}
                            {v.es_premium && <span className="ml-2 bg-amber-500/10 text-amber-500 text-[8px] font-black uppercase px-1.5 py-0.5 rounded inline-flex items-center gap-1 align-middle"><Star size={9} className="fill-current" /> Premium</span>}
                            {!v.visible && <span className="ml-2 bg-red-500/10 text-red-500 text-[8px] font-black uppercase px-1.5 py-0.5 rounded inline-flex items-center gap-1 align-middle"><EyeOff size={9} /> Oculto</span>}
                          </h4>
                          <div className="flex gap-3 mt-1 text-[10px] text-gray-400 font-medium font-mono"><span className="text-cyan-500 font-bold uppercase">{v.categoria || 'Lección'}</span><span>• {v.vistas || 0} vistas</span></div>
                        </div>
                        <div className="flex gap-2 w-full sm:w-auto">
                          <button onClick={() => abrirEditor(v)} className="flex-1 sm:flex-none text-[10px] font-bold uppercase py-2 px-4 bg-cyan-500/10 text-cyan-500 rounded-lg hover:bg-cyan-500 hover:text-white transition-colors">Editar</button>
                          <button onClick={() => handleEliminarVideo(v.id)} className="flex-1 sm:flex-none text-[10px] font-bold uppercase py-2 px-4 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-colors">Eliminar</button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {pestanaStudio === 'PLAYLISTS' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-400">Gestiona tus cursos y su contenido.</p>
                  <button onClick={() => setMostrarCrearCurso(true)} className="inline-flex items-center gap-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-black text-[10px] uppercase tracking-widest px-4 py-2 rounded-xl transition-colors">
                    <Plus size={12} /> Nuevo Curso
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 items-start">
                  {misPlaylists.map((playlist) => {
                    const videosDeLista = playlist.videos || [];
                    const primerVideo = videosDeLista[0] || {};
                    const ytId = obtenerYoutubeId(primerVideo.url_video);
                    const miniaturaPlaylist = ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : null;
                    const thumbnail = playlist.portada_url || miniaturaPlaylist;

                    return (
                      <div key={playlist.id} className="flex flex-col gap-2 p-3 rounded-2xl border border-gray-100 dark:border-white/[0.04] bg-gray-50/40 dark:bg-gray-900/10">
                        <div onClick={() => { if (videosDeLista.length > 0 && setVideoSeleccionado) { setVideoSeleccionado(primerVideo); setVista('reproductor'); } }} className="w-full aspect-video bg-gray-900 rounded-xl overflow-hidden relative border border-gray-200/10 shadow-md cursor-pointer hover:opacity-95">
                          {thumbnail ? <img src={thumbnail} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-[var(--clr-surface-elevated)] dark:bg-gray-900 flex items-center justify-center"><Folder size={28} className="text-[var(--clr-text-muted)] opacity-40" /></div>}
                          <div className="absolute right-0 top-0 bottom-0 w-2/5 bg-black/70 backdrop-blur-[4px] flex flex-col items-center justify-center text-white border-l border-white/5 space-y-1">
                            <ListVideo size={16} /><span className="text-[10px] font-black font-mono uppercase">{videosDeLista.length} videos</span>
                          </div>
                        </div>
                        <div className="space-y-1 pt-1 flex flex-col flex-1 justify-between">
                          <div>
                            <h4 className={`text-xs font-black uppercase tracking-wide truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>{playlist.nombre}</h4>
                            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                              {playlist.categoria && <span className="text-[8px] font-black uppercase text-cyan-500 bg-cyan-500/10 px-1.5 py-0.5 rounded">{playlist.categoria}</span>}
                              {playlist.es_premium && <span className="text-[8px] font-black uppercase text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded inline-flex items-center gap-0.5"><Star size={8} className="fill-current" /> Premium</span>}
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2 pt-3 border-t border-gray-100 dark:border-white/5 mt-3">
                            <button onClick={() => handleRenombrarPlaylist(playlist)} className="text-[9px] font-black uppercase py-1.5 px-2 bg-cyan-500/10 text-cyan-500 rounded-md hover:bg-cyan-600 transition-colors">Renombrar</button>
                            <button onClick={() => handleEliminarPlaylist(playlist)} className="text-[9px] font-black uppercase py-1.5 px-2 bg-red-500/10 text-red-500 rounded-md hover:bg-red-600 transition-colors">Eliminar</button>
                          </div>
                          <button
                            onClick={() => abrirGestionarPlaylist(playlist)}
                            className="w-full text-[9px] font-black uppercase py-1.5 px-2 rounded-md transition-colors mt-2 inline-flex items-center justify-center gap-1.5 bg-gray-500/10 text-gray-500 hover:bg-gray-500/20"
                          >
                            <GraduationCap size={12} /> Gestionar curso
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* MODAL CREAR CURSO */}
      <Modal open={mostrarCrearCurso} onClose={resetCrearCurso} title="Nuevo Curso" darkMode={darkMode} maxWidth="max-w-lg">
        <form onSubmit={handleCrearCurso} className="space-y-4">
          <div className="space-y-2">
            <label className="block text-[10px] font-black uppercase text-gray-400">Portada del curso</label>
            <div className="border-2 border-dashed border-gray-300 dark:border-white/10 rounded-2xl p-4 text-center bg-gray-50/50 dark:bg-gray-950 relative flex flex-col items-center justify-center min-h-[100px]">
              <input id="filePortadaInput" type="file" accept="image/*" onChange={manejarCambioPortada} className="hidden" />
              {previewPortada ? (
                <div className="w-full h-28 rounded-xl overflow-hidden relative group">
                  <img src={previewPortada} alt="Portada" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => { setPreviewPortada(''); setArchivoPortada(null); }}
                    className="absolute inset-0 bg-black/60 text-white font-bold opacity-0 group-hover:opacity-100 transition-opacity text-[10px] uppercase flex items-center justify-center gap-1">
                    <X size={14} /> Quitar
                  </button>
                </div>
              ) : (
                <label htmlFor="filePortadaInput" className="cursor-pointer flex flex-col items-center gap-1.5">
                  <Image size={20} className="text-gray-400" />
                  <span className="text-[11px] font-bold text-cyan-500 hover:underline">Seleccionar portada (opcional)</span>
                </label>
              )}
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">Nombre <span className="text-red-500">*</span></label>
            <input type="text" required value={nuevoCursoNombre} onChange={(e) => setNuevoCursoNombre(e.target.value)}
              placeholder="Ej: React desde cero"
              className={darkMode ? "w-full p-3 rounded-xl border text-xs bg-gray-950 border-white/5 text-white" : "w-full p-3 rounded-xl border text-xs bg-[var(--clr-base)] border-gray-200 text-black"} />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">Descripción</label>
            <textarea rows="3" value={nuevoCursoDesc} onChange={(e) => setNuevoCursoDesc(e.target.value)}
              placeholder="¿De qué trata este curso?"
              className={darkMode ? "w-full p-3 rounded-xl border text-xs bg-gray-950 border-white/5 text-white resize-none" : "w-full p-3 rounded-xl border text-xs bg-[var(--clr-base)] border-gray-200 text-black resize-none"} />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">Categoría</label>
            <select value={nuevoCursoCategoria} onChange={(e) => setNuevoCursoCategoria(e.target.value)}
              className={darkMode ? "w-full p-3 rounded-xl border text-xs bg-gray-950 border-white/5 text-white" : "w-full p-3 rounded-xl border text-xs bg-[var(--clr-base)] border-gray-200 text-black"}>
              {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <input type="checkbox" checked={nuevoCursoEsPremium} onChange={(e) => setNuevoCursoEsPremium(e.target.checked)}
              className="w-4 h-4 rounded accent-amber-500 cursor-pointer" />
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider inline-flex items-center gap-1.5">
              <Star size={12} className="fill-current text-amber-500" /> Curso exclusivo Premium
            </span>
          </label>

          <div className="flex justify-end gap-2 pt-2 text-[10px] font-black uppercase tracking-wider">
            <button type="button" onClick={resetCrearCurso} className="px-4 py-2 rounded-xl text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5">Cancelar</button>
            <button type="submit" className="bg-cyan-600 text-white px-5 py-2 rounded-xl shadow-md hover:bg-cyan-500 transition-colors">Crear Curso</button>
          </div>
        </form>
      </Modal>

      {/* 🎨 MODAL DE PERSONALIZACIÓN */}
      <Modal open={mostrarPersonalizar} onClose={() => { setMostrarPersonalizar(false); setArchivoBanner(null); setArchivoFoto(null); setInputBanner(''); setInputFoto(''); }} title="Personalización del Estudio" darkMode={darkMode} maxWidth="max-w-md">
        <p className="text-[10px] text-gray-400 font-medium mb-4">Actualiza las portadas y firmas estéticas subiendo archivos desde tu equipo</p>
            
            <form onSubmit={handleGuardarPersonalizacion} className="space-y-5">
              {/* SECCIÓN A: SUBIDA EXCLUSIVA DEL BANNER */}
              <div className="space-y-2">
                <label className="block text-[10px] font-black uppercase text-gray-400 px-0.5">Imagen de Banner (Fondo Superior)</label>
                <div className="border-2 border-dashed border-gray-300 dark:border-white/10 rounded-2xl p-5 text-center bg-gray-50/50 dark:bg-gray-950 relative flex flex-col items-center justify-center min-h-[110px]">
                  <input 
                    id="fileBannerInput" type="file" accept="image/*" 
                    onChange={manejarCambioArchivoBanner} className="hidden" 
                  />
                  <label htmlFor="fileBannerInput" className="cursor-pointer flex flex-col items-center gap-1.5">
                    <Image size={20} className="text-gray-400" />
                    <span className="text-[11px] font-bold text-cyan-500 hover:underline">Seleccionar archivo del equipo</span>
                  </label>
                  {inputBanner && (
                    <div className="mt-3 w-full h-12 rounded-xl overflow-hidden border border-emerald-500/30 relative group">
                      <img src={inputBanner} alt="Preview Banner" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => setInputBanner('')} className="absolute inset-0 bg-black/60 text-white font-bold opacity-0 group-hover:opacity-100 transition-opacity text-[10px] uppercase">Quitar</button>
                    </div>
                  )}
                </div>
              </div>

              {/* SECCIÓN B: SUBIDA EXCLUSIVA DEL AVATAR */}
              <div className="space-y-2">
                <label className="block text-[10px] font-bold uppercase text-gray-400 px-0.5">Foto de Perfil (Avatar Circular)</label>
                <div className="border-2 border-dashed border-gray-300 dark:border-white/10 rounded-2xl p-5 text-center bg-gray-50/50 dark:bg-gray-950 relative flex flex-col items-center justify-center min-h-[110px]">
                  <input 
                    id="fileAvatarInput" type="file" accept="image/*" 
                    onChange={manejarCambioArchivoFoto} className="hidden" 
                  />
                  <label htmlFor="fileAvatarInput" className="cursor-pointer flex flex-col items-center gap-1.5">
                    <User size={20} className="text-gray-400" />
                    <span className="text-[11px] font-bold text-cyan-500 hover:underline">Seleccionar foto de perfil</span>
                  </label>
                  {inputFoto && (
                    <div className="mt-3 w-12 h-12 rounded-full overflow-hidden border border-emerald-500/30 relative group">
                      <img src={inputFoto} alt="Preview Foto" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => setInputFoto('')} className="absolute inset-0 bg-black/60 text-white font-bold opacity-0 group-hover:opacity-100 transition-opacity rounded-full flex items-center justify-center"><X size={14} /></button>
                    </div>
                  )}
                </div>
              </div>

              {/* ACCIONES FINALES */}
              <div className="flex justify-end gap-2 pt-2 text-[10px] font-black uppercase tracking-wider">
                <button type="button" onClick={() => { setMostrarPersonalizar(false); setArchivoBanner(null); setArchivoFoto(null); setInputBanner(''); setInputFoto(''); }} className="px-4 py-2 rounded-xl text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5">Cancelar</button>
                <button type="submit" className="bg-cyan-600 text-white px-5 py-2 rounded-xl shadow-md hover:bg-cyan-500 transition-colors">Guardar Diseño</button>
              </div>
            </form>
      </Modal>

      {/* MODAL EDICIÓN DE VIDEO */}
      <Modal open={Boolean(editando)} onClose={() => setEditando(null)} title="Editar video" darkMode={darkMode} maxWidth="max-w-lg">
        <p className="text-[10px] text-gray-400 font-medium mb-4">{editando?.titulo}</p>
        <form onSubmit={handleGuardarEdicion} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">Título</label>
            <input type="text" required value={editForm.titulo} onChange={(e) => setEditForm(prev => ({ ...prev, titulo: e.target.value }))}
              className={darkMode ? "w-full p-3 rounded-xl border text-xs bg-gray-950 border-white/5 text-white" : "w-full p-3 rounded-xl border text-xs bg-[var(--clr-base)] border-gray-200 text-black"} />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">Descripción</label>
            <textarea rows="3" value={editForm.descripcion} onChange={(e) => setEditForm(prev => ({ ...prev, descripcion: e.target.value }))}
              className={darkMode ? "w-full p-3 rounded-xl border text-xs bg-gray-950 border-white/5 text-white resize-none" : "w-full p-3 rounded-xl border text-xs bg-[var(--clr-base)] border-gray-200 text-black resize-none"} />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">Categoría</label>
            <select value={editForm.categoria} onChange={(e) => setEditForm(prev => ({ ...prev, categoria: e.target.value }))}
              className={darkMode ? "w-full p-3 rounded-xl border text-xs bg-gray-950 border-white/5 text-white" : "w-full p-3 rounded-xl border text-xs bg-[var(--clr-base)] border-gray-200 text-black"}>
              {CATEGORIAS.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <input type="checkbox" checked={editForm.es_premium} onChange={(e) => setEditForm(prev => ({ ...prev, es_premium: e.target.checked }))}
              className="w-4 h-4 rounded accent-amber-500 cursor-pointer" />
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider inline-flex items-center gap-1.5"><Star size={12} className="fill-current text-amber-500" /> Contenido exclusivo Premium</span>
          </label>
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <input type="checkbox" checked={editForm.visible} onChange={(e) => setEditForm(prev => ({ ...prev, visible: e.target.checked }))}
              className="w-4 h-4 rounded accent-cyan-500 cursor-pointer" />
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider inline-flex items-center gap-1.5"><Eye size={12} /> Visible públicamente</span>
          </label>
          <div className="flex justify-end gap-2 pt-2 text-[10px] font-black uppercase tracking-wider">
            <button type="button" onClick={() => setEditando(null)} className="px-4 py-2 rounded-xl text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5">Cancelar</button>
            <button type="submit" className="bg-cyan-600 text-white px-5 py-2 rounded-xl shadow-md hover:bg-cyan-500 transition-colors">Guardar Cambios</button>
          </div>
        </form>
      </Modal>

      {/* MODAL GESTIONAR CURSO */}
      <Modal open={Boolean(gestionarPlaylist)} onClose={() => setGestionarPlaylistId(null)} title={gestionarPlaylist?.nombre || 'Gestionar curso'} darkMode={darkMode} maxWidth="max-w-2xl">
        {gestionarPlaylist && (() => {
          const videosDeLista = gestionarPlaylist.videos || [];
          return (
            <div className="space-y-5">
              <div className="space-y-1.5">
                <label className="block text-[9px] font-black uppercase text-gray-400">Categoría y visibilidad</label>
                <div className="flex gap-2 items-center">
                  <select value={categoriaEdit} onChange={(e) => setCategoriaEdit(e.target.value)}
                    className={darkMode ? "flex-1 p-2 rounded-lg border text-[10px] bg-gray-950 border-white/5 text-white" : "flex-1 p-2 rounded-lg border text-[10px] bg-[var(--clr-base)] border-gray-200 text-black"}>
                    {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <label className="flex items-center gap-1.5 cursor-pointer select-none shrink-0">
                    <input type="checkbox" checked={esPremiumEdit} onChange={(e) => setEsPremiumEdit(e.target.checked)} className="w-3.5 h-3.5 rounded accent-amber-500 cursor-pointer" />
                    <span className="text-[9px] font-black text-amber-500 uppercase">Premium</span>
                  </label>
                </div>
                <button onClick={() => handleGuardarAjustesCurso(gestionarPlaylist)}
                  className="w-full text-[9px] font-black uppercase py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors">
                  Guardar ajustes
                </button>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[9px] font-black uppercase text-gray-400">Descripción del curso</label>
                <textarea
                  rows={3}
                  value={descEdit}
                  onChange={(e) => setDescEdit(e.target.value)}
                  placeholder="Describe de qué trata este curso..."
                  className={darkMode ? "w-full p-2 rounded-lg border text-[11px] bg-gray-950 border-white/5 text-white resize-none outline-none" : "w-full p-2 rounded-lg border text-[11px] bg-[var(--clr-base)] border-gray-200 text-black resize-none outline-none"}
                />
                <button
                  onClick={() => handleGuardarDescripcion(gestionarPlaylist)}
                  className="w-full text-[9px] font-black uppercase py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-md transition-colors"
                >
                  Guardar descripción
                </button>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[9px] font-black uppercase text-gray-400">Orden de lecciones</label>
                {videosDeLista.length === 0 ? (
                  <p className="text-[10px] text-gray-400 italic">Sin lecciones todavía.</p>
                ) : (
                  videosDeLista.map((v, idx) => (
                    <div key={v.id} className="flex items-center gap-2 text-[10px] font-bold">
                      <span className="text-gray-400 font-mono w-4 shrink-0">{idx + 1}.</span>
                      <span className={`flex-1 truncate ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>{v.titulo}</span>
                      <button onClick={() => moverLeccion(gestionarPlaylist, idx, -1)} disabled={idx === 0}
                        className="w-6 h-6 rounded-md bg-gray-500/10 text-gray-500 hover:bg-cyan-500/20 hover:text-cyan-500 disabled:opacity-30 shrink-0 inline-flex items-center justify-center"
                      ><ChevronUp size={14} /></button>
                      <button onClick={() => moverLeccion(gestionarPlaylist, idx, 1)} disabled={idx === videosDeLista.length - 1}
                        className="w-6 h-6 rounded-md bg-gray-500/10 text-gray-500 hover:bg-cyan-500/20 hover:text-cyan-500 disabled:opacity-30 shrink-0 inline-flex items-center justify-center"
                      ><ChevronDown size={14} /></button>
                      <button onClick={() => abrirQuizEditor(gestionarPlaylist, v.id)}
                        className="w-6 h-6 rounded-md bg-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-white shrink-0 inline-flex items-center justify-center" title="Editar quiz"
                      ><ClipboardCheck size={12} /></button>
                      {(() => {
                        const pdfLeccion = pdfsCurso.find(p => p.video_id === v.id);
                        if (pdfLeccion) return (
                          <span className="flex items-center gap-1 text-[9px] font-bold text-cyan-500">
                            <a href={`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/uploads/pdfs/${pdfLeccion.filename}`} target="_blank" rel="noreferrer" className="hover:underline" title={pdfLeccion.original_name}><FileText size={12} /></a>
                            <button onClick={() => handleRemovePdf(gestionarPlaylist.id, pdfLeccion.id)} className="text-red-400 hover:text-red-500"><X size={10} /></button>
                          </span>
                        );
                        return (
                          <button onClick={() => { fileRef.current?.click(); if (fileRef.current) fileRef.current.onchange = () => handleUploadPdf(gestionarPlaylist.id, v.id); }}
                            className="w-6 h-6 rounded-md bg-gray-500/10 text-gray-400 hover:text-cyan-500 shrink-0 inline-flex items-center justify-center" title="Subir PDF de lección"
                          ><FileText size={11} /></button>
                        );
                      })()}
                    </div>
                  ))
                )}
              </div>

              <div className="space-y-1.5">
                <label className="block text-[9px] font-black uppercase text-gray-400">Documento del curso (PDF)</label>
                {(() => {
                  const pdfCurso = pdfsCurso.find(p => p.video_id === null);
                  return pdfCurso ? (
                    <div className="flex items-center gap-2 text-[10px] font-bold">
                      <FileText size={12} className="text-cyan-500 shrink-0" />
                      <span className={`flex-1 truncate ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>{pdfCurso.original_name}</span>
                      <a href={`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/uploads/pdfs/${pdfCurso.filename}`} target="_blank" rel="noreferrer" className="text-cyan-500 text-[9px] font-black uppercase hover:underline shrink-0">Ver</a>
                      <button onClick={() => handleRemovePdf(gestionarPlaylist.id, pdfCurso.id)} className="text-red-500 text-[9px] font-black uppercase hover:underline shrink-0">Eliminar</button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input type="file" accept="application/pdf" ref={fileRef} className={`text-[10px] ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                      <button type="button" disabled={subiendoPdf} onClick={() => handleUploadPdf(gestionarPlaylist.id)}
                        className="bg-cyan-600 hover:bg-cyan-500 text-white font-black text-[9px] uppercase tracking-widest px-3 py-1.5 rounded-lg disabled:opacity-40 shrink-0"
                      >{subiendoPdf ? 'Subiendo...' : 'Subir'}</button>
                    </div>
                  );
                })()}
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* FORMULARIO DE ALTA MULTIMEDIA */}
      {subVista === 'subir' && (
        <div className="max-w-4xl mx-auto">
          <button onClick={() => setSubVista('canal')} className="mb-4 inline-flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-white transition"><ArrowLeft size={14} /> Volver</button>
          {misPlaylists.length === 0 ? (
            <div className={darkMode ? "p-8 rounded-3xl border bg-gray-900 border-white/5 text-center space-y-4" : "p-8 rounded-3xl border bg-white border-gray-200 text-center space-y-4"}>
              <GraduationCap size={36} className="mx-auto text-gray-400 opacity-40" />
              <p className="text-sm font-bold text-gray-400">Debes crear un curso antes de subir una lección.</p>
              <button onClick={() => { setSubVista('canal'); setPestanaStudio('PLAYLISTS'); }} className="bg-cyan-600 hover:bg-cyan-500 text-white font-black text-xs uppercase tracking-widest px-6 py-2.5 rounded-full transition-colors">
                Crear curso
              </button>
            </div>
          ) : (
          <div className={darkMode ? "p-6 md:p-8 rounded-3xl border bg-gray-900 border-white/5 shadow-xl" : "p-6 md:p-8 rounded-3xl border bg-white border-gray-200 shadow-xl"}>
            <form onSubmit={handlePublicarClase} className="space-y-5 text-left">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">Curso <span className="text-red-500">*</span></label>
                <select required value={playlistAlta} onChange={(e) => setPlaylistAlta(e.target.value)} className={darkMode ? "w-full p-3 rounded-xl border text-xs bg-gray-950 border-white/5 text-white" : "w-full p-3 rounded-xl border text-xs bg-[var(--clr-base)] border-gray-200 text-black"}>
                  <option value="" disabled>Selecciona un curso...</option>
                  {misPlaylists.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">Título</label>
                  <input type="text" required value={tituloLeccion} onChange={(e) => setTituloLeccion(e.target.value)} placeholder="Ej: Introducción a React" className={darkMode ? "w-full p-3 rounded-xl border text-xs bg-gray-950 border-white/5 text-white" : "w-full p-3 rounded-xl border text-xs bg-[var(--clr-base)] border-gray-200 text-black"} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">Materia</label>
                  <select value={especialidad} onChange={(e) => setEspecialidad(e.target.value)} className={darkMode ? "w-full p-3 rounded-xl border text-xs bg-gray-950 border-white/5 text-white" : "w-full p-3 rounded-xl border text-xs bg-[var(--clr-base)] border-gray-200 text-black"}>
                    {CATEGORIAS.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <div className="flex gap-2 mb-2">
                  <button type="button" onClick={() => setUploadMode('url')}
                    className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors ${uploadMode === 'url' ? 'bg-cyan-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-400'}`}>
                    <Link size={10} className="inline mr-1" /> URL externa
                  </button>
                  <button type="button" onClick={() => setUploadMode('file')}
                    className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors ${uploadMode === 'file' ? 'bg-cyan-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-400'}`}>
                    <Clapperboard size={10} className="inline mr-1" /> Subir archivo
                  </button>
                </div>
                {uploadMode === 'url' ? (
                  <input type="url" required value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://www.youtube.com/watch?v=..." className={darkMode ? "w-full p-3 rounded-xl border text-xs font-mono bg-gray-950 border-white/5 text-white" : "w-full p-3 rounded-xl border text-xs font-mono bg-cyan-50/10 border-cyan-200 text-black"} />
                ) : (
                  <div className={darkMode ? "w-full p-3 rounded-xl border border-white/5 bg-gray-950" : "w-full p-3 rounded-xl border border-gray-200 bg-[var(--clr-base)]"}>
                    <input type="file" accept=".mp4,.mov,.webm,.mkv,video/*"
                      onChange={(e) => setArchivoVideoFile(e.target.files[0] || null)}
                      className="text-xs text-gray-400 file:mr-3 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-[10px] file:font-bold file:bg-cyan-600 file:text-white hover:file:bg-cyan-500 cursor-pointer w-full" />
                    {archivoVideoFile && (
                      <p className="text-[10px] text-gray-400 mt-1.5 font-mono">
                        {archivoVideoFile.name} · {(archivoVideoFile.size / 1024 / 1024).toFixed(1)} MB
                      </p>
                    )}
                    <p className="text-[9px] text-gray-500 mt-1">Máx. 2 GB · MP4, MOV, WebM, MKV</p>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">Descripción</label>
                <textarea rows="3" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} className={darkMode ? "w-full p-3 rounded-xl border text-xs bg-gray-950 border-white/5 text-white resize-none" : "w-full p-3 rounded-xl border text-xs bg-[var(--clr-base)] border-gray-200 text-black resize-none"} />
              </div>
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input type="checkbox" checked={esPremiumAlta} onChange={(e) => setEsPremiumAlta(e.target.checked)} className="w-4 h-4 rounded accent-amber-500 cursor-pointer" />
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider inline-flex items-center gap-1.5"><Star size={12} className="fill-current text-amber-500" /> Contenido exclusivo Premium</span>
              </label>
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input type="checkbox" checked={esVisibleAlta} onChange={(e) => setEsVisibleAlta(e.target.checked)} className="w-4 h-4 rounded accent-cyan-500 cursor-pointer" />
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider inline-flex items-center gap-1.5"><Eye size={12} /> Visible públicamente</span>
              </label>
              <button type="submit" className="w-full font-bold py-3.5 px-4 rounded-xl text-xs uppercase tracking-widest bg-cyan-600 text-white shadow-md">Publicar Clase</button>
            </form>
          </div>
          )}
        </div>
      )}

      {/* Modal de edición de quiz */}
      <Modal open={Boolean(editandoQuiz)} onClose={() => setEditandoQuiz(null)} title="Quiz de la lección" icon={ClipboardCheck} darkMode={darkMode} maxWidth="max-w-lg">
        {cargandoQuiz ? (
          <p className="text-center py-8 text-xs text-gray-400 uppercase tracking-wider animate-pulse">Cargando quiz...</p>
        ) : (
          <form onSubmit={handleGuardarQuiz} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">Título (opcional)</label>
                <input type="text" value={quizForm.titulo} onChange={(e) => setQuizForm(prev => ({ ...prev, titulo: e.target.value }))} placeholder="Quiz de la lección..."
                  className={darkMode ? "w-full p-2.5 rounded-xl border text-xs bg-gray-950 border-white/5 text-white" : "w-full p-2.5 rounded-xl border text-xs bg-[var(--clr-base)] border-gray-200 text-black"} />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">Aprobación mínima %</label>
                <input type="number" min="1" max="100" value={quizForm.min_aprobacion} onChange={(e) => setQuizForm(prev => ({ ...prev, min_aprobacion: Number(e.target.value) }))}
                  className={darkMode ? "w-full p-2.5 rounded-xl border text-xs bg-gray-950 border-white/5 text-white" : "w-full p-2.5 rounded-xl border text-xs bg-[var(--clr-base)] border-gray-200 text-black"} />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-[10px] font-bold text-gray-400 uppercase">Preguntas</label>
                <button type="button" onClick={agregarPregunta} className="text-[9px] font-black uppercase tracking-wider text-cyan-500 hover:text-cyan-400">+ Añadir pregunta</button>
              </div>

              {quizForm.preguntas.map((p, pi) => (
                <div key={pi} className={`p-3 rounded-2xl border ${darkMode ? 'border-white/5 bg-gray-950/40' : 'border-gray-200 bg-[var(--clr-base)]'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-bold text-gray-400">{pi + 1}.</span>
                    <input type="text" value={p.pregunta} onChange={(e) => { const n = [...quizForm.preguntas]; n[pi] = { ...n[pi], pregunta: e.target.value }; setQuizForm(prev => ({ ...prev, preguntas: n })); }} placeholder="Escribe la pregunta..."
                      className={darkMode ? "flex-1 p-2 rounded-xl border text-[11px] bg-gray-950 border-white/5 text-white" : "flex-1 p-2 rounded-xl border text-[11px] bg-white border-gray-200 text-black"} />
                    <button type="button" onClick={() => eliminarPregunta(pi)} className="text-red-500 hover:text-red-400 shrink-0"><X size={14} /></button>
                  </div>
                  {p.opciones.map((opt, oi) => (
                    <div key={oi} className="flex items-center gap-2 ml-5 mt-1">
                      <input type="radio" name={`correcta_${pi}`} checked={p.correcta === oi} onChange={() => { const n = [...quizForm.preguntas]; n[pi] = { ...n[pi], correcta: oi }; setQuizForm(prev => ({ ...prev, preguntas: n })); }}
                        className="w-3 h-3 accent-amber-500 cursor-pointer" />
                      <input type="text" value={opt} onChange={(e) => { const n = [...quizForm.preguntas]; n[pi].opciones[oi] = e.target.value; setQuizForm(prev => ({ ...prev, preguntas: n })); }} placeholder={`Opción ${oi + 1}`}
                        className={darkMode ? "flex-1 p-1.5 rounded-lg border text-[10px] bg-gray-950 border-white/5 text-white" : "flex-1 p-1.5 rounded-lg border text-[10px] bg-white border-gray-200 text-black"} />
                      {p.opciones.length > 2 && (
                        <button type="button" onClick={() => { const n = [...quizForm.preguntas]; n[pi].opciones.splice(oi, 1); if (n[pi].correcta >= n[pi].opciones.length) n[pi].correcta = 0; setQuizForm(prev => ({ ...prev, preguntas: n })); }} className="text-gray-400 hover:text-red-500 shrink-0"><X size={12} /></button>
                      )}
                    </div>
                  ))}
                  {p.opciones.length < 6 && (
                    <button type="button" onClick={() => { const n = [...quizForm.preguntas]; n[pi].opciones.push(''); setQuizForm(prev => ({ ...prev, preguntas: n })); }} className="text-[9px] font-bold text-cyan-500 uppercase ml-5 mt-1.5 hover:text-cyan-400">+ Añadir opción</button>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-2 text-[10px] font-black uppercase tracking-wider">
              <button type="button" onClick={handleEliminarQuiz} className="px-4 py-2 rounded-xl text-red-500 hover:bg-red-500/10">Eliminar Quiz</button>
              <button type="button" onClick={() => setEditandoQuiz(null)} className="px-4 py-2 rounded-xl text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5">Cancelar</button>
              <button type="submit" className="bg-cyan-600 text-white px-5 py-2 rounded-xl shadow-md hover:bg-cyan-500 transition-colors">Guardar Quiz</button>
            </div>
          </form>
        )}
      </Modal>

    </div>
  );
}