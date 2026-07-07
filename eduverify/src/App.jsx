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
  
  // 🔄 Parámetros de reset
  const [paramsReset, setParamsReset] = useState(null);

  // 🔔 SUSCRIPCIONES Y NOTIFICACIONES (GLOBALES)
  const [suscripciones, setSuscripciones] = useState([]);
  const [notificaciones, setNotificaciones] = useState([]);

  // 📹 Videos globales
  const [videosDemo, setVideosDemo] = useState([]);

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

  // 📥 Hidratar datos del usuario al iniciar sesión
  useEffect(() => {
    if (!usuario) return;
    api.videos.list({ page: 1, limit: 50 }).then(d => setVideosDemo(d.items)).catch(() => {});
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

  // 🎬 Seleccionar y registrar video en historial
  const seleccionarYRegistrarVideo = (video) => {
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
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
          <p className="text-sm font-semibold tracking-wider uppercase text-gray-400 animate-pulse">Cargando EduVerify...</p>
        </div>
      </div>
    );
  }

  // 🔒 Si no hay usuario, mostrar Login
  if (!usuario) {
    return (
      <div className={darkMode ? "dark" : ""}>
        <div className={darkMode ? "min-h-screen font-sans antialiased flex flex-col transition-colors duration-300 bg-gray-950 text-gray-100" : "min-h-screen font-sans antialiased flex flex-col transition-colors duration-300 bg-gray-50 text-gray-950"}>
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
    <div className={darkMode ? "dark" : ""}>
      <div className={darkMode ? "min-h-screen font-sans antialiased flex flex-col transition-colors duration-300 bg-gray-950 text-gray-100" : "min-h-screen font-sans antialiased flex flex-col transition-colors duration-300 bg-gray-50 text-gray-950"}>
        
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
        />

        <div className="flex flex-1 pt-16 relative">
          
          {/* Sidebar */}
          <Sidebar 
            sidebarAmpliado={sidebarAmpliado}
            vista={vista === 'videos-guardados' ? 'playlists' : vista} 
            setVista={(v) => setVista(v === 'playlists' ? 'videos-guardados' : v)}
            usuario={usuario}
            abrirCanalProfesor={abrirCanalProfesor}
            darkMode={darkMode}
            setDarkMode={cambiarDarkMode}
          />

          {/* Contenido principal */}
          <main className="flex-1 p-4 md:p-6 overflow-y-auto w-full">
            {vista === 'catalogo' && (
              <Catalogo 
                setVista={setVista} 
                setVideoSeleccionado={seleccionarYRegistrarVideo} 
                usuario={usuario}
                videosDemo={videosDemo}
                favoritos={favoritos}
                setFavoritos={setFavoritos}
                abrirCanalProfesor={abrirCanalProfesor}
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
              />
            )}
          </main>
        </div>
      </div>
    </div>
  );
}