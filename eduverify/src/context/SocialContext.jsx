import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import * as api from '../api';

const SocialContext = createContext(null);
export const useSocial = () => useContext(SocialContext);

export function SocialProvider({ children }) {
  const { usuario } = useAuth();
  const [favoritos, setFavoritos] = useState([]);
  const [historial, setHistorial] = useState([]);
  const [suscripciones, setSuscripciones] = useState([]);
  const [notificaciones, setNotificaciones] = useState([]);
  const [uploadQueue, setUploadQueue] = useState([]);

  // Fetch social data on login; reset on logout
  useEffect(() => {
    if (!usuario) {
      setFavoritos([]);
      setHistorial([]);
      setSuscripciones([]);
      setNotificaciones([]);
      setUploadQueue([]);
      return;
    }
    api.favorites.list().then(setFavoritos).catch(() => {});
    api.history.list().then(setHistorial).catch(() => {});
    api.subscriptions.list().then(setSuscripciones).catch(() => {});
    api.notifications.list().then(setNotificaciones).catch(() => {});
  }, [usuario?.id]);

  const toggleSuscripcion = async (profesorId) => {
    if (!profesorId) return;
    const estaSuscrito = suscripciones.some(s => s.professor_id === profesorId);
    try {
      if (estaSuscrito) {
        await api.subscriptions.remove(profesorId);
      } else {
        await api.subscriptions.add(profesorId);
      }
      api.subscriptions.list().then(setSuscripciones).catch(() => {});
      api.notifications.list().then(setNotificaciones).catch(() => {});
    } catch (err) {
      console.error('Error al actualizar suscripción:', err.message);
    }
  };

  const marcarNotificacionesLeidas = () => {
    if (!notificaciones.some(n => !n.leida)) return;
    api.notifications.readAll()
      .then(() => setNotificaciones(prev => prev.map(n => ({ ...n, leida: true }))))
      .catch(() => {});
  };

  const addToUploadQueue = (entry) => setUploadQueue(prev => [...prev, entry]);
  const updateUploadProgress = (id, patch) =>
    setUploadQueue(prev => prev.map(u => u.id === id ? { ...u, ...patch } : u));
  const dismissUpload = (id) => setUploadQueue(prev => prev.filter(u => u.id !== id));

  return (
    <SocialContext.Provider value={{
      favoritos, setFavoritos,
      historial, setHistorial,
      suscripciones,
      notificaciones,
      toggleSuscripcion,
      marcarNotificacionesLeidas,
      uploadQueue,
      addToUploadQueue,
      updateUploadProgress,
      dismissUpload,
    }}>
      {children}
    </SocialContext.Provider>
  );
}
