import React, { useState, useEffect } from 'react';
import { GraduationCap, Star, Play, Check, Clapperboard, ArrowRight, HelpCircle, FileText } from 'lucide-react';
import { cursos as cursosApi } from '../api';
import { useToast } from './Toast';
import QuizModal from './QuizModal';

export default function CursoDetalle({ cursoId, usuario, setVista, darkMode, abrirCanalProfesor, abrirLeccionDeCurso }) {
  const [curso, setCurso] = useState(null);
  const notify = useToast();
  const [progreso, setProgreso] = useState({ inscrito: false, completadas: [], porcentaje: 0 });
  const [reviews, setReviews] = useState({ items: [], promedio: null, total: 0 });
  const [cargando, setCargando] = useState(true);
  const [quizModal, setQuizModal] = useState(null);
  const [pdfsCurso, setPdfsCurso] = useState([]);

  // Formulario de reseña propia
  const [estrellasForm, setEstrellasForm] = useState(0);
  const [textoForm, setTextoForm] = useState('');
  const [enviandoReview, setEnviandoReview] = useState(false);

  const cargarTodo = () => {
    if (!cursoId) return;
    cursosApi.get(cursoId).then(setCurso).catch(() => setCurso(null)).finally(() => setCargando(false));
    cursosApi.progreso(cursoId).then(setProgreso).catch(() => {});
    cursosApi.reviews(cursoId).then(setReviews).catch(() => {});
    cursosApi.getPdfs(cursoId).then(setPdfsCurso).catch(() => setPdfsCurso([]));
  };

  useEffect(() => {
    setCargando(true);
    setCurso(null);
    setProgreso({ inscrito: false, completadas: [], porcentaje: 0 });
    setEstrellasForm(0);
    setTextoForm('');
    cargarTodo();
  }, [cursoId]);

  // Precargar la reseña propia en el formulario
  const miReview = reviews.items.find(r => r.user_id === usuario?.id);
  useEffect(() => {
    if (miReview) {
      setEstrellasForm(miReview.estrellas);
      setTextoForm(miReview.texto || '');
    }
  }, [miReview?.id]);

  if (cargando) {
    return <p className="text-center py-14 text-xs text-gray-400 uppercase font-mono tracking-wider animate-pulse">Cargando curso...</p>;
  }

  if (!curso) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-gray-500">No se encontró el curso.</p>
        <button onClick={() => setVista('catalogo')} className="mt-4 text-xs font-bold text-cyan-500 uppercase">Volver al catálogo</button>
      </div>
    );
  }

  const completadasSet = new Set(progreso.completadas);
  const primeraNoCompletada = curso.lecciones.find(l => !completadasSet.has(l.id)) || curso.lecciones[0];

  const manejarInscripcion = async () => {
    try {
      if (progreso.inscrito) {
        if (!window.confirm('¿Cancelar tu inscripción? Se borrará tu progreso en este curso.')) return;
        await cursosApi.desinscribir(cursoId);
      } else {
        await cursosApi.inscribir(cursoId);
      }
      cargarTodo();
    } catch (err) {
      notify.error(`Error: ${err.message}`);
    }
  };

  const enviarReview = async (e) => {
    e.preventDefault();
    if (!estrellasForm) return notify.error('Selecciona una calificación de 1 a 5 estrellas.');
    setEnviandoReview(true);
    try {
      await cursosApi.upsertReview(cursoId, { estrellas: estrellasForm, texto: textoForm.trim() || undefined });
      cursosApi.reviews(cursoId).then(setReviews).catch(() => {});
    } catch (err) {
      notify.error(`Error al guardar la reseña: ${err.message}`);
    } finally {
      setEnviandoReview(false);
    }
  };

  const borrarReview = async () => {
    if (!window.confirm('¿Eliminar tu reseña?')) return;
    try {
      await cursosApi.removeReview(cursoId);
      setEstrellasForm(0);
      setTextoForm('');
      cursosApi.reviews(cursoId).then(setReviews).catch(() => {});
    } catch (err) {
      notify.error(`Error al eliminar la reseña: ${err.message}`);
    }
  };

  const obtenerYoutubeId = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  return (
    <div className="space-y-8 animate-fade-in select-none font-sans pb-16 text-left">

      {/* HEADER DEL CURSO */}
      <div className={`p-6 md:p-8 rounded-3xl border ${darkMode ? 'bg-gray-900/40 border-white/5' : 'bg-white border-gray-200 shadow-sm'}`}>
        <p className="text-[10px] font-black uppercase tracking-widest text-cyan-500 mb-2 flex items-center gap-1.5"><GraduationCap size={14} /> Curso</p>
        <h1 className={`text-xl md:text-2xl font-black tracking-tight uppercase ${darkMode ? 'text-white' : 'text-gray-900'}`}>{curso.nombre}</h1>
        {curso.descripcion && (
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-2 leading-relaxed max-w-3xl">{curso.descripcion}</p>
        )}

        <div className="flex items-center gap-4 mt-4 flex-wrap">
          <div
            onClick={() => abrirCanalProfesor && abrirCanalProfesor(curso.autor.id)}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-full bg-cyan-600 font-black text-white text-xs flex items-center justify-center overflow-hidden shrink-0">
              {curso.autor.avatar_url ? (
                <img src={curso.autor.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <span>{curso.autor.nombre?.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <span className="text-xs font-black text-gray-900 dark:text-white group-hover:text-cyan-500 transition-colors">{curso.autor.nombre}</span>
          </div>

          <div className="flex items-center gap-3 text-[11px] font-bold text-gray-400 font-mono uppercase flex-wrap">
            {curso.promedio_estrellas != null && (
              <span className="text-amber-500 inline-flex items-center gap-1"><Star size={11} className="fill-current" /> {curso.promedio_estrellas} <span className="text-gray-400">({curso.total_reviews} reseñas)</span></span>
            )}
            <span>• {curso.total_lecciones} lecciones</span>
            <span>• {curso.inscritos} inscritos</span>
          </div>
        </div>

        {/* Progreso + acciones */}
        <div className="mt-6 space-y-3">
          {progreso.inscrito && (
            <div className="space-y-1.5 max-w-md">
              <div className="flex justify-between text-[9px] font-black uppercase tracking-wider text-gray-400">
                <span>{progreso.completadas.length}/{curso.total_lecciones} lecciones completadas</span>
                <span className="text-cyan-500">{progreso.porcentaje}%</span>
              </div>
              <div className={`w-full h-2 rounded-full overflow-hidden ${darkMode ? 'bg-white/5' : 'bg-[var(--clr-surface-elevated)]'}`}>
                <div className="h-full bg-cyan-600 rounded-full transition-all" style={{ width: `${progreso.porcentaje}%` }} />
              </div>
            </div>
          )}

          <div className="flex gap-2.5 flex-wrap">
            {progreso.inscrito ? (
              <>
                {primeraNoCompletada && (
                  <button
                    onClick={() => abrirLeccionDeCurso(primeraNoCompletada, curso.id)}
                    className="px-6 py-2.5 rounded-full bg-cyan-600 hover:bg-cyan-500 text-white text-[10px] font-black uppercase tracking-widest shadow-md inline-flex items-center gap-1.5"
                  >
                    <Play size={12} className="fill-current" /> Continuar curso
                  </button>
                )}
                <button
                  onClick={manejarInscripcion}
                  className="px-5 py-2.5 rounded-full bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 text-[10px] font-black uppercase tracking-widest hover:text-red-500"
                >
                  Cancelar inscripción
                </button>
              </>
            ) : (
              <button
                onClick={manejarInscripcion}
                className="px-6 py-2.5 rounded-full bg-cyan-600 hover:bg-cyan-500 text-white text-[10px] font-black uppercase tracking-widest shadow-md"
              >
                Inscribirse gratis
              </button>
            )}
          </div>
        </div>
      </div>

      {/* LECCIONES */}
      <div className="space-y-3">
        <h3 className="text-xs font-black uppercase tracking-wider text-gray-900 dark:text-white px-1">Contenido del curso</h3>
        {curso.lecciones.length === 0 ? (
          <p className="text-center py-8 text-xs text-gray-400 uppercase font-mono tracking-wider">Este curso todavía no tiene lecciones.</p>
        ) : (
          <div className="grid grid-cols-1 gap-2.5">
            {curso.lecciones.map((leccion, idx) => {
              const completada = completadasSet.has(leccion.id);
              const ytId = obtenerYoutubeId(leccion.url_video);
              const miniatura = ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : null;
              return (
                <div
                  key={leccion.id}
                  onClick={() => abrirLeccionDeCurso(leccion, curso.id)}
                  className={`p-3 rounded-2xl border flex items-center gap-4 cursor-pointer transition-all hover:scale-[1.005] ${
                    darkMode ? 'bg-gray-900/40 border-white/5 hover:bg-gray-900' : 'bg-white border-gray-200 shadow-sm hover:shadow'
                  }`}
                >
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                    completada ? 'bg-emerald-500 text-white' : darkMode ? 'bg-white/5 text-gray-400' : 'bg-[var(--clr-surface-elevated)] text-gray-500'
                  }`}>
                    {completada ? <Check size={12} /> : idx + 1}
                  </span>
                  <div className="w-24 aspect-video bg-gray-950 rounded-lg overflow-hidden shrink-0 hidden sm:flex items-center justify-center">
                    {miniatura ? <img src={miniatura} alt="" className="w-full h-full object-cover" /> : <Clapperboard size={16} className="opacity-30 text-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className={`text-xs font-black uppercase truncate tracking-wide ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {leccion.titulo}
                      {leccion.es_premium && (
                        <span className="ml-2 bg-amber-500/10 text-amber-500 text-[8px] font-black uppercase px-1.5 py-0.5 rounded inline-flex items-center gap-0.5 align-middle">
                          <Star size={9} className="fill-current" /> Premium
                        </span>
                      )}
                      {leccion.quiz_id && (
                        <span className="ml-2 bg-amber-500/10 text-amber-500 text-[8px] font-black uppercase px-1.5 py-0.5 rounded inline-flex items-center gap-0.5 align-middle">
                          <HelpCircle size={9} /> Quiz
                        </span>
                      )}
                      {pdfsCurso.some(p => p.video_id === leccion.id) && (
                        <span className="ml-2 bg-emerald-500/10 text-emerald-500 text-[8px] font-black uppercase px-1.5 py-0.5 rounded inline-flex items-center gap-0.5 align-middle">
                          <FileText size={9} /> PDF
                        </span>
                      )}
                    </h4>
                    <p className="text-[10px] text-gray-400 font-mono font-bold uppercase mt-0.5">{leccion.duracion || '00:00'} • {leccion.categoria}</p>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-cyan-500 shrink-0 hidden md:inline-flex items-center gap-1">Ver lección <ArrowRight size={12} /></span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* EXAMEN FINAL DEL CURSO */}
      {curso.quiz_final && (
        <div className={`p-5 rounded-3xl border ${darkMode ? 'bg-amber-500/5 border-amber-500/20' : 'bg-amber-50 border-amber-200'}`}>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
                <GraduationCap size={20} className="text-amber-500" />
              </div>
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-amber-500">{curso.quiz_final.titulo || 'Examen final del curso'}</h3>
                <p className="text-[10px] text-gray-400 font-bold mt-0.5">{curso.quiz_final.num_preguntas} preguntas &middot; Mínimo {curso.quiz_final.min_aprobacion}% para aprobar</p>
              </div>
            </div>
            <button
              onClick={() => setQuizModal(curso.quiz_final.id)}
              disabled={!progreso.inscrito}
              className="px-5 py-2.5 rounded-full bg-amber-500 hover:bg-amber-400 disabled:opacity-30 text-white text-[10px] font-black uppercase tracking-widest shadow-md shrink-0 inline-flex items-center gap-1.5"
            >
              {progreso.inscrito ? 'Realizar examen' : 'Inscríbete primero'}
            </button>
          </div>
        </div>
      )}

      {/* MATERIALES DEL CURSO */}
      {pdfsCurso.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-black uppercase tracking-wider text-gray-900 dark:text-white px-1">Materiales del curso</h3>
          <div className={`p-4 rounded-2xl border space-y-2 ${darkMode ? 'bg-gray-900/40 border-white/5' : 'bg-white border-gray-200 shadow-sm'}`}>
            {pdfsCurso.map(p => (
              <a key={p.id} href={`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/uploads/pdfs/${p.filename}`} target="_blank" rel="noreferrer" className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-colors ${darkMode ? 'hover:bg-white/5 text-gray-300' : 'hover:bg-gray-50 text-gray-700'}`}>
                <FileText size={18} className="text-emerald-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-black uppercase truncate">{p.original_name}</p>
                  <p className="text-[9px] text-gray-400 font-bold uppercase mt-0.5">{p.video_id ? 'PDF de lección' : 'Documento del curso'}</p>
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500 shrink-0">Abrir</span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* RESEÑAS */}
      <div className="space-y-4">
        <h3 className="text-xs font-black uppercase tracking-wider text-gray-900 dark:text-white px-1 flex items-center gap-2">
          Reseñas
          <span className="text-[10px] font-mono bg-gray-100 dark:bg-white/5 text-gray-400 px-2 py-0.5 rounded-lg">{reviews.total}</span>
          {reviews.promedio != null && <span className="text-amber-500 text-[11px] inline-flex items-center gap-1"><Star size={11} className="fill-current" /> {reviews.promedio}</span>}
        </h3>

        {/* Formulario (solo inscritos) */}
        {progreso.inscrito ? (
          <form onSubmit={enviarReview} className={`p-4 rounded-2xl border space-y-3 ${darkMode ? 'bg-gray-900/40 border-white/5' : 'bg-white border-gray-200 shadow-sm'}`}>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{miReview ? 'Editar tu reseña' : 'Deja tu reseña'}</p>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map(n => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setEstrellasForm(n)}
                  className={`transition-transform hover:scale-110 ${n <= estrellasForm ? 'text-amber-500' : 'text-gray-300 dark:text-gray-600'}`}
                >
                  <Star size={20} className={n <= estrellasForm ? 'fill-current' : ''} />
                </button>
              ))}
            </div>
            <textarea
              rows={3}
              value={textoForm}
              onChange={(e) => setTextoForm(e.target.value)}
              placeholder="¿Qué te pareció el curso? (opcional)"
              className={`w-full rounded-xl px-3 py-2 text-xs outline-none border bg-transparent focus:border-cyan-500 resize-none ${darkMode ? 'border-white/10 text-white' : 'border-gray-200 text-gray-900'}`}
            />
            <div className="flex justify-end gap-2">
              {miReview && (
                <button type="button" onClick={borrarReview} className="px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wide text-red-500 hover:bg-red-500/10">
                  Eliminar
                </button>
              )}
              <button
                type="submit"
                disabled={enviandoReview}
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white text-[10px] font-bold uppercase tracking-wide shadow-sm"
              >
                {miReview ? 'Actualizar' : 'Publicar'}
              </button>
            </div>
          </form>
        ) : (
          <p className="text-[11px] text-gray-400 font-medium italic px-1">Inscríbete en el curso para dejar una reseña.</p>
        )}

        {/* Lista */}
        {reviews.items.length === 0 ? (
          <p className="text-center py-6 text-xs text-gray-400 uppercase font-mono tracking-wider">Todavía no hay reseñas.</p>
        ) : (
          <div className="space-y-4">
            {reviews.items.map((r) => (
              <div key={r.id} className="flex gap-3.5">
                <div className="w-9 h-9 rounded-full font-bold text-xs flex items-center justify-center text-white shrink-0 overflow-hidden bg-gray-600">
                  {r.avatar_url ? (
                    <img src={r.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span>{r.nombre?.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0 space-y-0.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-black text-gray-900 dark:text-white truncate">{r.nombre}</span>
                    <span className="text-amber-500 inline-flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} size={11} className={i < r.estrellas ? 'fill-current' : 'opacity-30'} />
                      ))}
                    </span>
                    <span className="text-[9px] text-gray-400 font-medium font-mono">{r.created_at ? new Date(r.created_at).toLocaleDateString() : ''}</span>
                  </div>
                  {r.texto && <p className="text-xs text-gray-700 dark:text-gray-300 font-medium whitespace-pre-wrap leading-relaxed">{r.texto}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <QuizModal open={Boolean(quizModal)} onClose={() => setQuizModal(null)} cursoId={cursoId} quizId={quizModal} darkMode={darkMode} />
    </div>
  );
}
