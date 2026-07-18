import React, { useState, useEffect } from 'react';
import { GraduationCap, ArrowRight, Star, Check } from 'lucide-react';
import { cursos as cursosApi } from '../api';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '../context/NavigationContext';
import { usePlayer } from '../context/PlayerContext';

export default function MisCursos() {
  const { darkMode } = useAuth();
  const { setVista } = useNavigation();
  const { abrirCurso } = usePlayer();

  const [misCursos, setMisCursos] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cursosApi.misCursos()
      .then(setMisCursos)
      .catch(() => setMisCursos([]))
      .finally(() => setCargando(false));
  }, []);

  return (
    <div className="space-y-6 animate-fade-in select-none font-sans pb-16 text-left">
      <div className="px-1">
        <h1 className={`text-lg font-black uppercase tracking-wide flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}><GraduationCap size={20} /> Mis Cursos</h1>
        <p className="text-xs text-gray-400 font-medium mt-1">Cursos en los que estás inscrito y tu progreso.</p>
      </div>

      {cargando ? (
        <p className="text-center py-14 text-xs text-gray-400 uppercase font-mono tracking-wider animate-pulse">Cargando cursos...</p>
      ) : misCursos.length === 0 ? (
        <div className="text-center py-14 space-y-3">
          <p className="text-xs text-gray-400 uppercase font-mono tracking-wider">Todavía no estás inscrito en ningún curso.</p>
          <button
            onClick={() => setVista('catalogo')}
            className="text-[10px] font-black uppercase tracking-widest text-cyan-500 hover:underline inline-flex items-center gap-1"
          >
            Explorar el catálogo <ArrowRight size={12} />
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {misCursos.map((curso) => (
            <div
              key={curso.id}
              onClick={() => abrirCurso(curso.id)}
              className={`flex flex-col gap-3 p-4 rounded-2xl border cursor-pointer transition-all hover:scale-[1.01] ${
                darkMode ? 'bg-gray-900/40 border-white/5 hover:bg-gray-900' : 'bg-white border-gray-200 shadow-sm hover:shadow'
              }`}
            >
              <div className="w-full aspect-video bg-[var(--clr-surface-elevated)] dark:bg-gray-900 rounded-xl overflow-hidden flex items-center justify-center border border-[var(--clr-border-subtle)] dark:border-white/5">
                {curso.portada_url
                  ? <img src={curso.portada_url} alt="" className="w-full h-full object-cover" />
                  : <GraduationCap size={32} className="text-[var(--clr-text-muted)] opacity-40" />}
              </div>
              <div className="space-y-1 flex-1">
                <h4 className={`text-xs font-black uppercase tracking-wide truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>{curso.nombre}</h4>
                <p className="text-[10px] font-bold text-gray-400 truncate">{curso.autor}</p>
                {curso.promedio_estrellas != null && (
                  <p className="text-[10px] font-bold text-amber-500 inline-flex items-center gap-1"><Star size={10} className="fill-current" /> {curso.promedio_estrellas} <span className="text-gray-400">({curso.total_reviews})</span></p>
                )}
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-[9px] font-black uppercase tracking-wider text-gray-400">
                  <span>{curso.completadas}/{curso.total_lecciones} lecciones</span>
                  <span className="text-cyan-500">{curso.porcentaje}%</span>
                </div>
                <div className={`w-full h-1.5 rounded-full overflow-hidden ${darkMode ? 'bg-white/5' : 'bg-[var(--clr-surface-elevated)]'}`}>
                  <div className="h-full bg-cyan-600 rounded-full transition-all" style={{ width: `${curso.porcentaje}%` }} />
                </div>
              </div>

              <button className="w-full py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-[10px] font-black uppercase tracking-widest shadow-sm inline-flex items-center justify-center gap-1.5">
                {curso.porcentaje === 100 ? <><Check size={12} /> Completado</> : 'Continuar'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
