import React, { useState, useEffect } from 'react';
import { ArrowLeft, Crown, Gem, Sparkles, GraduationCap, FileText, Check } from 'lucide-react';
import { premium } from '../api';
import { useToast } from './Toast';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '../context/NavigationContext';

const TIERS = [
  {
    key: 'free',
    label: 'Gratis',
    precio: '$0',
    color: 'text-gray-400',
    bg: 'bg-gray-100 dark:bg-white/5',
    border: 'border-gray-200 dark:border-white/10',
    icon: null,
    features: ['Cursos públicos', 'Contenido gratuito'],
  },
  {
    key: 'premium',
    label: 'Premium',
    precio: '$149',
    color: 'text-cyan-500',
    bg: 'bg-cyan-500/5',
    border: 'border-cyan-500/30',
    icon: <Gem size={18} className="text-cyan-500" />,
    features: ['Todo Gratis', 'Cursos premium de docentes', 'Acceso completo a lecciones'],
  },
  {
    key: 'premium_plus',
    label: 'Premium+',
    precio: '$249',
    color: 'text-amber-500',
    bg: 'bg-amber-500/5',
    border: 'border-amber-500/30',
    icon: <Crown size={18} className="text-amber-500" />,
    features: ['Todo Premium', 'Todos los canales Creador', 'Acceso sin mini-subs'],
  },
];

