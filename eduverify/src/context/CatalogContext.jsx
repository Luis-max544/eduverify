import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import * as api from '../api';

const CatalogContext = createContext(null);
export const useCatalog = () => useContext(CatalogContext);

export function CatalogProvider({ children }) {
  const { usuario } = useAuth();
  const [videosDemo, setVideosDemo] = useState([]);
  const [cursosPublicos, setCursosPublicos] = useState([]);
  const [busqueda, setBusqueda] = useState('');

  // Fetch catalog on login; reset on logout
  useEffect(() => {
    if (!usuario) {
      setVideosDemo([]);
      setCursosPublicos([]);
      setBusqueda('');
      return;
    }
    api.videos.list({ page: 1, limit: 50 }).then(d => setVideosDemo(d.items)).catch(() => {});
    api.cursos.list({ limit: 48 }).then(d => setCursosPublicos(d.items)).catch(() => {});
  }, [usuario?.id]);

  const recargarVideos = () => {
    api.videos.list({ page: 1, limit: 50 }).then(d => setVideosDemo(d.items)).catch(() => {});
  };

  return (
    <CatalogContext.Provider value={{ videosDemo, cursosPublicos, busqueda, setBusqueda, recargarVideos }}>
      {children}
    </CatalogContext.Provider>
  );
}
