import React, { useState, useEffect } from 'react';
import {
  Palette, Clapperboard, Folder, ListVideo, GraduationCap, ChevronUp, ChevronDown,
  Image, User, X, ArrowLeft, Link, Star, Plus, Eye, EyeOff
} from 'lucide-react';
import { videos as videosApi, users as usersApi, profesorPlaylists } from '../api';

const CATEGORIAS = ['Programación', 'Ciberseguridad', 'Matemáticas', 'Electrónica', 'Arte'];

export default function PanelProfesor({ usuario, setUsuario, setVista, darkMode, videosGlobales = [], recargarVideos, setVideoSeleccionado, subVista = 'canal', setSubVista = () => {} }) {
  const [pestanaStudio, setPestanaStudio] = useState('VIDEOS');

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
  const [nuevaPlaylistNombre, setNuevaPlaylistNombre] = useState('');
  const [misPlaylists, setMisPlaylists] = useState([]);

  // Formulario de Alta de Videos Nuevos
  const [tituloLeccion, setTituloLeccion] = useState('');
  const [especialidad, setEspecialidad] = useState('Programación');
  const [videoUrl, setVideoUrl] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [esPremiumAlta, setEsPremiumAlta] = useState(false);
  const [esVisibleAlta, setEsVisibleAlta] = useState(true);
  const [videoSeleccionadoCurso, setVideoSeleccionadoCurso] = useState(null);
  const [editando, setEditando] = useState(null);
  const [editForm, setEditForm] = useState({ titulo: '', descripcion: '', categoria: 'Programación', es_premium: false, visible: true });

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
      alert("¡Diseño del canal guardado y actualizado con éxito!");
    } catch (err) {
      alert(`Error al guardar el diseño: ${err.message}`);
    }
  };

  // CRUD PLAYLISTS: Crear, Renombrar, Eliminar (API)
  const handleCrearPlaylistVacia = async (e) => {
    e.preventDefault();
    const nombre = nuevaPlaylistNombre.trim();
    if (!nombre) return;
    if (misPlaylists.some(p => p.nombre === nombre)) return alert("Ya tienes un curso con ese nombre.");
    try {
      await profesorPlaylists.create(nombre);
      cargarPlaylists();
      setNuevaPlaylistNombre('');
    } catch (err) {
      alert(`Error al crear el curso: ${err.message}`);
    }
  };

  const handleRenombrarPlaylist = async (playlist) => {
    const nuevoNombre = prompt(`Modificar nombre del curso "${playlist.nombre}" a:`, playlist.nombre);
    if (!nuevoNombre || !nuevoNombre.trim() || nuevoNombre.trim() === playlist.nombre) return;
    const nombreLimpio = nuevoNombre.trim();
    if (misPlaylists.some(p => p.nombre === nombreLimpio)) return alert("Ya existe otro curso con ese nombre.");
    try {
      await profesorPlaylists.update(playlist.id, { nombre: nombreLimpio });
      cargarPlaylists();
    } catch (err) {
      alert(`Error al renombrar el curso: ${err.message}`);
    }
  };

  // 🎓 Edición de curso: descripción + orden de lecciones
  const [playlistExpandida, setPlaylistExpandida] = useState(null);
  const [descEdit, setDescEdit] = useState('');

  const toggleGestionarPlaylist = (playlist) => {
    if (playlistExpandida === playlist.id) {
      setPlaylistExpandida(null);
    } else {
      setPlaylistExpandida(playlist.id);
      setDescEdit(playlist.descripcion || '');
    }
  };

  const handleGuardarDescripcion = async (playlist) => {
    try {
      await profesorPlaylists.update(playlist.id, { descripcion: descEdit.trim() || null });
      cargarPlaylists();
      alert('Descripción guardada.');
    } catch (err) {
      alert(`Error al guardar la descripción: ${err.message}`);
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
      alert(`Error al reordenar: ${err.message}`);
    }
  };

  const handleEliminarPlaylist = async (playlist) => {
    if (!confirm(`¿Estás seguro de eliminar el curso "${playlist.nombre}"?`)) return;
    try {
      await profesorPlaylists.remove(playlist.id);
      cargarPlaylists();
    } catch (err) {
      alert(`Error al eliminar el curso: ${err.message}`);
    }
  };

  // Añadir video existente a un curso
  const handleAnadirLeccion = async (e, playlist) => {
    e.preventDefault();
    if (!videoSeleccionadoCurso) return;
    try {
      await profesorPlaylists.addVideo(playlist.id, videoSeleccionadoCurso);
      cargarPlaylists();
      setVideoSeleccionadoCurso(null);
    } catch (err) {
      alert(`Error al añadir la lección: ${err.message}`);
    }
  };

  // CRUD VIDEOS (el API deduce autor y usuario_id del token)
  const handlePublicarClase = async (e) => {
    e.preventDefault();
    if (!tituloLeccion.trim() || !videoUrl.trim()) return alert('Completa el título y la URL del video.');

    try {
      await videosApi.create({
        titulo: tituloLeccion.trim(),
        descripcion: descripcion.trim(),
        url_video: videoUrl.trim(),
        categoria: especialidad,
        es_premium: esPremiumAlta,
        visible: esVisibleAlta,
      });
      alert('¡Clase publicada con éxito!');
      if (recargarVideos) recargarVideos();
      cargarMisVideos();
      setTituloLeccion(''); setDescripcion(''); setVideoUrl(''); setEsPremiumAlta(false); setEsVisibleAlta(true);
      setSubVista('canal');
    } catch (err) {
      alert(`Error al publicar la clase: ${err.message}`);
    }
  };

  const handleEliminarVideo = async (idVideo) => {
    if (!confirm("¿Deseas eliminar este video de tu canal definitivamente?")) return;
    try {
      await videosApi.remove(idVideo);
      if (recargarVideos) recargarVideos();
      cargarMisVideos();
    } catch (err) {
      alert(`Error al eliminar el video: ${err.message}`);
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
      alert('Cambios guardados.');
    } catch (err) {
      alert(`Error al guardar: ${err.message}`);
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
              <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-blue-900/20 dark:to-gray-900"></div>
            )}
            <div className="absolute inset-0 flex items-center justify-center opacity-10 font-black text-4xl md:text-7xl uppercase tracking-tighter text-gray-600 dark:text-white">
              EDUVERIFY CREATOR
            </div>
          </div>

          {/* PERFIL */}
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6 px-2 mb-10">
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-blue-600 border-4 border-white dark:border-gray-950 shadow-xl flex items-center justify-center text-4xl text-white font-bold shrink-0 overflow-hidden">
              {fotoCustom ? (
                <img src={fotoCustom} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                usuario?.nombre?.charAt(0).toUpperCase() || 'P'
      )}

      {/* Modal de edición de video */}
      {editando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-fade-in">
          <div className={`w-full max-w-lg p-6 rounded-[2rem] border shadow-2xl space-y-4 ${darkMode ? 'bg-gray-900 border-white/10 text-white' : 'bg-white border-gray-200 text-gray-900'}`}>
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider text-blue-600">Editar video</h3>
              <p className="text-[10px] text-gray-400 font-medium">{editando.titulo}</p>
            </div>

            <form onSubmit={handleGuardarEdicion} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">Título</label>
                <input type="text" required value={editForm.titulo} onChange={(e) => setEditForm(prev => ({ ...prev, titulo: e.target.value }))}
                  className={darkMode ? "w-full p-3 rounded-xl border text-xs bg-gray-950 border-white/5 text-white" : "w-full p-3 rounded-xl border text-xs bg-gray-50 border-gray-200 text-black"} />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">Descripción</label>
                <textarea rows="3" value={editForm.descripcion} onChange={(e) => setEditForm(prev => ({ ...prev, descripcion: e.target.value }))}
                  className={darkMode ? "w-full p-3 rounded-xl border text-xs bg-gray-950 border-white/5 text-white resize-none" : "w-full p-3 rounded-xl border text-xs bg-gray-50 border-gray-200 text-black resize-none"} />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">Categoría</label>
                <select value={editForm.categoria} onChange={(e) => setEditForm(prev => ({ ...prev, categoria: e.target.value }))}
                  className={darkMode ? "w-full p-3 rounded-xl border text-xs bg-gray-950 border-white/5 text-white" : "w-full p-3 rounded-xl border text-xs bg-gray-50 border-gray-200 text-black"}>
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
                  className="w-4 h-4 rounded accent-blue-500 cursor-pointer" />
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider inline-flex items-center gap-1.5"><Eye size={12} /> Visible públicamente</span>
              </label>
              <div className="flex justify-end gap-2 pt-2 text-[10px] font-black uppercase tracking-wider">
                <button type="button" onClick={() => setEditando(null)} className="px-4 py-2 rounded-xl text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5">Cancelar</button>
                <button type="submit" className="bg-blue-600 text-white px-5 py-2 rounded-xl shadow-md hover:bg-blue-500 transition-colors">Guardar Cambios</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">
                  {usuario?.nombre || 'Profesor'}
                </h1>
                <span className="bg-blue-500/10 text-blue-500 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border border-blue-500/20">Tu canal</span>
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
                className="flex-1 md:flex-none bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 px-6 rounded-full text-xs shadow-lg shadow-blue-600/10 transition-transform active:scale-95 inline-flex items-center justify-center gap-1.5"
              >
                <Plus size={14} /> Subir Video
              </button>
            </div>
          </div>

          {/* TABS DE STUDIO */}
          <div className="flex gap-6 border-b border-gray-200 dark:border-white/[0.04] mb-6 px-2">
            <button onClick={() => setPestanaStudio('VIDEOS')} className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${pestanaStudio === 'VIDEOS' ? 'border-blue-500 text-gray-900 dark:text-white' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>Videos</button>
            <button onClick={() => setPestanaStudio('PLAYLISTS')} className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${pestanaStudio === 'PLAYLISTS' ? 'border-blue-500 text-gray-900 dark:text-white' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>Cursos</button>
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
                      <div key={v.id || Math.random()} className={darkMode ? "flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl border transition-colors bg-gray-950/40 border-white/5 hover:bg-gray-950" : "flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl border transition-colors bg-gray-50 border-gray-100 hover:bg-white"}
                        ><div onClick={() => { if(setVideoSeleccionado) { setVideoSeleccionado(v); setVista('reproductor'); } }} className="w-full sm:w-40 aspect-video bg-gray-900 rounded-xl overflow-hidden border border-white/5 shrink-0 relative flex items-center justify-center cursor-pointer hover:opacity-90">
                          {urlMiniatura ? <img src={urlMiniatura} alt="" className="w-full h-full object-cover" /> : <Clapperboard size={28} className="opacity-30 text-white" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 onClick={() => { if(setVideoSeleccionado) { setVideoSeleccionado(v); setVista('reproductor'); } }} className={`text-sm font-bold truncate cursor-pointer hover:text-blue-500 transition-colors ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            {v.titulo}
                            {v.es_premium && <span className="ml-2 bg-amber-500/10 text-amber-500 text-[8px] font-black uppercase px-1.5 py-0.5 rounded inline-flex items-center gap-1 align-middle"><Star size={9} className="fill-current" /> Premium</span>}
                            {!v.visible && <span className="ml-2 bg-red-500/10 text-red-500 text-[8px] font-black uppercase px-1.5 py-0.5 rounded inline-flex items-center gap-1 align-middle"><EyeOff size={9} /> Oculto</span>}
                          </h4>
                          <div className="flex gap-3 mt-1 text-[10px] text-gray-400 font-medium font-mono"><span className="text-blue-500 font-bold uppercase">{v.categoria || 'Lección'}</span><span>• {v.vistas || 0} vistas</span></div>
                        </div>
                        <div className="flex gap-2 w-full sm:w-auto">
                          <button onClick={() => abrirEditor(v)} className="flex-1 sm:flex-none text-[10px] font-bold uppercase py-2 px-4 bg-blue-500/10 text-blue-500 rounded-lg hover:bg-blue-500 hover:text-white transition-colors">Editar</button>
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
                <form onSubmit={handleCrearPlaylistVacia} className="flex gap-2 max-w-md text-left">
                  <input type="text" required value={nuevaPlaylistNombre} onChange={(e) => setNuevaPlaylistNombre(e.target.value)} placeholder="Nombre del nuevo curso..." className={darkMode ? "flex-1 p-2.5 rounded-xl border text-xs bg-gray-950 border-white/5 text-white outline-none" : "flex-1 p-2.5 rounded-xl border text-xs bg-gray-50 border-gray-200 text-black outline-none"} />
                  <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white font-black text-[10px] uppercase tracking-widest px-5 py-2 rounded-xl">Crear</button>
                </form>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                  {misPlaylists.map((playlist) => {
                    const videosDeLista = playlist.videos || [];
                    const primerVideo = videosDeLista[0] || {};
                    const ytId = obtenerYoutubeId(primerVideo.url_video);
                    const miniaturaPlaylist = ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : null;

                    return (
                      <div key={playlist.id} className="flex flex-col gap-2 p-3 rounded-2xl border border-gray-100 dark:border-white/[0.04] bg-gray-50/40 dark:bg-gray-900/10">
                        <div onClick={() => { if (videosDeLista.length > 0 && setVideoSeleccionado) { setVideoSeleccionado(primerVideo); setVista('reproductor'); } }} className="w-full aspect-video bg-gray-900 rounded-xl overflow-hidden relative border border-gray-200/10 shadow-md cursor-pointer hover:opacity-95">
                          {miniaturaPlaylist ? <img src={miniaturaPlaylist} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gradient-to-br from-blue-900/20 to-gray-950 flex items-center justify-center opacity-30"><Folder size={28} className="text-white" /></div>}
                          <div className="absolute right-0 top-0 bottom-0 w-2/5 bg-black/70 backdrop-blur-[4px] flex flex-col items-center justify-center text-white border-l border-white/5 space-y-1">
                            <ListVideo size={16} /><span className="text-[10px] font-black font-mono uppercase">{videosDeLista.length} videos</span>
                          </div>
                        </div>
                        <div className="space-y-1 pt-1 flex flex-col flex-1 justify-between">
                          <div>
                            <h4 className={`text-xs font-black uppercase tracking-wide truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>{playlist.nombre}</h4>
                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Creado por ti</p>
                          </div>
                          <div className="grid grid-cols-2 gap-2 pt-3 border-t border-gray-100 dark:border-white/5 mt-3">
                            <button onClick={() => handleRenombrarPlaylist(playlist)} className="text-[9px] font-black uppercase py-1.5 px-2 bg-blue-500/10 text-blue-500 rounded-md hover:bg-blue-600 transition-colors">Renombrar</button>
                            <button onClick={() => handleEliminarPlaylist(playlist)} className="text-[9px] font-black uppercase py-1.5 px-2 bg-red-500/10 text-red-500 rounded-md hover:bg-red-600 transition-colors">Eliminar</button>
                          </div>
                          <button
                            onClick={() => toggleGestionarPlaylist(playlist)}
                            className={`w-full text-[9px] font-black uppercase py-1.5 px-2 rounded-md transition-colors mt-2 inline-flex items-center justify-center gap-1.5 ${
                              playlistExpandida === playlist.id ? 'bg-blue-600 text-white' : 'bg-gray-500/10 text-gray-500 hover:bg-gray-500/20'
                            }`}
                          >
                            {playlistExpandida === playlist.id ? 'Cerrar editor' : <><GraduationCap size={12} /> Gestionar curso</>}
                          </button>

                          {/* Editor de curso: descripción + orden de lecciones */}
                          {playlistExpandida === playlist.id && (
                            <div className="space-y-3 pt-3 border-t border-gray-100 dark:border-white/5 mt-2 animate-fade-in">
                              <div className="space-y-1.5">
                                <label className="block text-[9px] font-black uppercase text-gray-400">Descripción del curso</label>
                                <textarea
                                  rows={3}
                                  value={descEdit}
                                  onChange={(e) => setDescEdit(e.target.value)}
                                  placeholder="Describe de qué trata este curso..."
                                  className={darkMode ? "w-full p-2 rounded-lg border text-[11px] bg-gray-950 border-white/5 text-white resize-none outline-none" : "w-full p-2 rounded-lg border text-[11px] bg-gray-50 border-gray-200 text-black resize-none outline-none"}
                                />
                                <button
                                  onClick={() => handleGuardarDescripcion(playlist)}
                                  className="w-full text-[9px] font-black uppercase py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-md transition-colors"
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
                                      <button
                                        onClick={() => moverLeccion(playlist, idx, -1)}
                                        disabled={idx === 0}
                                        className="w-6 h-6 rounded-md bg-gray-500/10 text-gray-500 hover:bg-blue-500/20 hover:text-blue-500 disabled:opacity-30 shrink-0 inline-flex items-center justify-center"
                                      ><ChevronUp size={14} /></button>
                                      <button
                                        onClick={() => moverLeccion(playlist, idx, 1)}
                                        disabled={idx === videosDeLista.length - 1}
                                        className="w-6 h-6 rounded-md bg-gray-500/10 text-gray-500 hover:bg-blue-500/20 hover:text-blue-500 disabled:opacity-30 shrink-0 inline-flex items-center justify-center"
                                      ><ChevronDown size={14} /></button>
                                    </div>
                                  ))
                                )}
                              </div>

                              {/* Añadir lección a este curso */}
                              {(() => {
                                const asignados = new Set((playlist.videos || []).map(v => v.id));
                                const disponibles = misVideosPropios.filter(v => !asignados.has(v.id));
                                return disponibles.length > 0 ? (
                                  <div className="space-y-1.5">
                                    <label className="block text-[9px] font-black uppercase text-gray-400">Añadir lección</label>
                                    <form onSubmit={(e) => handleAnadirLeccion(e, playlist)} className="flex gap-2">
                                      <select
                                        defaultValue={videoSeleccionadoCurso || ''}
                                        onChange={(e) => setVideoSeleccionadoCurso(Number(e.target.value))}
                                        className={darkMode ? "flex-1 p-2 rounded-xl border text-[10px] bg-gray-950 border-white/5 text-white truncate" : "flex-1 p-2 rounded-xl border text-[10px] bg-gray-50 border-gray-200 text-black truncate"}
                                      >
                                        <option value="" disabled>Selecciona un video...</option>
                                        {disponibles.map(v => (
                                          <option key={v.id} value={v.id}>{v.titulo}</option>
                                        ))}
                                      </select>
                                      <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white font-black text-[10px] uppercase tracking-widest px-4 py-2 rounded-xl shrink-0">Añadir</button>
                                    </form>
                                  </div>
                                ) : null;
                              })()}

                            </div>
                          )}
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

      {/* 🎨 MODAL DE PERSONALIZACIÓN COMPLETAMENTE CORREGIDO (NADA DE LINKS) */}
      {mostrarPersonalizar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-fade-in">
          <div className={`w-full max-w-md p-6 rounded-[2rem] border shadow-2xl space-y-4 ${darkMode ? 'bg-gray-900 border-white/10 text-white' : 'bg-white border-gray-200 text-gray-900'}`}>
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider text-blue-600">Personalización del Estudio</h3>
              <p className="text-[10px] text-gray-400 font-medium">Actualiza las portadas y firmas estéticas subiendo archivos desde tu equipo</p>
            </div>
            
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
                    <span className="text-[11px] font-bold text-blue-500 hover:underline">Seleccionar archivo del equipo</span>
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
                    <span className="text-[11px] font-bold text-blue-500 hover:underline">Seleccionar foto de perfil</span>
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
                <button type="submit" className="bg-blue-600 text-white px-5 py-2 rounded-xl shadow-md hover:bg-blue-500 transition-colors">Guardar Diseño</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FORMULARIO DE ALTA MULTIMEDIA */}
      {subVista === 'subir' && (
        <div className="max-w-4xl mx-auto">
          <button onClick={() => setSubVista('canal')} className="mb-4 inline-flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-white transition"><ArrowLeft size={14} /> Volver</button>
          <div className={darkMode ? "p-6 md:p-8 rounded-3xl border bg-gray-900 border-white/5 shadow-xl" : "p-6 md:p-8 rounded-3xl border bg-white border-gray-200 shadow-xl"}>
            <form onSubmit={handlePublicarClase} className="space-y-5 text-left">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">Título</label>
                  <input type="text" required value={tituloLeccion} onChange={(e) => setTituloLeccion(e.target.value)} placeholder="Ej: Introducción a React" className={darkMode ? "w-full p-3 rounded-xl border text-xs bg-gray-950 border-white/5 text-white" : "w-full p-3 rounded-xl border text-xs bg-gray-50 border-gray-200 text-black"} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">Materia</label>
                  <select value={especialidad} onChange={(e) => setEspecialidad(e.target.value)} className={darkMode ? "w-full p-3 rounded-xl border text-xs bg-gray-950 border-white/5 text-white" : "w-full p-3 rounded-xl border text-xs bg-gray-50 border-gray-200 text-black"}>
                    {CATEGORIAS.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-blue-500 mb-1.5 inline-flex items-center gap-1.5"><Link size={12} /> URL del Video</label>
                <input type="url" required value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://www.youtube.com/watch?v=..." className={darkMode ? "w-full p-3 rounded-xl border text-xs font-mono bg-gray-950 border-white/5 text-white" : "w-full p-3 rounded-xl border text-xs font-mono bg-blue-50/10 border-blue-200 text-black"} />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">Descripción</label>
                <textarea rows="3" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} className={darkMode ? "w-full p-3 rounded-xl border text-xs bg-gray-950 border-white/5 text-white resize-none" : "w-full p-3 rounded-xl border text-xs bg-gray-50 border-gray-200 text-black resize-none"} />
              </div>
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input type="checkbox" checked={esPremiumAlta} onChange={(e) => setEsPremiumAlta(e.target.checked)} className="w-4 h-4 rounded accent-amber-500 cursor-pointer" />
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider inline-flex items-center gap-1.5"><Star size={12} className="fill-current text-amber-500" /> Contenido exclusivo Premium</span>
              </label>
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input type="checkbox" checked={esVisibleAlta} onChange={(e) => setEsVisibleAlta(e.target.checked)} className="w-4 h-4 rounded accent-blue-500 cursor-pointer" />
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider inline-flex items-center gap-1.5"><Eye size={12} /> Visible públicamente</span>
              </label>
              <button type="submit" className="w-full font-bold py-3.5 px-4 rounded-xl text-xs uppercase tracking-widest bg-blue-600 text-white shadow-md">Publicar Clase</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}