import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Clock } from 'lucide-react';
import { cursos as cursosApi } from '../api';
import { useToast } from './Toast';
import Modal from './Modal';

export default function QuizModal({ open, onClose, cursoId, quizId, darkMode }) {
  const notify = useToast();

  const [loading, setLoading] = useState(false);
  const [quiz, setQuiz] = useState(null);
  const [respuestas, setRespuestas] = useState({});
  const [resultado, setResultado] = useState(null);
  const [enviando, setEnviando] = useState(false);

  const reset = () => { setQuiz(null); setRespuestas({}); setResultado(null); setLoading(false); };

  useEffect(() => {
    if (!open || !quizId) return;
    reset();
    setLoading(true);
    cursosApi.getQuiz(cursoId, quizId)
      .then(d => { setQuiz(d); setRespuestas(Object.fromEntries(d.preguntas.map(p => [p.id, null]))); })
      .catch(() => notify.error('No se pudo cargar el quiz'))
      .finally(() => setLoading(false));
  }, [open, quizId]);

  const handleClose = () => { reset(); onClose(); };

  const submit = async () => {
    const unanswered = Object.values(respuestas).some(v => v === null);
    if (unanswered) return notify.error('Responde todas las preguntas antes de enviar.');

    setEnviando(true);
    try {
      const res = await cursosApi.submitQuiz(cursoId, quizId, respuestas);
      setResultado(res);
      if (res.passed) notify.success(`¡Aprobaste! ${res.score}%`);
      else notify.error(`No aprobaste — ${res.score}%. Intenta de nuevo.`);
    } catch (err) {
      notify.error(err.message);
    } finally {
      setEnviando(false);
    }
  };

  const selectAnswer = (questionId, idx) => {
    if (resultado) return;
    setRespuestas(prev => ({ ...prev, [questionId]: idx }));
  };

  return (
    <Modal open={open} onClose={handleClose} title={quiz?.titulo || 'Quiz'} darkMode={darkMode} maxWidth="max-w-lg">
      {loading ? (
        <p className="text-center py-8 text-xs text-gray-400 uppercase tracking-wider animate-pulse">Cargando quiz...</p>
      ) : resultado ? (
        <div className="space-y-4 text-center">
          <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center ${resultado.passed ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
            {resultado.passed ? <CheckCircle size={32} className="text-emerald-500" /> : <XCircle size={32} className="text-red-500" />}
          </div>
          <div>
            <h3 className={`text-lg font-black uppercase ${resultado.passed ? 'text-emerald-500' : 'text-red-500'}`}>{resultado.passed ? '¡Aprobado!' : 'No aprobado'}</h3>
            <p className="text-xs text-gray-400 mt-1">{resultado.correctas} de {resultado.total} correctas &middot; {resultado.score}% &middot; mínimo {quiz?.min_aprobacion}%</p>
          </div>
          {!resultado.passed && resultado.intentos_restantes !== undefined && (
            <p className="text-[10px] font-bold text-gray-400 uppercase">
              Intentos restantes: <span className="text-red-500">{resultado.intentos_restantes === 0 ? 'Ninguno' : resultado.intentos_restantes}</span>
              {resultado.cooldown_hasta && (
                <span className="text-gray-400 block mt-0.5 inline-flex items-center gap-1"><Clock size={10} /> Recarga aprox. {new Date(resultado.cooldown_hasta).toLocaleTimeString()}</span>
              )}
            </p>
          )}
          <div className="flex gap-2.5 pt-2">
            <button onClick={handleClose} className="flex-1 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors">Cerrar</button>
            {!resultado.passed && (
              <button onClick={() => { setResultado(null); setRespuestas(Object.fromEntries(quiz.preguntas.map(p => [p.id, null]))); }} className="flex-1 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-cyan-600 text-white shadow-md hover:bg-cyan-500 transition-colors">Reintentar</button>
            )}
          </div>
        </div>
      ) : quiz ? (
        <div className="space-y-5">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            {quiz.preguntas.length} pregunta{quiz.preguntas.length !== 1 ? 's' : ''} &middot; Aprobación mínima: {quiz.min_aprobacion}%
          </p>
          {quiz.intentos_restantes !== undefined && quiz.intentos_restantes !== null && (
            <div className={`p-3 rounded-xl border text-xs font-bold ${darkMode ? 'bg-amber-500/5 border-amber-500/20 text-amber-500' : 'bg-amber-50 border-amber-200 text-amber-700'}`}>
              <AlertTriangle size={12} className="inline mr-1" /> {quiz.intentos_restantes === 0 ? 'Sin intentos disponibles' : `${quiz.intentos_restantes} intento${quiz.intentos_restantes !== 1 ? 's' : ''} disponible${quiz.intentos_restantes !== 1 ? 's' : ''}`} (gratuito)
              {quiz.cooldown_hasta && <span className="block text-[9px] opacity-60 mt-0.5">Recarga a las {new Date(quiz.cooldown_hasta).toLocaleTimeString()}</span>}
            </div>
          )}
          <div className="space-y-4">
            {quiz.preguntas.map((p, pi) => (
              <div key={p.id} className={`p-4 rounded-2xl border ${respuestas[p.id] !== null ? darkMode ? 'border-cyan-500/30 bg-cyan-500/5' : 'border-cyan-300 bg-cyan-50' : 'border-gray-100 dark:border-white/5'}`}>
                <p className="text-xs font-black uppercase tracking-wide mb-3">{pi + 1}. {p.pregunta}</p>
                <div className="space-y-1.5">
                  {p.opciones.map((opt, oi) => (
                    <label key={oi} className={`flex items-center gap-2.5 p-2.5 rounded-xl cursor-pointer transition-colors text-xs font-bold ${
                      respuestas[p.id] === oi
                        ? darkMode ? 'bg-cyan-600/10 text-cyan-400' : 'bg-cyan-50 text-cyan-600'
                        : darkMode ? 'hover:bg-white/5 text-gray-400' : 'hover:bg-[var(--clr-base)] text-gray-600'
                    }`}>
                      <input type="radio" name={`q_${p.id}`} checked={respuestas[p.id] === oi} onChange={() => selectAnswer(p.id, oi)} className="w-4 h-4 accent-cyan-600 cursor-pointer" />
                      {opt}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={submit}
            disabled={enviando || (quiz.intentos_restantes !== null && quiz.intentos_restantes <= 0)}
            className="w-full font-bold py-3.5 rounded-xl text-xs uppercase tracking-widest bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white shadow-md transition-colors"
          >
            {enviando ? 'Calificando...' : 'Enviar respuestas'}
          </button>
        </div>
      ) : (
        <p className="text-center py-8 text-xs text-gray-400 uppercase tracking-wider">Quiz no disponible</p>
      )}
    </Modal>
  );
}
