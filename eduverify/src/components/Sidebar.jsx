import React from 'react';

export default function Sidebar({ sidebarAmpliado, vista, setVista, usuario, abrirCanalProfesor, darkMode, setDarkMode }) {
  
  const menuNav = [
    { id: 'catalogo', nombre: 'Principal', icono: '🏠' },
    { id: 'favoritos', nombre: 'Mis Favoritos', icono: '❤️' },
    { id: 'historial', nombre: 'Historial', icono: '🕒' },
    { id: 'playlists', nombre: 'Videos guardados', icono: '📁' }, 
  ];

  return (
    <aside 
      className={`fixed md:relative z-40 h-[calc(100vh-4rem)] transition-all duration-300 shrink-0 flex flex-col justify-between overflow-hidden
        ${sidebarAmpliado 
          ? 'w-64 px-4 border-r' 
          : 'w-0 px-0 border-r-0 pointer-events-none opacity-0'
        } 
        ${darkMode ? 'bg-gray-950 border-white/[0.04] text-gray-300' : 'bg-white border-gray-200 text-gray-600'}
      `}
    >
      {/* 1. SECCIÓN DE VISTAS / MENÚ PRINCIPAL */}
      <div className="space-y-1.5 pt-4 min-w-[224px]"> {/* min-w evita que los textos se deformen al colapsar */}
        {sidebarAmpliado && (
          <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 block px-3 mb-3">
            Navegación
          </span>
        )}
        
        <nav className="space-y-1">
          {menuNav.map((item) => {
            const isActive = vista === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setVista(item.id)}
                className={`w-full flex items-center gap-3.5 p-3 rounded-2xl text-xs font-bold transition-all uppercase tracking-wider
                  ${isActive 
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/10' 
                    : darkMode ? 'hover:bg-white/5 text-gray-400 hover:text-white' : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
                  }
                `}
              >
                <span className="text-base flex items-center justify-center shrink-0">{item.icono}</span>
                {sidebarAmpliado && <span className="truncate">{item.nombre}</span>}
              </button>
            );
          })}
        </nav>

        {/* CONTROLES EXTRA / PREAJUSTES */}
        <div className="pt-6 border-t border-gray-200 dark:border-white/[0.04] mt-4">
          {sidebarAmpliado && (
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 block px-3 mb-2">
              Preajustes
            </span>
          )}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`w-full flex items-center gap-3.5 p-3 rounded-2xl text-xs font-bold transition-all uppercase tracking-wider
              ${darkMode ? 'hover:bg-white/5 text-gray-400 hover:text-white' : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'}
            `}
          >
            <span className="text-base">{darkMode ? '🌙' : '☀️'}</span>
            {sidebarAmpliado && <span>{darkMode ? 'Oscuro' : 'Claro'}</span>}
          </button>
        </div>
      </div>

      {/* 2. INFORME INFERIOR DE MEMBRESÍA PREMIUM */}
      <div className="pb-6 pt-4 border-t border-gray-200 dark:border-white/[0.04] min-w-[224px]">
        <button
          onClick={() => setVista('premium')}
          className={`w-full flex items-center gap-3 p-3 rounded-2xl font-black text-[10px] uppercase tracking-widest text-center justify-center transition-all shadow-md
            ${usuario?.premium 
              ? 'bg-amber-500 text-gray-950 shadow-amber-500/10' 
              : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90 text-white shadow-blue-600/10'
            }
          `}
        >
          <span>{usuario?.premium ? '⭐ Premium Activo' : '💎 Membresía'}</span>
        </button>
      </div>

    </aside>
  );
}