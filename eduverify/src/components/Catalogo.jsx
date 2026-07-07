import React, { useState } from 'react';

export default function Catalogo({ setVista, setVideoSeleccionado, usuario, videosDemo = [], favoritos = [], setFavoritos, abrirCanalProfesor, darkMode }) {
  // Categorías académicas oficiales de EduVerify
  const categorias = ['Todos', 'Programación', 'Ciberseguridad', 'Matemáticas', 'Electrónica', 'Arte'];
  const [categoriaActiva, setCategoriaActiva] = useState('Todos');

  // Helper para extraer la miniatura de YouTube si aplica
  const obtenerYoutubeId = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  // 🔍 FILTRADO INTELIGENTE: Filtrar los videos según la pestaña de categoría seleccionada
  const videosFiltrados = videosDemo.filter((v) => {
    if (categoriaActiva === 'Todos') return true;
    return v.categoria?.toLowerCase().includes(categoriaActiva.toLowerCase());
  });

  return (
    <div className="space-y-7 animate-fade-in select-none font-sans pb-16">
      
      {/* 1. BARRA DE CATEGORÍAS ACADÉMICAS (ESTILO YOUTUBE PILLS) */}
      <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-none items-center px-1">
        {categorias.map((cat) => {
          const isActive = categoriaActiva === cat;
          return (
            <button
              key={cat}
              onClick={() => setCategoriaActiva(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all border shrink-0
                ${isActive 
                  ? 'bg-gray-950 text-white border-gray-950 dark:bg-white dark:text-gray-950 dark:border-white shadow-md shadow-blue-500/5' 
                  : darkMode 
                    ? 'bg-transparent border-white/10 text-gray-400 hover:text-white hover:bg-white/5' 
                    : 'bg-white border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }
              `}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* 2. GRILLA PRINCIPAL DE VIDEO-CLASES DE PRODUCCIÓN */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h3 className={`text-xs font-black uppercase tracking-widest ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Clases Recomendadas {categoriaActiva !== 'Todos' && `• ${categoriaActiva}`}
          </h3>
          <span className="text-[10px] font-mono font-bold text-gray-400 bg-gray-100 dark:bg-white/5 px-2.5 py-0.5 rounded-lg">
            {videosFiltrados.length} {videosFiltrados.length === 1 ? 'módulo' : 'módulos'}
          </span>
        </div>

        {videosFiltrados.length === 0 ? (
          <div className="min-h-[300px] flex flex-col items-center justify-center border-2 border-dashed rounded-[2rem] border-gray-200 dark:border-white/5 p-6 text-center">
            <span className="text-3xl mb-2 opacity-40">🎬</span>
            <p className="text-xs font-black uppercase tracking-widest text-gray-400">No hay contenido en esta área</p>
            <p className="text-[11px] text-gray-500 mt-1 max-w-xs">Los profesores de este módulo aún no han publicado video-clases para esta categoría.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8">
            {videosFiltrados.map((video) => {
              const ytId = obtenerYoutubeId(video.url_video);
              const urlMiniatura = ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : null;
              
              return (
                <div 
                  key={video.id}
                  onClick={() => setVideoSeleccionado(video)}
                  className="flex flex-col gap-3 group cursor-pointer text-left relative"
                >
                  {/* Tarjeta de Miniatura Premium */}
                  <div className="w-full aspect-video bg-gray-900 rounded-2xl overflow-hidden border border-gray-200 dark:border-white/5 relative shadow-sm group-hover:shadow-lg transition-all duration-300">
                    {urlMiniatura ? (
                      <img 
                        src={urlMiniatura} 
                        alt={video.titulo} 
                        className="w-full h-full object-cover group-hover:scale-[1.03] transition duration-500" 
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-blue-900/20 to-gray-950 flex items-center justify-center">
                        <span className="text-2xl opacity-20">🎬</span>
                      </div>
                    )}
                    
                    {/* Badge de Duración de la clase */}
                    <span className="absolute bottom-2.5 right-2.5 bg-black/80 backdrop-blur-[2px] text-white font-mono text-[9px] px-2 py-0.5 rounded-lg font-bold border border-white/5">
                      {video.duracion || '15:40'}
                    </span>

                    {/* Badge de Nivel si es Premium */}
                    {video.es_premium && (
                      <span className="absolute top-2.5 left-2.5 bg-amber-500 text-gray-950 text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md shadow-lg">
                        ⭐ Premium
                      </span>
                    )}
                  </div>

                  {/* Fila de Metadatos Inferiores estilo YouTube */}
                  <div className="flex gap-3 px-1 min-w-0 items-start">
                    {/* Avatar del Profesor */}
                    <div className="w-8 h-8 rounded-full bg-blue-600 font-bold text-xs flex items-center justify-center text-white shadow shadow-blue-500/10 shrink-0 uppercase mt-0.5 overflow-hidden">
                      {video.author_avatar_url ? (
                        <img src={video.author_avatar_url} alt={video.autor} className="w-full h-full object-cover" />
                      ) : (
                        video.autor ? video.autor.charAt(0) : 'P'
                      )}
                    </div>

                    <div className="min-w-0 flex-1 space-y-0.5">
                      {/* Título de la clase */}
                      <h4 className="text-xs font-black text-gray-900 dark:text-white leading-tight uppercase tracking-wide truncate group-hover:text-blue-500 transition-colors">
                        {video.titulo}
                      </h4>

                      {/* Nombre del Profesor e Interacción con su canal */}
                      <p 
                        onClick={(e) => {
                          e.stopPropagation(); // Evita que se reproduzca el video al dar clic en el nombre
                          if (abrirCanalProfesor) abrirCanalProfesor(video.autor_id);
                        }}
                        className="text-[11px] text-gray-400 font-bold hover:text-blue-500 transition-colors inline-block"
                      >
                        {video.autor || 'Docente EduVerify'}
                      </p>

                      {/* Contador de Reproducciones */}
                      <p className="text-[10px] text-gray-400 font-medium font-mono">
                        {video.vistas || '0'} vistas • {video.created_at ? new Date(video.created_at).toLocaleDateString() : 'Recién publicado'}
                      </p>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}