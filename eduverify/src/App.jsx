import React, { useState, useEffect } from 'react';
import * as api from './api';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Catalogo from './components/Catalogo';
import Login from './components/Login';
import Reproductor from './components/Reproductor';
import PanelProfesor from './components/PanelProfesor';
import PasarelaPrueba from './components/PasarelaPrueba';
import Favoritos from './components/Favoritos';
import Historial from './components/Historial';
import Playlists from './components/Playlists'; 
import Canal from './components/Canal';
import Configuracion from './components/Configuracion';
import CursoDetalle from './components/CursoDetalle';
import MisCursos from './components/MisCursos';
import Breadcrumbs from './components/Breadcrumbs';
import { ToastProvider } from './components/Toast';
import Modal from './components/Modal';

export default function App() {
  // 🌙 Modo oscuro
  const [darkMode, setDarkMode] = useState(false);
  
  // 👤 Usuario (se hidrata desde el API con el token guardado)
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(() => Boolean(api.getToken()));

  // 📱 Vista actual
  const [vista, setVista] = useState('login');

  // 🎬 Video seleccionado
  const [videoSeleccionado, setVideoSeleccionado] = useState(null);
  
  // 📂 Sidebar
  const [sidebarAmpliado, setSidebarAmpliado] = useState(true);
  
  // ❤️ Favoritos
  const [favoritos, setFavoritos] = useState([]);
  
  // 📜 Historial
  const [historial, setHistorial] = useState([]);
  
  // 🎥 Canal seleccionado
  const [canalSeleccionado, setCanalSeleccionado] = useState(null);

  // 🎓 Cursos: id del curso abierto (vista 'curso') y curso en contexto del reproductor
  const [cursoSeleccionado, setCursoSeleccionado] = useState(null);
  const [cursoActivo, setCursoActivo] = useState(null);

  // 👨‍🏫 Subvista del panel profesor ('canal' | 'subir') — elevada para abrir "subir" directo desde el Navbar
  const [profesorSubVista, setProfesorSubVista] = useState('canal');

  // 🎓 Origen del curso abierto ('mis-cursos' | 'canal') — para breadcrumbs contextuales
  const [cursoOrigen, setCursoOrigen] = useState('mis-cursos');

  // 🔍 Búsqueda del Navbar → filtra en Catálogo
  const [busqueda, setBusqueda] = useState('');

  // 🔒 Modal de acceso premium
  const [premiumVideo, setPremiumVideo] = useState(null);

  const abrirPanelProfesor = (sub = 'canal') => {
    setProfesorSubVista(sub);
    setVista('profesor');
  };
  
  // 🔄 Parámetros de reset
  const [paramsReset, setParamsReset] = useState(null);

  // 🔔 SUSCRIPCIONES Y NOTIFICACIONES (GLOBALES)
  const [suscripciones, setSuscripciones] = useState([]);
  const [notificaciones, setNotificaciones] = useState([]);

  // 📹 Videos globales
  const [videosDemo, setVideosDemo] = useState([]);

  // 🎓 Cursos públicos del catálogo
  const [cursosPublicos, setCursosPublicos] = useState([]);

  // 🧹 Limpieza única de claves de la implementación localStorage anterior
  useEffect(() => {
    ['usuario_eduverify', 'eduverify_videos_globales', 'eduverify_suscripciones', 'eduverify_notificaciones']
      .forEach(k => localStorage.removeItem(k));
    Object.keys(localStorage)
      .filter(k => k.startsWith('eduverify_foto_') || k.startsWith('eduverify_banner_') ||
                   k.startsWith('eduverify_listas_') || k.startsWith('eduverify_playlists_creadas_') ||
                   k.startsWith('eduverify_foros_video_'))
      .forEach(k => localStorage.removeItem(k));
  }, []);

  // 🔄 Rehidratar sesión desde el token guardado
  useEffect(() => {
    if (!api.getToken()) return;
    api.users.me()
      .then(user => {
        setUsuario(user);
        setDarkMode(Boolean(user.dark_mode));
        setVista('catalogo');
      })
      .catch(() => api.clearToken())
      .finally(() => setCargando(false));
  }, []);

  // Sync data-theme on <html> so :root[data-theme] tokens override the OS prefers-color-scheme media query
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  // 📥 Hidratar datos del usuario al iniciar sesión
  useEffect(() => {
    if (!usuario) return;
    api.videos.list({ page: 1, limit: 50 }).then(d => setVideosDemo(d.items)).catch(() => {});
    api.cursos.list({ limit: 48 }).then(d => setCursosPublicos(d.items)).catch(() => {});
    api.favorites.list().then(setFavoritos).catch(() => {});
    api.history.list().then(setHistorial).catch(() => {});
    api.subscriptions.list().then(setSuscripciones).catch(() => {});
    api.notifications.list().then(setNotificaciones).catch(() => {});
  }, [usuario?.id]);

  // 🔁 Recargar catálogo (tras publicar/borrar videos)
  const recargarVideos = () => {
    api.videos.list({ page: 1, limit: 50 }).then(d => setVideosDemo(d.items)).catch(() => {});
  };

  // 🔗 Manejar parámetros de reset de contraseña
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('action') === 'reset' && urlParams.get('id') && urlParams.get('token')) {
      setParamsReset({
        id: urlParams.get('id'),
        token: urlParams.get('token')
      });
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // 🔔 Manejar suscripciones (el backend genera la notificación al suscribirse)
  const toggleSuscripcion = async (professorId) => {
    if (!professorId) return;
    const estaSuscrito = suscripciones.some(s => s.professor_id === professorId);
    try {
      if (estaSuscrito) {
        await api.subscriptions.remove(professorId);
      } else {
        await api.subscriptions.add(professorId);
      }
      api.subscriptions.list().then(setSuscripciones).catch(() => {});
      api.notifications.list().then(setNotificaciones).catch(() => {});
    } catch (err) {
      console.error('Error al actualizar suscripción:', err.message);
    }
  };

  // 🔔 Marcar notificaciones como leídas
  const marcarNotificacionesLeidas = () => {
    if (!notificaciones.some(n => !n.leida)) return;
    api.notifications.readAll()
      .then(() => setNotificaciones(prev => prev.map(n => ({ ...n, leida: true }))))
      .catch(() => {});
  };

  // 🌙 Dark mode: cambio local instantáneo + persistencia en el servidor
  const cambiarDarkMode = (valor) => {
    setDarkMode(valor);
    if (usuario) api.users.updateDarkMode(valor).catch(() => {});
  };

  // 🚪 Cerrar sesión
  const cerrarSesion = () => {
    api.clearToken();
    setUsuario(null);
    setVista('login');
    setVideoSeleccionado(null);
    setCanalSeleccionado(null);
    setCursoSeleccionado(null);
    setCursoActivo(null);
    setCursosPublicos([]);
    setFavoritos([]);
    setHistorial([]);
    setSuscripciones([]);
    setNotificaciones([]);
  };

  // 🚪 Logout forzado cuando el API responde 401
  useEffect(() => {
    const onLogout = () => cerrarSesion();
    window.addEventListener('auth:logout', onLogout);
    return () => window.removeEventListener('auth:logout', onLogout);
  }, []);

  // 🎬 Seleccionar y registrar video en historial (fuera de contexto de curso)
  const seleccionarYRegistrarVideo = (video) => {
    if (video?.es_premium && !usuario?.premium && usuario?.id !== video?.autor_id) {
      setPremiumVideo(video);
      return;
    }
    setCursoActivo(null);
    setVideoSeleccionado(video);
    setVista('reproductor');
    setHistorial(prev => [video, ...prev.filter(v => v.id !== video.id)]);
    api.videos.view(video.id).catch(() => {});
    api.history.add(video.id).catch(() => {});
  };

  // 🎓 Abrir curso desde catálogo público (con premium gate)
  const abrirCursoPublico = (curso) => {
    if (curso.es_premium && !usuario?.premium && usuario?.id !== curso.autor?.id) {
      setPremiumVideo(curso);
      return;
    }
    abrirCurso(curso.id, 'catalogo');
  };

  // 🎓 Abrir la vista de detalle de un curso
  const abrirCurso = (cursoId, origen = 'mis-cursos') => {
    if (!cursoId) return;
    setCursoOrigen(origen);
    setCursoSeleccionado(cursoId);
    setVista('curso');
  };

  // 🎓 Abrir una lección manteniendo el contexto del curso en el reproductor
  const abrirLeccionDeCurso = (video, cursoId) => {
    if (video?.es_premium && !usuario?.premium && usuario?.id !== video?.autor_id) {
      setPremiumVideo(video);
      return;
    }
    setCursoActivo(cursoId);
    setVideoSeleccionado(video);
    setVista('reproductor');
    setHistorial(prev => [video, ...prev.filter(v => v.id !== video.id)]);
    api.videos.view(video.id).catch(() => {});
    api.history.add(video.id).catch(() => {});
  };

  // 👨‍🏫 Abrir canal de profesor (Canal carga perfil/videos/playlists desde el API)
  const abrirCanalProfesor = (autorId) => {
    if (!autorId) return;
    setCanalSeleccionado({ id: autorId });
    setVista('canal');
  };

  // ⏳ Splash mientras se rehidrata la sesión
  if (cargando) {
    return (
      <div className={darkMode ? "dark" : ""}>
        <div className="min-h-screen flex items-center justify-center bg-[var(--clr-base)]">
          <p className="text-sm font-semibold tracking-wider uppercase text-gray-400 animate-pulse">Cargando EduVerify...</p>
        </div>
      </div>
    );
  }

  // 🔒 Si no hay usuario, mostrar Login
  if (!usuario) {
    return (
      <div className={darkMode ? "dark" : ""}>
        <div className={darkMode ? "min-h-screen font-sans antialiased flex flex-col transition-colors duration-300 bg-gray-950 text-gray-100" : "min-h-screen font-sans antialiased flex flex-col transition-colors duration-300 bg-[var(--clr-base)] text-[var(--clr-text-primary)]"}>
          <div className="flex flex-1 pt-16 relative">
            <main className="flex-1 p-4 md:p-6 overflow-y-auto w-full">
              <Login 
                setVista={setVista} 
                setUsuario={setUsuario} 
                paramsReset={paramsReset}
                setParamsReset={setParamsReset}
              />
            </main>
          </div>
        </div>
      </div>
    );
  }

  // 🏠 App principal
  return (
    <ToastProvider>
    <div className={darkMode ? "dark" : ""}>
      <div className="min-h-screen font-sans antialiased flex flex-col transition-colors duration-300 bg-[var(--clr-base)] text-[var(--clr-text-primary)]">
        
        {/* Navbar */}
        <Navbar 
          usuario={usuario} 
          vista={vista}
          setVista={setVista} 
          cerrarSesion={cerrarSesion}
          sidebarAmpliado={sidebarAmpliado}
          setSidebarAmpliado={setSidebarAmpliado}
          darkMode={darkMode}
          notificaciones={notificaciones}
          marcarNotificacionesLeidas={marcarNotificacionesLeidas}
          abrirPanelProfesor={abrirPanelProfesor}
          busqueda={busqueda}
          setBusqueda={setBusqueda}
        />

        <div className="flex flex-1 pt-16 relative">
          
          {/* Sidebar */}
          <Sidebar 
            sidebarAmpliado={sidebarAmpliado}
            vista={vista === 'videos-guardados' ? 'playlists' : vista}
            setVista={(v) => {
              if (v === 'profesor') setProfesorSubVista('canal');
              setVista(v === 'playlists' ? 'videos-guardados' : v);
            }}
            usuario={usuario}
            darkMode={darkMode}
            setDarkMode={cambiarDarkMode}
          />

          {/* Contenido principal */}
          <main className="flex-1 p-4 md:p-6 overflow-y-auto w-full">
            <Breadcrumbs
              vista={vista}
              setVista={setVista}
              videoSeleccionado={videoSeleccionado}
              cursoSeleccionado={cursoSeleccionado}
              canalSeleccionado={canalSeleccionado}
              cursoActivo={cursoActivo}
              cursoOrigen={cursoOrigen}
              abrirCurso={abrirCurso}
              subVista={profesorSubVista}
              setSubVista={setProfesorSubVista}
              darkMode={darkMode}
            />
            {vista === 'catalogo' && (
              <Catalogo
                cursosPublicos={cursosPublicos}
                abrirCurso={abrirCursoPublico}
                abrirCanalProfesor={abrirCanalProfesor}
                busqueda={busqueda}
                darkMode={darkMode}
              />
            )}

            {vista === 'reproductor' && (
              <Reproductor
                video={videoSeleccionado}
                usuario={usuario}
                setVista={setVista}
                darkMode={darkMode}
                favoritos={favoritos}
                setFavoritos={setFavoritos}
                abrirCanalProfesor={abrirCanalProfesor}
                videosGlobales={videosDemo}
                setVideoSeleccionado={seleccionarYRegistrarVideo}
                suscripciones={suscripciones}
                toggleSuscripcion={toggleSuscripcion}
                cursoActivoId={cursoActivo}
                abrirLeccionDeCurso={abrirLeccionDeCurso}
              />
            )}

            {vista === 'profesor' && (
              <PanelProfesor
                usuario={usuario}
                setUsuario={setUsuario}
                setVista={setVista}
                darkMode={darkMode}
                videosGlobales={videosDemo}
                recargarVideos={recargarVideos}
                subVista={profesorSubVista}
                setSubVista={setProfesorSubVista}
              />
            )}

            {vista === 'premium' && (
              <PasarelaPrueba 
                usuario={usuario} 
                setUsuario={setUsuario} 
                setVista={setVista} 
                darkMode={darkMode} 
              />
            )}

            {vista === 'configuracion' && (
              <Configuracion 
                usuario={usuario} 
                setUsuario={setUsuario} 
                setVista={setVista} 
                darkMode={darkMode} 
              />
            )}

            {vista === 'favoritos' && (
              <Favoritos
                favoritos={favoritos}
                setFavoritos={setFavoritos}
                setVideoSeleccionado={seleccionarYRegistrarVideo}
              />
            )}

            {vista === 'historial' && (
              <Historial 
                historial={historial} 
                setVideoSeleccionado={seleccionarYRegistrarVideo} 
              />
            )}

            {vista === 'videos-guardados' && (
              <Playlists
                usuario={usuario}
                setVideoSeleccionado={seleccionarYRegistrarVideo}
              />
            )}

            {vista === 'canal' && (
              <Canal
                canal={canalSeleccionado}
                setVideoSeleccionado={seleccionarYRegistrarVideo}
                abrirCurso={(id) => abrirCurso(id, 'canal')}
                usuario={usuario}
              />
            )}

            {vista === 'curso' && (
              <CursoDetalle
                cursoId={cursoSeleccionado}
                usuario={usuario}
                setVista={setVista}
                darkMode={darkMode}
                abrirCanalProfesor={abrirCanalProfesor}
                abrirLeccionDeCurso={abrirLeccionDeCurso}
              />
            )}

            {vista === 'mis-cursos' && (
              <MisCursos
                darkMode={darkMode}
                abrirCurso={abrirCurso}
                setVista={setVista}
              />
            )}
          </main>
        </div>
      </div>
    </div>

      <Modal open={Boolean(premiumVideo)} onClose={() => setPremiumVideo(null)} title="Contenido Premium" darkMode={darkMode} maxWidth="max-w-sm">
        <div className="space-y-4 text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-amber-500/10 flex items-center justify-center">
            <svg className="w-8 h-8 text-amber-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
          </div>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 leading-relaxed">
            Este contenido es exclusivo para miembros <span className="font-black text-amber-500">Premium</span>. Activa tu membresía para acceder a todas las clases avanzadas.
          </p>
          <div className="flex gap-2.5 pt-2">
            <button onClick={() => setPremiumVideo(null)} className="flex-1 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors">Volver</button>
            <button onClick={() => { setPremiumVideo(null); setVista('premium'); }} className="flex-1 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-amber-500 text-gray-950 shadow-md hover:bg-amber-400 transition-colors">Activar Premium</button>
          </div>
        </div>
      </Modal>

    </ToastProvider>
  );
}