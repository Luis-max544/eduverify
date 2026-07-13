import React, { useState, useRef, useEffect } from 'react';
import { Menu, Bell, GraduationCap, Settings, Heart, History, FolderOpen, LogOut, Plus, Search, X } from 'lucide-react';

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
  const [mostrarMenu, setMostrarMenu]   = useState(false);
  const [mostrarBell, setMostrarBell]   = useState(false);
  const [busquedaMovil, setBusquedaMovil] = useState(false);

  const menuRef      = useRef(null);
  const bellRef      = useRef(null);
  const searchRef    = useRef(null);
  const fotoPerfil   = usuario?.avatar_url || '';

  const noLeidas    = notificaciones.filter(n => !n.leida).length;
  const esProfesor  = usuario?.rol === 'profesor' || usuario?.rol === 'creador';
  const badgeCount  = noLeidas > 99 ? '99+' : noLeidas;

  // Outside-click dismiss for both menus
  useEffect(() => {
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMostrarMenu(false);
      if (bellRef.current && !bellRef.current.contains(e.target)) setMostrarBell(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // ⌘K / Ctrl+K focuses search
  useEffect(() => {
    function handleKey(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (searchRef.current) {
          searchRef.current.focus();
        } else {
          setBusquedaMovil(true);
        }
      }
      if (e.key === 'Escape') {
        setBusquedaMovil(false);
        setMostrarMenu(false);
        setMostrarBell(false);
      }
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, []);

  // Focus search input when mobile search opens
  useEffect(() => {
    if (busquedaMovil && searchRef.current) searchRef.current.focus();
  }, [busquedaMovil]);

  function handleBell() {
    if (!mostrarBell && noLeidas > 0) marcarNotificacionesLeidas?.();
    setMostrarBell(v => !v);
    setMostrarMenu(false);
  }

  const navBg     = darkMode ? 'bg-[var(--clr-base)] border-[var(--clr-border-subtle)]' : 'bg-[var(--clr-surface)] border-[var(--clr-border-subtle)]';
  const inputCls  = darkMode
    ? 'bg-[var(--clr-surface)] border-[var(--clr-border)] text-[var(--clr-text-primary)] placeholder-[var(--clr-text-muted)]'
    : 'bg-[var(--clr-base)] border-[var(--clr-border)] text-[var(--clr-text-primary)] placeholder-[var(--clr-text-muted)]';
  const dropBg    = darkMode ? 'bg-[var(--clr-surface)] border-[var(--clr-border)]' : 'bg-[var(--clr-surface)] border-[var(--clr-border-subtle)]';
  const hoverCls  = darkMode ? 'hover:bg-[var(--clr-surface-elevated)]' : 'hover:bg-[var(--clr-base)]';

  return (
    <nav className={`fixed top-0 left-0 right-0 h-16 border-b z-40 select-none font-sans transition-colors duration-300 ${navBg}`}>
      <div className="flex items-center justify-between h-full px-4">

        {/* LEFT */}
        <div className="flex items-center gap-3">
          {setSidebarAmpliado && sidebarAmpliado !== undefined && (
            <button
              type="button"
              onClick={() => setSidebarAmpliado(!sidebarAmpliado)}
              className={`p-2 rounded-lg transition-colors text-[var(--clr-text-muted)] ${hoverCls}`}
              aria-label="Alternar sidebar"
            >
              <Menu size={18} />
            </button>
          )}

          <div
            onClick={() => setVista('catalogo')}
            className="flex items-center gap-2 cursor-pointer group"
            role="link"
            tabIndex={0}
            onKeyDown={e => e.key === 'Enter' && setVista('catalogo')}
            aria-label="EduVerify — inicio"
          >
            <div className="w-5 h-5 border-2 border-[var(--clr-accent)] rounded rotate-45 flex items-center justify-center group-hover:scale-105 transition-transform">
              <div className="w-1.5 h-1.5 bg-[var(--clr-accent)] rounded-sm" />
            </div>
            <span className="text-sm font-bold tracking-tight text-[var(--clr-text-primary)] group-hover:text-[var(--clr-accent)] transition-colors">
              EduVerify
            </span>
          </div>
        </div>

        {/* CENTER — desktop search */}
        <div className="hidden sm:flex flex-1 max-w-md mx-6">
          <div className="relative w-full">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--clr-text-muted)]" />
            <input
              ref={searchRef}
              type="text"
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              placeholder="Buscar contenido…"
              className={`w-full pl-9 pr-12 py-2 text-sm rounded-full border outline-none transition-all focus:border-[var(--clr-accent)] focus:ring-2 focus:ring-[var(--clr-accent)]/20 ${inputCls}`}
            />
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--clr-text-muted)] text-xs font-mono pointer-events-none select-none">⌘K</kbd>
          </div>
        </div>

        {/* RIGHT */}
        <div className="flex items-center gap-2">

          {/* Mobile search toggle */}
          <button
            type="button"
            onClick={() => setBusquedaMovil(v => !v)}
            className={`sm:hidden p-2 rounded-lg transition-colors text-[var(--clr-text-muted)] ${hoverCls}`}
            aria-label="Buscar"
          >
            <Search size={16} />
          </button>

          {/* Upload CTA — professors only */}
          {esProfesor && (
            <button
              type="button"
              onClick={() => abrirPanelProfesor('subir')}
              className="hidden sm:inline-flex items-center gap-1.5 bg-[var(--clr-accent)] hover:opacity-90 text-white text-xs font-semibold px-4 py-1.5 rounded-full transition-all active:scale-95 shadow-sm"
            >
              <Plus size={13} /> Subir
            </button>
          )}

          {/* Bell */}
          <div ref={bellRef} className="relative">
            <button
              type="button"
              onClick={handleBell}
              className={`p-2 rounded-lg transition-colors text-[var(--clr-text-muted)] relative ${hoverCls}`}
              aria-label={`Notificaciones${noLeidas > 0 ? ` — ${noLeidas} sin leer` : ''}`}
            >
              <Bell size={16} />
              {noLeidas > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-[var(--clr-danger)] text-white text-[10px] font-bold rounded-full flex items-center justify-center px-0.5 leading-none">
                  {badgeCount}
                </span>
              )}
            </button>

            {mostrarBell && (
              <div className={`absolute right-0 top-11 w-72 rounded-2xl border shadow-2xl animate-fade-in z-50 overflow-hidden ${dropBg}`}>
                <div className="px-4 py-3 border-b border-[var(--clr-border-subtle)]">
                  <p className="text-sm font-semibold text-[var(--clr-text-primary)]">Notificaciones</p>
                </div>
                <div className="max-h-72 overflow-y-auto divide-y divide-[var(--clr-border-subtle)]">
                  {notificaciones.length === 0 ? (
                    <p className="text-xs text-[var(--clr-text-muted)] text-center py-6">Sin notificaciones</p>
                  ) : notificaciones.slice(0, 10).map((n, i) => (
                    <div key={i} className={`px-4 py-3 text-xs ${!n.leida ? 'bg-[var(--clr-accent-muted)]' : ''}`}>
                      <p className="text-[var(--clr-text-primary)] font-medium leading-snug">{n.mensaje || n.message || n.texto || 'Notificación'}</p>
                      {n.created_at && (
                        <p className="text-[var(--clr-text-muted)] mt-0.5 font-mono text-[11px]">
                          {new Date(n.created_at).toLocaleDateString('es', { day: 'numeric', month: 'short' })}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Avatar + dropdown */}
          <div ref={menuRef} className="relative">
            <button
              type="button"
              onClick={() => { setMostrarMenu(v => !v); setMostrarBell(false); }}
              className="w-8 h-8 rounded-full bg-[var(--clr-accent)] border-2 border-[var(--clr-border)] font-semibold text-white text-xs flex items-center justify-center overflow-hidden hover:opacity-90 shrink-0 transition-all active:scale-95"
              aria-label="Menú de usuario"
            >
              {fotoPerfil
                ? <img src={fotoPerfil} alt="Perfil" className="w-full h-full object-cover" />
                : <span>{usuario?.nombre?.charAt(0).toUpperCase() || 'U'}</span>
              }
            </button>

            {mostrarMenu && (
              <div className={`absolute right-0 top-11 w-52 rounded-2xl border shadow-2xl p-2 space-y-0.5 animate-fade-in z-50 ${dropBg}`}>
                <div className="px-3 py-2 border-b border-[var(--clr-border-subtle)] mb-1">
                  <p className="text-sm font-semibold text-[var(--clr-text-primary)] truncate">{usuario?.nombre || 'Usuario'}</p>
                  <p className="text-xs text-[var(--clr-text-muted)] truncate font-mono mt-0.5">{usuario?.email}</p>
                  {usuario?.rol && (
                    <span className={`text-[10px] font-semibold mt-1.5 inline-block px-2 py-0.5 rounded-full ${esProfesor ? 'bg-[var(--clr-accent-muted)] text-[var(--clr-accent)]' : 'bg-emerald-500/10 text-emerald-500'}`}>
                      {usuario.rol}
                    </span>
                  )}
                </div>

                {esProfesor && (
                  <button type="button" onClick={() => { abrirPanelProfesor('canal'); setMostrarMenu(false); }}
                    className={`w-full text-left text-sm px-3 py-2 rounded-xl font-medium text-[var(--clr-accent)] transition-colors flex items-center gap-2 ${hoverCls}`}>
                    <GraduationCap size={14} /> Mi canal
                  </button>
                )}
                <button type="button" onClick={() => { setVista('configuracion'); setMostrarMenu(false); }}
                  className={`w-full text-left text-sm px-3 py-2 rounded-xl font-medium text-[var(--clr-text-primary)] transition-colors flex items-center gap-2 ${hoverCls}`}>
                  <Settings size={14} /> Configuración
                </button>
                <button type="button" onClick={() => { setVista('favoritos'); setMostrarMenu(false); }}
                  className={`w-full text-left text-sm px-3 py-2 rounded-xl font-medium text-[var(--clr-text-primary)] transition-colors flex items-center gap-2 ${hoverCls}`}>
                  <Heart size={14} /> Favoritos
                </button>
                <button type="button" onClick={() => { setVista('historial'); setMostrarMenu(false); }}
                  className={`w-full text-left text-sm px-3 py-2 rounded-xl font-medium text-[var(--clr-text-primary)] transition-colors flex items-center gap-2 ${hoverCls}`}>
                  <History size={14} /> Historial
                </button>
                <button type="button" onClick={() => { setVista('videos-guardados'); setMostrarMenu(false); }}
                  className={`w-full text-left text-sm px-3 py-2 rounded-xl font-medium text-[var(--clr-text-primary)] transition-colors flex items-center gap-2 ${hoverCls}`}>
                  <FolderOpen size={14} /> Guardados
                </button>
                <button type="button" onClick={() => { cerrarSesion(); setMostrarMenu(false); }}
                  className="w-full text-left text-sm px-3 py-2 rounded-xl font-medium text-[var(--clr-danger)] hover:bg-[var(--clr-danger)]/10 border-t border-[var(--clr-border-subtle)] mt-1 pt-2 transition-colors flex items-center gap-2">
                  <LogOut size={14} /> Cerrar sesión
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile search expand row */}
      {busquedaMovil && (
        <div className={`sm:hidden flex items-center gap-2 px-4 py-2 border-t border-[var(--clr-border-subtle)] ${darkMode ? 'bg-[var(--clr-base)]' : 'bg-[var(--clr-surface)]'} animate-fade-in`}>
          <div className="relative flex-1">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--clr-text-muted)]" />
            <input
              ref={searchRef}
              type="text"
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              placeholder="Buscar contenido…"
              className={`w-full pl-8 pr-3 py-2 text-sm rounded-full border outline-none focus:border-[var(--clr-accent)] ${inputCls}`}
            />
          </div>
          <button type="button" onClick={() => { setBusquedaMovil(false); setBusqueda(''); }}
            className={`p-2 rounded-lg text-[var(--clr-text-muted)] ${hoverCls}`}>
            <X size={15} />
          </button>
        </div>
      )}
    </nav>
  );
}
