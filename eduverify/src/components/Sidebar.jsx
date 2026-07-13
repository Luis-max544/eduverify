import React from 'react';
import { Home, Heart, History, Folder, GraduationCap, Clapperboard, Moon, Sun, Star, Gem } from 'lucide-react';

export default function Sidebar({ sidebarAmpliado, vista, setVista, usuario, darkMode, setDarkMode }) {

  const esProfesor = usuario?.rol === 'profesor' || usuario?.rol === 'creador';

  const menuNav = [
    { id: 'catalogo',        nombre: 'Inicio',         icono: Home },
    { id: 'favoritos',       nombre: 'Favoritos',      icono: Heart },
    { id: 'historial',       nombre: 'Historial',      icono: History },
    { id: 'playlists',       nombre: 'Guardados',      icono: Folder },
    { id: 'mis-cursos',      nombre: 'Mis cursos',     icono: GraduationCap },
    ...(esProfesor ? [{ id: 'profesor', nombre: 'Mi canal', icono: Clapperboard }] : []),
  ];

  const surfaceCls = darkMode
    ? 'bg-[var(--clr-base)] border-[var(--clr-border-subtle)] text-[var(--clr-text-muted)]'
    : 'bg-[var(--clr-surface)] border-[var(--clr-border-subtle)] text-[var(--clr-text-muted)]';

  return (
    <aside
      className={`fixed md:sticky md:top-16 z-40 h-[calc(100vh-4rem)] transition-all duration-300 shrink-0 flex flex-col justify-between overflow-hidden border-r
        ${sidebarAmpliado ? 'w-56 px-3' : 'w-0 px-0 border-r-0 pointer-events-none opacity-0'}
        ${surfaceCls}
      `}
    >
      {/* NAV */}
      <div className="space-y-0.5 pt-4 min-w-[200px]">
        {sidebarAmpliado && (
          <span className="text-xs font-semibold text-[var(--clr-text-muted)] uppercase tracking-widest block px-3 mb-3 opacity-60">
            Menú
          </span>
        )}

        <nav className="space-y-0.5">
          {menuNav.map((item) => {
            const isActive = vista === item.id
              || (item.id === 'catalogo' && (vista === 'reproductor' || vista === 'curso'));
            const Icono = item.icono;
            return (
              <button
                key={item.id}
                onClick={() => setVista(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all relative
                  ${isActive
                    ? 'text-[var(--clr-accent)] bg-[var(--clr-accent-muted)]'
                    : darkMode
                      ? 'text-[var(--clr-text-muted)] hover:bg-[var(--clr-surface)] hover:text-[var(--clr-text-primary)]'
                      : 'text-[var(--clr-text-muted)] hover:bg-[var(--clr-base)] hover:text-[var(--clr-text-primary)]'
                  }
                `}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-[var(--clr-accent)] rounded-r-full" />
                )}
                <Icono size={17} className="shrink-0" />
                {sidebarAmpliado && <span className="truncate">{item.nombre}</span>}
              </button>
            );
          })}
        </nav>

        {/* THEME TOGGLE */}
        <div className="pt-4 mt-2 border-t border-[var(--clr-border-subtle)]">
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
              ${darkMode
                ? 'text-[var(--clr-text-muted)] hover:bg-[var(--clr-surface)] hover:text-[var(--clr-text-primary)]'
                : 'text-[var(--clr-text-muted)] hover:bg-[var(--clr-base)] hover:text-[var(--clr-text-primary)]'
              }
            `}
          >
            {darkMode
              ? <Moon size={17} className="shrink-0" />
              : <Sun size={17} className="shrink-0" />
            }
            {sidebarAmpliado && <span>{darkMode ? 'Modo oscuro' : 'Modo claro'}</span>}
          </button>
        </div>
      </div>

      {/* PREMIUM */}
      <div className="pb-5 pt-3 border-t border-[var(--clr-border-subtle)] min-w-[200px]">
        <button
          onClick={() => setVista('premium')}
          className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all
            ${vista === 'premium' ? 'ring-2 ring-[var(--clr-accent)] ring-offset-2 ' + (darkMode ? 'ring-offset-[var(--clr-base)]' : 'ring-offset-[var(--clr-surface)]') : ''}
            ${usuario?.premium
              ? 'bg-[var(--clr-premium)]/10 text-[var(--clr-premium)]'
              : 'bg-[var(--clr-accent)] text-white hover:opacity-90 shadow-sm'
            }
          `}
        >
          {usuario?.premium
            ? <Star size={15} className="shrink-0 fill-current" />
            : <Gem size={15} className="shrink-0" />
          }
          {sidebarAmpliado && (
            <span>{usuario?.premium ? 'Premium activo' : 'Ser Premium'}</span>
          )}
        </button>
      </div>
    </aside>
  );
}
