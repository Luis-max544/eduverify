import React, { useState, useEffect } from 'react';
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
  
  // 👤 Usuario
  const [usuario, setUsuario] = useState(() => {
    const sesionGuardada = localStorage.getItem('usuario_eduverify');
    return sesionGuardada ? JSON.parse(sesionGuardada) : null;
  });
  
  // 📱 Vista actual
  const [vista, setVista] = useState(() => {
    const sesionGuardada = localStorage.getItem('usuario_eduverify');
    return sesionGuardada ? 'catalogo' : 'login';
  });

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
  const [suscripciones, setSuscripciones] = useState(() => {
    const guardadas = localStorage.getItem('eduverify_suscripciones');
    return guardadas ? JSON.parse(guardadas) : [];
  });

  const [notificaciones, setNotificaciones] = useState(() => {
    const guardadas = localStorage.getItem('eduverify_notificaciones');
    return guardadas ? JSON.parse(guardadas) : [];
  });

  // 📹 Videos globales
  const [videosDemo, setVideosDemo] = useState(() => {
    const guardados = localStorage.getItem('eduverify_videos_globales');
    return guardados ? JSON.parse(guardados) : [];
  });

  // 💾 Persistir videos
  useEffect(() => {
    localStorage.setItem('eduverify_videos_globales', JSON.stringify(videosDemo));
  }, [videosDemo]);

  // 💾 Persistir suscripciones
  useEffect(() => {
    localStorage.setItem('eduverify_suscripciones', JSON.stringify(suscripciones));
  }, [suscripciones]);

  // 💾 Persistir notificaciones
  useEffect(() => {
    localStorage.setItem('eduverify_notificaciones', JSON.stringify(notificaciones));
  }, [notificaciones]);

  // 🔄 Sincronizar sesión
  useEffect(() => {
    const sesionGuardada = localStorage.getItem('usuario_eduverify');
    if (!sesionGuardada) {
      setUsuario(null);
      setVista('login');
    }
  }, []);

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

  // 🔔 Manejar suscripciones
  const toggleSuscripcion = (profesorNombre) => {
    const estaSuscrito = suscripciones.find(s => s.nombre === profesorNombre);
    if (estaSuscrito) {
      setSuscripciones(suscripciones.filter(s => s.nombre !== profesorNombre));
    } else {
      setSuscripciones([...suscripciones, { nombre: profesorNombre, notificaciones: true }]);
      const nuevaNotif = { 
        id: Date.now(), 
        msg: `Te has suscrito a ${profesorNombre}`, 
        fecha: 'Ahora' 
      };
      setNotificaciones([nuevaNotif, ...notificaciones]);
    }
  };

  // 🚪 Cerrar sesión
  const cerrarSesion = () => {
    localStorage.removeItem('usuario_eduverify');
    setUsuario(null);
    setVista('login');
    setVideoSeleccionado(null);
    setCanalSeleccionado(null);
  };

  // 🎬 Seleccionar y registrar video en historial
  const seleccionarYRegistrarVideo = (video) => {
    setVideoSeleccionado(video);
    setVista('reproductor');
    setHistorial(prev => [video, ...prev.filter(v => v.id !== video.id)]);
  };

  // 👨‍🏫 Abrir canal de profesor
  const abrirCanalProfesor = (nombreProfesor) => {
    setCanalSeleccionado({ 
      nombre: nombreProfesor, 
      handle: "@docente_utn", 
      subs: "14.2K", 
      videosCont: videosDemo.length, 
      inicial: nombreProfesor.charAt(0).toUpperCase(), 
      descripcion: "Profesor verificado de EduVerify." 
    });
    setVista('canal');
  };

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
            setDarkMode={setDarkMode}
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
                setVista={setVista} 
                darkMode={darkMode} 
                setVideosGlobales={setVideosDemo} 
                videosGlobales={videosDemo} 
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
                setVideoSeleccionado={seleccionarYRegistrarVideo} 
              />
            )}

            {vista === 'canal' && (
              <Canal 
                canal={canalSeleccionado} 
                setVideoSeleccionado={seleccionarYRegistrarVideo} 
                videosDemo={videosDemo} 
              />
            )}
          </main>
        </div>
      </div>
    </div>
  );
}