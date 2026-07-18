import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NavigationProvider, useNavigation } from './context/NavigationContext';
import { SocialProvider, useSocial } from './context/SocialContext';
import { PlayerProvider, usePlayer } from './context/PlayerContext';
import { CatalogProvider } from './context/CatalogContext';
import { ToastProvider } from './components/Toast';
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
import Modal from './components/Modal';
import UploadProgressBar from './components/UploadProgressBar';

function AppShell() {
  const { usuario, darkMode, cargando } = useAuth();
  const { vista, setVista, premiumVideo, setPremiumVideo } = useNavigation();
  const { cursoActivo } = usePlayer();
  const { uploadQueue, dismissUpload } = useSocial();

  if (cargando) {
    return (
      <div className={darkMode ? 'dark' : ''}>
        <div className="min-h-screen flex items-center justify-center bg-[var(--clr-base)]">
          <p className="text-sm font-semibold tracking-wider uppercase text-gray-400 animate-pulse">Cargando EduVerify...</p>
        </div>
      </div>
    );
  }

  if (!usuario) {
    return (
      <div className={darkMode ? 'dark' : ''}>
        <div className={darkMode
          ? 'min-h-screen font-sans antialiased flex flex-col transition-colors duration-300 bg-gray-950 text-gray-100'
          : 'min-h-screen font-sans antialiased flex flex-col transition-colors duration-300 bg-[var(--clr-base)] text-[var(--clr-text-primary)]'
        }>
          <div className="flex flex-1 pt-16 relative">
            <main className="flex-1 p-4 md:p-6 overflow-y-auto w-full">
              <Login />
            </main>
          </div>
        </div>
      </div>
    );
  }

  const enCurso = vista === 'reproductor' && !!cursoActivo;

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className={`${enCurso ? 'h-screen overflow-hidden' : 'min-h-screen'} font-sans antialiased flex flex-col transition-colors duration-300 bg-[var(--clr-base)] text-[var(--clr-text-primary)]`}>

        {!enCurso && <Navbar />}

        <div className={`flex flex-1 relative ${!enCurso ? 'pt-16' : 'overflow-hidden'}`}>
          {!enCurso && <Sidebar />}

          <main className={`flex-1 w-full ${enCurso ? 'overflow-hidden' : 'p-4 md:p-6 overflow-y-auto'}`}>
            {!enCurso && <Breadcrumbs />}

            {vista === 'catalogo'        && <Catalogo />}
            {vista === 'reproductor'     && <Reproductor />}
            {vista === 'profesor'        && <PanelProfesor />}
            {vista === 'premium'         && <PasarelaPrueba />}
            {vista === 'configuracion'   && <Configuracion />}
            {vista === 'favoritos'       && <Favoritos />}
            {vista === 'historial'       && <Historial />}
            {vista === 'videos-guardados'&& <Playlists />}
            {vista === 'canal'           && <Canal />}
            {vista === 'curso'           && <CursoDetalle />}
            {vista === 'mis-cursos'      && <MisCursos />}
          </main>
        </div>
      </div>

      <UploadProgressBar uploads={uploadQueue} onDismiss={dismissUpload} />

      <Modal
        open={Boolean(premiumVideo)}
        onClose={() => setPremiumVideo(null)}
        title="Contenido Premium"
        darkMode={darkMode}
        maxWidth="max-w-sm"
      >
        <div className="space-y-4 text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-amber-500/10 flex items-center justify-center">
            <svg className="w-8 h-8 text-amber-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
          </div>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 leading-relaxed">
            Este contenido es exclusivo para miembros{' '}
            <span className="font-black text-amber-500">Premium</span>.
            Activa tu membresía para acceder a todas las clases avanzadas.
          </p>
          <div className="flex gap-2.5 pt-2">
            <button
              onClick={() => setPremiumVideo(null)}
              className="flex-1 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
            >
              Volver
            </button>
            <button
              onClick={() => { setPremiumVideo(null); setVista('premium'); }}
              className="flex-1 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-amber-500 text-gray-950 shadow-md hover:bg-amber-400 transition-colors"
            >
              Activar Premium
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NavigationProvider>
        <SocialProvider>
          <PlayerProvider>
            <CatalogProvider>
              <ToastProvider>
                <AppShell />
              </ToastProvider>
            </CatalogProvider>
          </PlayerProvider>
        </SocialProvider>
      </NavigationProvider>
    </AuthProvider>
  );
}
