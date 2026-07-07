import React, { useState, useEffect } from 'react';
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
        setError("⚠️ Error al autenticar las credenciales con tu cuenta de Google.");
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
        setError("⚠️ Las contraseñas ingresadas no coinciden.");
        setLoading(false);
        return;
      }
      try {
        await auth.actualizarPassword({
          id: paramsReset.id,
          token: paramsReset.token,
          password: nuevoPassword
        });
        setExito("🎉 ¡Contraseña actualizada con éxito! Ya puedes iniciar sesión.");
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
        setExito(`📬 Enlace enviado. Revisa tu bandeja de entrada o Spam en: ${email}`);
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
    <div className="relative min-h-[calc(100vh-12rem)] flex items-center justify-center py-12 px-4 overflow-hidden rounded-3xl mt-4 border transition-colors duration-300 bg-white dark:bg-gray-950 border-gray-200 dark:border-white/[0.02]">
      
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e5e7eb_1px,transparent_1px),linear-gradient(to_bottom,#e5e7eb_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#1f293715_1px,transparent_1px),linear-gradient(to_bottom,#1f293710_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none"></div>
      
      <div className="relative w-full max-w-md p-8 rounded-3xl shadow-2xl transition-all duration-300 bg-white border border-gray-100 dark:bg-gray-900/20 dark:border-white/[0.06]">
        
        <div className="text-center mb-8 select-none">
          <div className="inline-flex relative w-9 h-9 flex items-center justify-center mb-4">
            <div className="absolute inset-0 bg-blue-500/20 blur-md rounded-full"></div>
            <div className="absolute w-6 h-6 border-2 border-blue-500 rounded-lg rotate-45"></div>
            <div className="absolute w-2 h-2 bg-blue-600 dark:bg-white rounded-sm rotate-45"></div>
          </div>
          <h2 className="text-lg font-bold tracking-wider uppercase font-sans text-gray-900 dark:text-white">
            {modoNuevoPassword ? 'Establecer Contraseña' : (modoRecuperar ? 'Recuperar acceso' : (esLogin ? 'Ingresar al sistema' : 'Crear credenciales'))}
          </h2>
          <p className="text-xs tracking-wide mt-1 text-gray-500 dark:text-gray-400">
            {modoNuevoPassword ? 'Ingresa tu nueva clave de acceso de forma segura' : (modoRecuperar ? 'Te enviaremos un correo seguro de restablecimiento' : 'Garantía documental en educación STEM y Arte')}
          </p>
        </div>

        {!modoRecuperar && !modoNuevoPassword && (
          <div className="relative p-1 rounded-2xl flex mb-6 bg-gray-100 border border-gray-200 dark:bg-gray-950/80 dark:border-white/[0.04]">
            <div className={`absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] bg-blue-600 rounded-xl transition-transform duration-300 ease-out shadow-md ${esLogin ? 'transform translate-x-0' : 'transform translate-x-full'}`} />
            <button type="button" onClick={() => { setEsLogin(true); setError(''); setExito(''); }} className={`relative z-10 w-1/2 py-2 text-xs font-bold uppercase tracking-wider text-center transition-colors duration-200 rounded-xl ${esLogin ? 'text-white' : 'text-gray-500 dark:text-gray-400'}`}>Login</button>
            <button type="button" onClick={() => { setEsLogin(false); setError(''); setExito(''); }} className={`relative z-10 w-1/2 py-2 text-xs font-bold uppercase tracking-wider text-center transition-colors duration-200 rounded-xl ${!esLogin ? 'text-white' : 'text-gray-500 dark:text-gray-400'}`}>Registro</button>
          </div>
        )}

        {exito && <div className="mb-4 bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400 p-3.5 rounded-xl text-center font-semibold text-xs border border-green-200/30 animate-fade-in">{exito}</div>}
        {error && <div className="mb-4 bg-red-50 dark:bg-red-950/30 text-red-500 p-3.5 rounded-xl text-center font-semibold text-xs border border-red-200/30 animate-fade-in">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-5">
          
          {modoNuevoPassword ? (
            <div className="space-y-4 animate-fade-in">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest mb-2 text-gray-500 dark:text-gray-400">Nueva Contraseña</label>
                <input type="password" required value={nuevoPassword} onChange={(e) => setNuevoPassword(e.target.value)} placeholder="Mínimo 8 caracteres" className="w-full rounded-xl px-4 py-3 text-sm outline-none transition bg-gray-50 border border-gray-200 text-gray-900 focus:border-blue-500 dark:bg-gray-950/60 dark:border-white/[0.05] dark:text-white" />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest mb-2 text-gray-500 dark:text-gray-400">Confirmar Nueva Contraseña</label>
                <input type="password" required value={confirmarPassword} onChange={(e) => setConfirmarPassword(e.target.value)} placeholder="Repite la contraseña" className="w-full rounded-xl px-4 py-3 text-sm outline-none transition bg-gray-50 border border-gray-200 text-gray-900 focus:border-blue-500 dark:bg-gray-950/60 dark:border-white/[0.05] dark:text-white" />
              </div>
            </div>
          ) : modoRecuperar ? (
            <div className="space-y-4 animate-fade-in">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest mb-2 text-gray-500 dark:text-gray-400">Ingresa tu Correo Registrado</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu-correo@ejemplo.com" required className="w-full rounded-xl px-4 py-3 text-sm outline-none transition bg-gray-50 border border-gray-200 text-gray-900 focus:border-blue-500 dark:bg-gray-950/60 dark:border-white/[0.05] dark:text-white" />
              </div>
            </div>
          ) : (
            <>
              <div className={`transition-all duration-300 origin-top ${esLogin ? 'opacity-0 h-0 overflow-hidden pointer-events-none scale-95' : 'opacity-100 h-auto scale-100'}`}>
                <label className="block text-[10px] font-bold uppercase tracking-widest mb-2 text-gray-500 dark:text-gray-400">Nombre Completo</label>
                <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Luis Martínez" required={!esLogin} className="w-full rounded-xl px-4 py-3 text-sm outline-none transition bg-gray-50 border border-gray-200 text-gray-900 focus:border-blue-500 dark:bg-gray-950/60 dark:border-white/[0.05] dark:text-white" />
              </div>

              <div className={`transition-all duration-300 origin-top ${esLogin ? 'opacity-0 h-0 overflow-hidden pointer-events-none scale-95' : 'opacity-100 h-auto scale-100'}`}>
                <label className="block text-[10px] font-bold uppercase tracking-widest mb-2 text-gray-500 dark:text-gray-400">Tipo de Perfil</label>
                <div className="grid grid-cols-2 gap-3">
                  <button type="button" onClick={() => setRol('estudiante')} className={`py-2 text-xs font-semibold rounded-xl border transition ${rol === 'estudiante' ? 'bg-gray-900 text-white border-gray-900 dark:bg-white dark:text-gray-950' : 'bg-transparent text-gray-500 border-gray-200'}`}>Estudiante</button>
                  <button type="button" onClick={() => setRol('profesor')} className={`py-2 text-xs font-semibold rounded-xl border transition ${rol === 'profesor' ? 'bg-gray-900 text-white border-gray-900 dark:bg-white dark:text-gray-950' : 'bg-transparent text-gray-500 border-gray-200'}`}>Docente</button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest mb-2 text-gray-500 dark:text-gray-400">Dirección de Correo</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="usuario@dominio.com" required className="w-full rounded-xl px-4 py-3 text-sm outline-none transition bg-gray-50 border border-gray-200 text-gray-900 focus:border-blue-500 dark:bg-gray-950/60 dark:border-white/[0.05] dark:text-white" />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Contraseña de Acceso</label>
                  {esLogin && (
                    <button type="button" onClick={() => { setModoRecuperar(true); setError(''); setExito(''); }} className="text-[10px] font-bold text-blue-500 hover:underline lowercase tracking-normal">¿se te olvidó?</button>
                  )}
                </div>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required={!modoRecuperar} className="w-full rounded-xl px-4 py-3 text-sm outline-none transition bg-gray-50 border border-gray-200 text-gray-900 focus:border-blue-500 dark:bg-gray-950/60 dark:border-white/[0.05] dark:text-white" />
              </div>
            </>
          )}

          <button
            type="submit" disabled={loading}
            className={`w-full font-bold text-xs uppercase tracking-widest py-3.5 px-4 rounded-xl shadow-xl transition duration-200 active:scale-[0.98] mt-4 disabled:opacity-50
              ${modoRecuperar || modoNuevoPassword ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/10' : 'bg-gray-950 text-white dark:bg-white dark:text-gray-950'}
            `}
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
            <button type="button" onClick={() => { setModoRecuperar(false); setModoNuevoPassword(false); setError(''); setExito(''); }} className="w-full text-center text-[10px] font-bold uppercase tracking-wider text-gray-400 hover:text-gray-600 dark:hover:text-white block pt-2">
              ← Volver al inicio de sesión
            </button>
          )}

        </form>

      </div>
    </div>
  );
}