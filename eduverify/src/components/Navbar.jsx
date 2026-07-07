import React, { useState } from 'react';
import { Menu, Bell, GraduationCap, Settings, Heart, History, FolderOpen, X, Plus } from 'lucide-react';

export default function Navbar({
  usuario,
  setVista,
  cerrarSesion,
  notificaciones = [],
  marcarNotificacionesLeidas,
  darkMode,
  sidebarAmpliado,
  setSidebarAmpliado,
  abrirPanelProfesor = () => {},
  busqueda = '',
  setBusqueda = () => {}
}) {
  const [mostrarMenu, setMostrarMenu] = useState(false);
  const fotoPerfil = usuario?.avatar_url || '';

  const notificacionesNoLeidas = notificaciones.filter(n => !n.leida).length;
  const esProfesor = usuario?.rol === 'profesor' || usuario?.rol === 'creador';

  return (
    <nav className={`fixed top-0 left-0 right-0 h-16 border-b z-40 flex items-center justify-between px-4 select-none font-sans transition-colors duration-300 ${
      darkMode
        ? 'bg-gray-950 border-white/5 text-white'
        : 'bg-white border-gray-200 text-black'
    }`}>

      {/* SECCIÓN IZQUIERDA */}
      <div className="flex items-center gap-3">
        {/* Botón para colapsar/expandir sidebar */}
        {setSidebarAmpliado && sidebarAmpliado !== undefined && (
          <button
            type="button"
            onClick={() => setSidebarAmpliado(!sidebarAmpliado)}
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 transition-colors text-gray-500"
          >
            <Menu size={18} />
          </button>
        )}

        {/* Logo */}
        <div
          onClick={() => setVista('catalogo')}
          className="flex items-center gap-2 cursor-pointer select-none group"
        >
          <div className="w-5 h-5 border-2 border-blue-600 rounded rotate-45 flex items-center justify-center group-hover:scale-105 transition-transform">
            <div className="w-1.5 h-1.5 bg-blue-600 rounded-sm"></div>
          </div>
          <span className="text-xs font-black tracking-widest uppercase font-mono bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400">
            EduVerify
          </span>
        </div>
      </div>

      {/* SECCIÓN CENTRAL - Barra de búsqueda */}
      <div className="hidden sm:flex max-w-md w-full mx-4">
        <div className="relative w-full">
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar contenido verificado..."
            className={`w-full px-4 py-2 text-xs rounded-full border outline-none transition-all focus:border-blue-500 ${
              darkMode
                ? 'bg-gray-900 border-white/5 text-white placeholder-gray-500'
                : 'bg-gray-50 border-gray-200 text-black placeholder-gray-400'
            }`}
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">
            ⌘K
          </span>
        </div>
      </div>

      {/* SECCIÓN DERECHA */}
      <div className="flex items-center gap-3 relative">
        {/* Subir video (acceso directo para profesor/creador) */}
        {esProfesor && (
          <button
            type="button"
            onClick={() => abrirPanelProfesor('subir')}
            className="hidden sm:inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black uppercase tracking-wider px-4 py-2 rounded-full transition-transform active:scale-95 shadow-sm shadow-blue-600/10"
          >
            <Plus size={14} /> Subir
          </button>
        )}

        {/* Campana de notificaciones */}
        <button
          type="button"
          onClick={() => marcarNotificacionesLeidas && marcarNotificacionesLeidas()}
          className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 text-gray-400 dark:text-gray-500 relative transition-colors"
        >
          <Bell size={16} />
          {notificacionesNoLeidas > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
          )}
        </button>

        {/* CONTENEDOR AVATAR */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setMostrarMenu(!mostrarMenu)}
            className="w-8 h-8 rounded-full bg-blue-600 border border-gray-200 dark:border-white/10 font-black text-white text-xs flex items-center justify-center overflow-hidden hover:opacity-90 shadow-sm shrink-0 transition-transform active:scale-95"
          >
            {fotoPerfil ? (
              <img src={fotoPerfil} alt="Perfil" className="w-full h-full object-cover" />
            ) : (
              <span>{usuario?.nombre?.charAt(0).toUpperCase() || 'U'}</span>
            )}
          </button>

          {/* MENÚ DESPLEGABLE */}
          {mostrarMenu && (
            <div className={`absolute right-0 top-11 w-52 rounded-2xl border shadow-2xl p-2.5 space-y-1 animate-fade-in z-50 ${
              darkMode
                ? 'bg-gray-950 border-white/10 text-white'
                : 'bg-white border-gray-200 text-gray-900'
            }`}>
              {/* Información del usuario */}
              <div className="px-2 py-1.5 border-b border-gray-100 dark:border-white/5 mb-1 text-left">
                <p className="text-xs font-black truncate uppercase">
                  {usuario?.nombre || 'Usuario'}
                </p>
                <p className="text-[10px] text-gray-400 font-medium truncate font-mono mt-0.5">
                  {usuario?.email}
                </p>
                {usuario?.rol && (
                  <span className={`text-[9px] font-bold uppercase tracking-wider mt-1 inline-block px-2 py-0.5 rounded-full ${
                    esProfesor
                      ? 'bg-blue-500/10 text-blue-500'
                      : 'bg-green-500/10 text-green-500'
                  }`}>
                    {usuario.rol}
                  </span>
                )}
              </div>

              {/* Panel de Profesor (solo para profesores/creadores) */}
              {esProfesor && (
                <button
                  type="button"
                  onClick={() => {
                    abrirPanelProfesor('canal');
                    setMostrarMenu(false);
                  }}
                  className="w-full text-left text-xs px-3 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 font-bold uppercase tracking-wide text-blue-500 transition-colors flex items-center gap-2"
                >
                  <GraduationCap size={14} /> Panel de Profesor
                </button>
              )}

              {/* Configuración */}
              <button
                type="button"
                onClick={() => {
                  setVista('configuracion');
                  setMostrarMenu(false);
                }}
                className="w-full text-left text-xs px-3 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 font-semibold text-gray-500 dark:text-gray-300 transition-colors flex items-center gap-2"
              >
                <Settings size={14} /> Configuración
              </button>

              {/* Mis favoritos */}
              <button
                type="button"
                onClick={() => {
                  setVista('favoritos');
                  setMostrarMenu(false);
                }}
                className="w-full text-left text-xs px-3 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 font-semibold text-gray-500 dark:text-gray-300 transition-colors flex items-center gap-2"
              >
                <Heart size={14} /> Mis favoritos
              </button>

              {/* Historial */}
              <button
                type="button"
                onClick={() => {
                  setVista('historial');
                  setMostrarMenu(false);
                }}
                className="w-full text-left text-xs px-3 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 font-semibold text-gray-500 dark:text-gray-300 transition-colors flex items-center gap-2"
              >
                <History size={14} /> Historial
              </button>

              {/* Videos guardados */}
              <button
                type="button"
                onClick={() => {
                  setVista('videos-guardados');
                  setMostrarMenu(false);
                }}
                className="w-full text-left text-xs px-3 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 font-semibold text-gray-500 dark:text-gray-300 transition-colors flex items-center gap-2"
              >
                <FolderOpen size={14} /> Videos guardados
              </button>

              {/* Cerrar Sesión */}
              <button
                type="button"
                onClick={() => {
                  cerrarSesion();
                  setMostrarMenu(false);
                }}
                className="w-full text-left text-xs p-2 py-2 text-red-500 hover:bg-red-500/10 rounded-xl font-bold border-t border-gray-100 dark:border-white/5 mt-1 transition-colors flex items-center gap-2"
              >
                <X size={14} /> Cerrar Sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