export default function PasarelaPrueba() {
  const { usuario, setUsuario, darkMode } = useAuth();
  const { setVista } = useNavigation();
  const notify = useToast();

  const tier = usuario?.tier || 'free';
  const esPremium = tier !== 'free';
  const [fechaPago, setFechaPago] = useState(null);
  const [docStatus, setDocStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (esPremium) premium.status().then(d => setFechaPago(d.fecha_pago)).catch(() => {});
    if (usuario?.rol === 'profesor' || usuario?.rol === 'creador') {
      premium.teacherMembershipStatus().then(setDocStatus).catch(() => {});
    }
  }, [esPremium, usuario?.rol]);

  const fechaCaducidad = fechaPago
    ? new Date(new Date(fechaPago).getTime() + 30 * 24 * 60 * 60 * 1000)
        .toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })
    : '—';

  const activar = async (tierKey) => {
    setLoading(true);
    try {
      const fn = tierKey === 'premium_plus' ? premium.activatePlus : premium.activate;
      await fn();
      setUsuario({ ...usuario, premium: true, tier: tierKey });
      notify.success(tierKey === 'premium_plus' ? '¡Premium+ activado!' : '¡Premium activado!');
      setVista('catalogo');
    } catch (err) {
      notify.error(err.message);
    } finally { setLoading(false); }
  };

  const cancelar = async () => {
    if (!window.confirm('¿Cancelar membresía? Perderás el acceso al contenido exclusivo.')) return;
    try {
      if (tier === 'premium_plus') await premium.cancelPlus();
      else await premium.cancel();
      const newTier = tier === 'premium_plus' ? 'premium' : 'free';
      setUsuario({ ...usuario, premium: newTier !== 'free', tier: newTier });
      notify.success(tier === 'premium_plus' ? 'Premium+ cancelado — mantienes Premium' : 'Membresía cancelada');
      if (newTier === 'free') setVista('catalogo');
    } catch (err) { notify.error(err.message); }
  };

  const activarDocente = async () => {
    setLoading(true);
    try {
      const d = await premium.activateTeacherMembership();
      setDocStatus(d);
      setUsuario({ ...usuario, membresia_docente: true });
      notify.success('¡Membresía Docente activada! Ya puedes asignar precios a tus cursos.');
    } catch (err) { notify.error(err.message); }
    finally { setLoading(false); }
  };

  const cancelarDocente = async () => {
    if (!window.confirm('¿Cancelar Membresía Docente? Tus cursos con precio dejarán de venderse.')) return;
    try {
      await premium.cancelTeacherMembership();
      setDocStatus(null);
      setUsuario({ ...usuario, membresia_docente: false });
      notify.success('Membresía Docente cancelada');
    } catch (err) { notify.error(err.message); }
  };

  const esDocente = usuario?.rol === 'profesor' || usuario?.rol === 'creador';

  return (
    <div className="max-w-2xl mx-auto animate-fade-in pb-20 select-none space-y-8">
      <button onClick={() => setVista('catalogo')} className="text-xs font-bold text-gray-400 uppercase inline-flex items-center gap-1.5">
        <ArrowLeft size={14} /> Regresar
      </button>

      <div className="text-center">
        <Sparkles size={28} className="mx-auto mb-2 text-amber-500" />
        <h1 className="text-xl font-black uppercase tracking-tight text-[var(--clr-text-primary)]">Planes EduVerify</h1>
        <p className="text-sm text-[var(--clr-text-muted)] mt-1">Elige tu nivel de acceso</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {TIERS.map((t) => {
          const isCurrent = tier === t.key;
          const isUpgrade = (t.key === 'premium' && tier === 'free') || (t.key === 'premium_plus' && tier !== 'premium_plus');
          return (
            <div key={t.key} className={`rounded-2xl border p-5 flex flex-col gap-3 ${t.bg} ${isCurrent ? t.border + ' ring-2 ring-offset-2 ring-offset-[var(--clr-base)] ' + (t.key === 'premium_plus' ? 'ring-amber-500' : t.key === 'premium' ? 'ring-cyan-500' : 'ring-gray-300') : t.border}`}>
              <div className="flex items-center gap-2">
                {t.icon}
                <span className={`text-sm font-black uppercase tracking-wide ${t.color}`}>{t.label}</span>
                {isCurrent && <span className="ml-auto text-[9px] font-black uppercase bg-[var(--clr-accent)] text-white px-2 py-0.5 rounded-full">Actual</span>}
              </div>
              <div>
                <span className={`text-2xl font-black font-mono ${t.color}`}>{t.precio}</span>
                <span className="text-[10px] text-[var(--clr-text-muted)] ml-1">/mes</span>
              </div>
              <ul className="space-y-1.5 flex-1">
                {t.features.map(f => (
                  <li key={f} className="text-[11px] text-[var(--clr-text-muted)] flex items-center gap-1.5">
                    <Check size={10} className="text-green-500 shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              {!isCurrent && t.key !== 'free' && isUpgrade && (
                <button
                  disabled={loading}
                  onClick={() => activar(t.key)}
                  className={`w-full py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-colors ${t.key === 'premium_plus' ? 'bg-amber-500 text-gray-950 hover:bg-amber-400' : 'bg-cyan-600 text-white hover:bg-cyan-500'}`}
                >
                  {loading ? '...' : `Activar ${t.label}`}
                </button>
              )}
              {isCurrent && tier !== 'free' && (
                <div className="space-y-2">
                  <p className="text-[10px] text-[var(--clr-text-muted)]">Caduca: <span className="font-bold">{fechaCaducidad}</span></p>
                  <button onClick={() => notify.info("Generando recibo...")} className="w-full py-2 rounded-xl text-[10px] font-bold border border-[var(--clr-border)] text-[var(--clr-text-muted)] hover:bg-[var(--clr-surface-elevated)] transition-colors inline-flex items-center justify-center gap-1">
                    <FileText size={11} /> Recibo PDF
                  </button>
                  <button onClick={cancelar} className="w-full py-2 rounded-xl text-[10px] font-bold text-red-500 hover:bg-red-500/10 transition-colors uppercase tracking-wider">
                    {tier === 'premium_plus' ? 'Bajar a Premium' : 'Cancelar'}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {esDocente && (
        <div className={`rounded-2xl border p-5 space-y-4 ${darkMode ? 'bg-gray-900 border-white/10' : 'bg-white border-gray-200 shadow-sm'}`}>
          <div className="flex items-center gap-2">
            <GraduationCap size={20} className="text-violet-500" />
            <h2 className="text-sm font-black uppercase tracking-wide text-violet-500">Membresía Docente</h2>
            {docStatus?.activa && <span className="ml-auto text-[9px] font-black bg-green-500 text-white px-2 py-0.5 rounded-full uppercase">Activa</span>}
          </div>
          <p className="text-[11px] text-[var(--clr-text-muted)]">Habilita la venta de cursos individuales con precio propio y gestión de cupones de descuento.</p>
          <div className="flex items-center gap-2">
            <span className="text-xl font-black font-mono text-violet-500">$99</span>
            <span className="text-[10px] text-[var(--clr-text-muted)]">/mes</span>
          </div>
          {docStatus?.activa ? (
            <div className="space-y-2">
              <p className="text-[10px] text-[var(--clr-text-muted)]">Caduca: <span className="font-bold">{docStatus.expires_at ? new Date(docStatus.expires_at).toLocaleDateString('es-MX') : '—'}</span></p>
              <button onClick={cancelarDocente} className="text-[10px] font-bold text-red-500 hover:bg-red-500/10 px-3 py-1.5 rounded-lg transition-colors uppercase tracking-wider">
                Cancelar Membresía Docente
              </button>
            </div>
          ) : (
            <button
              disabled={loading}
              onClick={activarDocente}
              className="w-full py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest bg-violet-600 text-white hover:bg-violet-500 transition-colors"
            >
              {loading ? '...' : 'Activar Membresía Docente'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
