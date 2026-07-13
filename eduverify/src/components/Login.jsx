import React, { useState, useEffect } from 'react';
import { ArrowLeft, AlertTriangle, PartyPopper, MailCheck } from 'lucide-react';
import { auth, setToken } from '../api';

export default function Login({ setVista, setUsuario, paramsReset, setParamsReset }) {
  const [esLogin, setEsLogin] = useState(true);
  const [modoRecuperar, setModoRecuperar] = useState(false); 
  const [modoNuevoPassword, setModoNuevoPassword] = useState(false); 

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nuevoPassword, setNuevoPassword] = useState(''); 
  const [confirmarPassword, setConfirmarPassword] = useState('');
  const [nombre, setNombre] = useState('');
  const [rol, setRol] = useState('estudiante');
  
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');
  const [loading, setLoading] = useState(false);

  // 🌐 INTEGRACIÓN NATIVA DE GOOGLE OAUTH
  useEffect(() => {
    // Escuchar los parámetros de restablecimiento de contraseña vía URL
    if (paramsReset) {
      setModoNuevoPassword(true);
      setModoRecuperar(false);
    }

    // El credential de Google se valida en el servidor (POST /api/auth/google)
    const handleCredentialResponse = async (response) => {
      setLoading(true);
      setError('');
      try {
        const data = await auth.google(response.credential);
        setToken(data.token);
        setUsuario(data.user);
        setVista('catalogo');
      } catch (err) {
        setError("Error al autenticar las credenciales con tu cuenta de Google.");
      } finally {
        setLoading(false);
      }
    };

    // Cargar e inicializar el botón de Google si existe el SDK en la ventana global
    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (window.google && googleClientId && !modoNuevoPassword && !modoRecuperar) {
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: handleCredentialResponse
      });
      window.google.accounts.id.renderButton(
        document.getElementById("btnGoogleSignIn"),
        { theme: "outline", size: "large", width: "100%", text: "continue_with", shape: "pill" }
      );
    }
  }, [paramsReset, esLogin, modoRecuperar, modoNuevoPassword]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setExito('');
    setLoading(true);
    
    // FLUJO 1: REESCRIBIR CONTRASEÑA EN LA BASE DE DATOS
    if (modoNuevoPassword) {
      if (nuevoPassword !== confirmarPassword) {
        setError("Las contraseñas ingresadas no coinciden.");
        setLoading(false);
        return;
      }
      try {
        await auth.actualizarPassword({
          id: paramsReset.id,
          token: paramsReset.token,
          password: nuevoPassword
        });
        setExito("¡Contraseña actualizada con éxito! Ya puedes iniciar sesión.");
        setModoNuevoPassword(false);
        setEsLogin(true);
        setParamsReset(null);
      } catch (err) {
        setError(err.message || "El enlace ya expiró o no es válido.");
      } finally {
        setLoading(false);
      }
      return;
    }

    // FLUJO 2: PETICIÓN DE ENVÍO DE TOKEN AL CORREO
    if (modoRecuperar) {
      try {
        await auth.cambiarPassword(email.trim());
        setExito(`Enlace enviado. Revisa tu bandeja de entrada o Spam en: ${email}`);
        setEmail('');
      } catch (err) {
        setError(err.message || "Error al procesar la solicitud de recuperación.");
      } finally {
        setLoading(false);
      }
      return;
    }

    // FLUJO 3: LOGUEAR USUARIO TRADICIONAL
    if (esLogin) {
      try {
        const data = await auth.login({ correo: email, password });
        setToken(data.token);
        setUsuario(data.user);
        setVista('catalogo');
      } catch (err) {
        setError(err.message || "Credenciales incorrectas.");
      } finally {
        setLoading(false);
      }
    } else {
      // FLUJO 4: REGISTRAR CUENTA NUEVA (el registro no devuelve token — se encadena login)
      try {
        await auth.registro({
          nombre: nombre || email.split('@')[0],
          correo: email,
          password,
          rol
        });
        const data = await auth.login({ correo: email, password });
        setToken(data.token);
        setUsuario(data.user);
        setVista('catalogo');
      } catch (err) {
        setError(err.message || "Error al registrar.");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-12rem)] flex items-center justify-center py-12 px-4 overflow-hidden rounded-2xl mt-4 border transition-colors duration-300 bg-[var(--clr-base)] border-[var(--clr-border-subtle)]">

      <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--clr-border-subtle)_1px,transparent_1px),linear-gradient(to_bottom,var(--clr-border-subtle)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none opacity-60"></div>

      <div className="relative w-full max-w-md p-8 rounded-2xl shadow-xl transition-all duration-300 bg-[var(--clr-surface)] border border-[var(--clr-border-subtle)]">
        
        <div className="text-center mb-8 select-none">
          <div className="inline-flex items-center gap-2 mb-5">
            <div className="relative w-7 h-7 flex items-center justify-center">
              <div className="absolute inset-0 bg-[var(--clr-accent)]/20 blur-md rounded-full" />
              <div className="absolute w-5 h-5 border-2 border-[var(--clr-accent)] rounded-md rotate-45" />
              <div className="absolute w-1.5 h-1.5 bg-[var(--clr-accent)] rounded-sm rotate-45" />
            </div>
            <span className="text-base font-bold tracking-tight text-[var(--clr-text-primary)]">EduVerify</span>
          </div>
          <h2 className="text-xl font-semibold text-[var(--clr-text-primary)]">
            {modoNuevoPassword ? 'Nueva contraseña' : (modoRecuperar ? 'Recuperar acceso' : (esLogin ? 'Bienvenido de vuelta' : 'Crear cuenta'))}
          </h2>
          <p className="text-sm text-[var(--clr-text-muted)] mt-1">
            {modoNuevoPassword ? 'Ingresa tu nueva clave de acceso' : (modoRecuperar ? 'Te enviaremos un enlace de restablecimiento' : 'Educación verificada en STEM y Arte')}
          </p>
        </div>

        {!modoRecuperar && !modoNuevoPassword && (
          <div className="relative p-1 rounded-2xl flex mb-6 bg-[var(--clr-base)] border border-[var(--clr-border-subtle)] dark:bg-gray-950/80 dark:border-white/[0.04]">
            <div className={`absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] bg-cyan-600 rounded-xl transition-transform duration-300 ease-out shadow-md ${esLogin ? 'transform translate-x-0' : 'transform translate-x-full'}`} />
            <button type="button" onClick={() => { setEsLogin(true); setError(''); setExito(''); }} className={`relative z-10 w-1/2 py-2 text-xs font-bold uppercase tracking-wider text-center transition-colors duration-200 rounded-xl ${esLogin ? 'text-white' : 'text-gray-500 dark:text-gray-400'}`}>Login</button>
            <button type="button" onClick={() => { setEsLogin(false); setError(''); setExito(''); }} className={`relative z-10 w-1/2 py-2 text-xs font-bold uppercase tracking-wider text-center transition-colors duration-200 rounded-xl ${!esLogin ? 'text-white' : 'text-gray-500 dark:text-gray-400'}`}>Registro</button>
          </div>
        )}

        {exito && (
          <div className="mb-4 bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400 p-3.5 rounded-xl font-semibold text-xs border border-green-200/30 animate-fade-in flex items-center justify-center gap-2">
            {exito.startsWith('Enlace enviado') ? <MailCheck size={14} className="shrink-0" /> : <PartyPopper size={14} className="shrink-0" />}
            <span>{exito}</span>
          </div>
        )}
        {error && (
          <div className="mb-4 bg-red-50 dark:bg-red-950/30 text-red-500 p-3.5 rounded-xl font-semibold text-xs border border-red-200/30 animate-fade-in flex items-center justify-center gap-2">
            <AlertTriangle size={14} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          
          {modoNuevoPassword ? (
            <div className="space-y-4 animate-fade-in">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest mb-2 text-[var(--clr-text-muted)]">Nueva Contraseña</label>
                <input type="password" required value={nuevoPassword} onChange={(e) => setNuevoPassword(e.target.value)} placeholder="Mínimo 8 caracteres" className="w-full rounded-xl px-4 py-3 text-sm outline-none transition bg-[var(--clr-base)] border border-[var(--clr-border)] text-[var(--clr-text-primary)] focus:border-[var(--clr-accent)] focus:ring-2 focus:ring-[var(--clr-accent)]/20" />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest mb-2 text-[var(--clr-text-muted)]">Confirmar Nueva Contraseña</label>
                <input type="password" required value={confirmarPassword} onChange={(e) => setConfirmarPassword(e.target.value)} placeholder="Repite la contraseña" className="w-full rounded-xl px-4 py-3 text-sm outline-none transition bg-[var(--clr-base)] border border-[var(--clr-border)] text-[var(--clr-text-primary)] focus:border-[var(--clr-accent)] focus:ring-2 focus:ring-[var(--clr-accent)]/20" />
              </div>
            </div>
          ) : modoRecuperar ? (
            <div className="space-y-4 animate-fade-in">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest mb-2 text-[var(--clr-text-muted)]">Ingresa tu Correo Registrado</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu-correo@ejemplo.com" required className="w-full rounded-xl px-4 py-3 text-sm outline-none transition bg-[var(--clr-base)] border border-[var(--clr-border)] text-[var(--clr-text-primary)] focus:border-[var(--clr-accent)] focus:ring-2 focus:ring-[var(--clr-accent)]/20" />
              </div>
            </div>
          ) : (
            <>
              <div className={`transition-all duration-300 origin-top ${esLogin ? 'opacity-0 h-0 overflow-hidden pointer-events-none scale-95' : 'opacity-100 h-auto scale-100'}`}>
                <label className="block text-xs font-semibold uppercase tracking-widest mb-2 text-[var(--clr-text-muted)]">Nombre Completo</label>
                <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Luis Martínez" required={!esLogin} className="w-full rounded-xl px-4 py-3 text-sm outline-none transition bg-[var(--clr-base)] border border-[var(--clr-border)] text-[var(--clr-text-primary)] focus:border-[var(--clr-accent)] focus:ring-2 focus:ring-[var(--clr-accent)]/20" />
              </div>

              <div className={`transition-all duration-300 origin-top ${esLogin ? 'opacity-0 h-0 overflow-hidden pointer-events-none scale-95' : 'opacity-100 h-auto scale-100'}`}>
                <label className="block text-xs font-semibold uppercase tracking-widest mb-2 text-[var(--clr-text-muted)]">Tipo de Perfil</label>
                <div className="grid grid-cols-2 gap-3">
                  <button type="button" onClick={() => setRol('estudiante')} className={`py-2 text-xs font-semibold rounded-xl border transition ${rol === 'estudiante' ? 'bg-gray-900 text-white border-gray-900 dark:bg-white dark:text-gray-950' : 'bg-transparent text-gray-500 border-gray-200'}`}>Estudiante</button>
                  <button type="button" onClick={() => setRol('profesor')} className={`py-2 text-xs font-semibold rounded-xl border transition ${rol === 'profesor' ? 'bg-gray-900 text-white border-gray-900 dark:bg-white dark:text-gray-950' : 'bg-transparent text-gray-500 border-gray-200'}`}>Docente</button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest mb-2 text-[var(--clr-text-muted)]">Dirección de Correo</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="usuario@dominio.com" required className="w-full rounded-xl px-4 py-3 text-sm outline-none transition bg-[var(--clr-base)] border border-[var(--clr-border)] text-[var(--clr-text-primary)] focus:border-[var(--clr-accent)] focus:ring-2 focus:ring-[var(--clr-accent)]/20" />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Contraseña de Acceso</label>
                  {esLogin && (
                    <button type="button" onClick={() => { setModoRecuperar(true); setError(''); setExito(''); }} className="text-xs font-medium text-[var(--clr-accent)] hover:underline">¿Olvidaste tu contraseña?</button>
                  )}
                </div>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required={!modoRecuperar} className="w-full rounded-xl px-4 py-3 text-sm outline-none transition bg-[var(--clr-base)] border border-[var(--clr-border)] text-[var(--clr-text-primary)] focus:border-[var(--clr-accent)] focus:ring-2 focus:ring-[var(--clr-accent)]/20" />
              </div>
            </>
          )}

          <button
            type="submit" disabled={loading}
            className="w-full font-semibold text-sm py-3 px-4 rounded-xl shadow-sm transition duration-200 active:scale-[0.98] mt-2 disabled:opacity-50 bg-[var(--clr-accent)] hover:opacity-90 text-white"
          >
            {loading ? 'Procesando...' : (modoNuevoPassword ? 'Actualizar Contraseña' : (modoRecuperar ? 'Enviar enlace de acceso' : (esLogin ? 'Validar e Ingresar' : 'Confirmar Registro')))}
          </button>

          {/* Separador e integración del botón nativo de Google */}
          {!modoRecuperar && !modoNuevoPassword && (
            <>
              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-gray-200 dark:border-white/5"></div>
                <span className="flex-shrink mx-4 text-[10px] font-bold uppercase text-gray-400 tracking-wider">o continuar con</span>
                <div className="flex-grow border-t border-gray-200 dark:border-white/5"></div>
              </div>
              
              <div id="btnGoogleSignIn" className="w-full flex justify-center pt-1"></div>
            </>
          )}

          {(modoRecuperar || modoNuevoPassword) && (
            <button type="button" onClick={() => { setModoRecuperar(false); setModoNuevoPassword(false); setError(''); setExito(''); }} className="w-full text-[10px] font-bold uppercase tracking-wider text-gray-400 hover:text-gray-600 dark:hover:text-white pt-2 inline-flex items-center justify-center gap-1.5">
              <ArrowLeft size={12} /> Volver al inicio de sesión
            </button>
          )}

        </form>

      </div>
    </div>
  );
}