import { useState, useEffect } from 'react';
import { ChevronRight } from 'lucide-react';
import * as api from '../api';

const cache = new Map();

const LABELS = {
  catalogo: 'Principal',
  favoritos: 'Favoritos',
  historial: 'Historial',
  'videos-guardados': 'Videos guardados',
  'mis-cursos': 'Mis Cursos',
  profesor: 'Mi Canal',
  premium: 'Membresía',
  configuracion: 'Configuración',
};

async function resolveCurso(id) {
  const key = `curso:${id}`;
  if (cache.has(key)) return;
  cache.set(key, null);
  try {
    const data = await api.cursos.get(id);
    cache.set(key, data?.nombre || '');
  } catch { /* leave null */ }
}

async function resolveUser(id) {
  const key = `user:${id}`;
  if (cache.has(key)) return;
  cache.set(key, null);
  try {
    const data = await api.users.profile(id);
    cache.set(key, data?.nombre || '');
  } catch { /* leave null */ }
}

function getCached(type, id) {
  return cache.get(`${type}:${id}`);
}

function Crumb({ label, onClick, darkMode, last }) {
  if (last) {
    return (
      <span className={`truncate max-w-[14rem] text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-white' : 'text-gray-900'}`}>
        {label}
      </span>
    );
  }
  return (
    <button
      onClick={onClick}
      className={`text-[10px] font-bold uppercase tracking-widest transition-colors truncate max-w-[12rem] ${
        darkMode
          ? 'text-gray-500 hover:text-gray-200'
          : 'text-gray-400 hover:text-gray-700'
      }`}
    >
      {label}
    </button>
  );
}

export default function Breadcrumbs({
  vista, setVista, videoSeleccionado, cursoSeleccionado,
  canalSeleccionado, cursoActivo, cursoOrigen, abrirCurso,
  subVista, setSubVista, darkMode,
}) {
  const [, tick] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (vista === 'curso' && cursoSeleccionado) {
        await resolveCurso(cursoSeleccionado);
        if (!cancelled) tick(n => n + 1);
      }
      if (vista === 'canal' && canalSeleccionado?.id) {
        await resolveUser(canalSeleccionado.id);
        if (!cancelled) tick(n => n + 1);
      }
      if (vista === 'reproductor' && cursoActivo) {
        await resolveCurso(cursoActivo);
        if (!cancelled) tick(n => n + 1);
      }
    }

    run();
    return () => { cancelled = true; };
  }, [vista, cursoSeleccionado, canalSeleccionado?.id, cursoActivo]);

  if (vista === 'login' || vista === 'catalogo') return null;

  const crumbs = [];

  const push = (label, onClick) => crumbs.push({ label, onClick });

  push(LABELS.catalogo, () => setVista('catalogo'));

  if (vista === 'profesor' && subVista === 'subir') {
    push(LABELS.profesor, () => setSubVista('canal'));
    push('Subir video', null);
  } else if (vista === 'profesor') {
    push(LABELS.profesor, null);
  } else if (vista === 'canal') {
    const name = getCached('user', canalSeleccionado?.id);
    push(name || 'Canal', null);
  } else if (vista === 'curso') {
    const fromCanal = cursoOrigen === 'canal';
    push(
      fromCanal ? (getCached('user', canalSeleccionado?.id) || 'Canal') : LABELS['mis-cursos'],
      fromCanal ? () => setVista('canal') : () => setVista('mis-cursos')
    );
    const name = getCached('curso', cursoSeleccionado);
    push(name || 'Curso', null);
  } else if (vista === 'reproductor' && cursoActivo) {
    const fromCanal = cursoOrigen === 'canal';
    push(
      fromCanal ? (getCached('user', canalSeleccionado?.id) || 'Canal') : LABELS['mis-cursos'],
      fromCanal ? () => setVista('canal') : () => setVista('mis-cursos')
    );
    const cname = getCached('curso', cursoActivo);
    push(cname || 'Curso', () => abrirCurso(cursoActivo));
    push(videoSeleccionado?.titulo || 'Reproducción', null);
  } else if (vista === 'reproductor') {
    push(videoSeleccionado?.titulo || 'Reproducción', null);
  } else if (LABELS[vista]) {
    push(LABELS[vista], null);
  }

  return (
    <nav className="flex items-center gap-1.5 mb-4 pt-1 flex-wrap select-none">
      {crumbs.map((c, i) => (
        <span key={i} className="flex items-center gap-1.5 min-w-0">
          {i > 0 && <ChevronRight size={11} className="opacity-30 shrink-0" />}
          <Crumb label={c.label} onClick={c.onClick} darkMode={darkMode} last={i === crumbs.length - 1} />
        </span>
      ))}
    </nav>
  );
}
