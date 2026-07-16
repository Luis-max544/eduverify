// Cliente central del API REST de EduVerify.
// Único módulo que conoce HTTP: base URL, token JWT y envelope {status, data}.

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const TOKEN_KEY = 'eduverify_token';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

async function request(path, { method = 'GET', body, isForm = false } = {}) {
  const headers = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body && !isForm) headers['Content-Type'] = 'application/json';

  const res = await fetch(`${BASE}/api${path}`, {
    method,
    headers,
    body: body ? (isForm ? body : JSON.stringify(body)) : undefined,
  });

  if (res.status === 401 && token) {
    clearToken();
    window.dispatchEvent(new Event('auth:logout'));
  }

  let json;
  try {
    json = await res.json();
  } catch {
    throw new Error('Error de conexión con el servidor');
  }

  if (!res.ok || json.status !== 'success') {
    throw new Error(json.message || 'Error inesperado del servidor');
  }
  return json.data;
}

const qs = (params) => {
  const filtered = Object.fromEntries(
    Object.entries(params || {}).filter(([, v]) => v !== undefined && v !== null && v !== '')
  );
  const s = new URLSearchParams(filtered).toString();
  return s ? `?${s}` : '';
};

export const auth = {
  login: ({ correo, password }) => request('/auth/login', { method: 'POST', body: { correo, password } }),
  registro: ({ nombre, correo, password, rol }) => request('/auth/registro', { method: 'POST', body: { nombre, correo, password, rol } }),
  google: (credential) => request('/auth/google', { method: 'POST', body: { credential } }),
  cambiarPassword: (email) => request('/auth/cambiar-password', { method: 'POST', body: { email } }),
  actualizarPassword: ({ id, token, password }) => request('/auth/actualizar-password', { method: 'POST', body: { id, token, password } }),
};

export const users = {
  me: () => request('/users/me'),
  updateNombre: (nombre) => request('/users/me', { method: 'PATCH', body: { nombre } }),
  updateDarkMode: (dark_mode) => request('/users/me/dark-mode', { method: 'PATCH', body: { dark_mode } }),
  uploadAvatar: (file) => {
    const form = new FormData();
    form.append('avatar', file);
    return request('/users/me/avatar', { method: 'POST', body: form, isForm: true });
  },
  uploadBanner: (file) => {
    const form = new FormData();
    form.append('banner', file);
    return request('/users/me/banner', { method: 'POST', body: form, isForm: true });
  },
  profile: (id) => request(`/users/${id}/profile`),
  videos: (id, params) => request(`/users/${id}/videos${qs(params)}`),
};

export const videos = {
  list: (params) => request(`/videos${qs(params)}`),
  get: (id) => request(`/videos/${id}`),
  create: (video) => request('/videos', { method: 'POST', body: video }),
  update: (id, campos) => request(`/videos/${id}`, { method: 'PATCH', body: campos }),
  remove: (id) => request(`/videos/${id}`, { method: 'DELETE' }),
  view: (id) => request(`/videos/${id}/view`, { method: 'POST' }),
};

export const comments = {
  list: (videoId) => request(`/videos/${videoId}/comments`),
  create: (videoId, { texto, parent_id = null }) =>
    request(`/videos/${videoId}/comments`, { method: 'POST', body: { texto, parent_id } }),
  like: (id) => request(`/comments/${id}/like`, { method: 'POST' }),
  remove: (id) => request(`/comments/${id}`, { method: 'DELETE' }),
};

export const favorites = {
  list: () => request('/favorites'),
  add: (videoId) => request(`/favorites/${videoId}`, { method: 'POST' }),
  remove: (videoId) => request(`/favorites/${videoId}`, { method: 'DELETE' }),
};

export const history = {
  list: (params) => request(`/history${qs(params)}`),
  add: (videoId) => request(`/history/${videoId}`, { method: 'POST' }),
  clear: () => request('/history', { method: 'DELETE' }),
  remove: (videoId) => request(`/history/${videoId}`, { method: 'DELETE' }),
};

export const playlists = {
  list: () => request('/playlists'),
  create: (nombre) => request('/playlists', { method: 'POST', body: { nombre } }),
  remove: (id) => request(`/playlists/${id}`, { method: 'DELETE' }),
  addVideo: (id, videoId) => request(`/playlists/${id}/videos/${videoId}`, { method: 'POST' }),
  removeVideo: (id, videoId) => request(`/playlists/${id}/videos/${videoId}`, { method: 'DELETE' }),
};

export const profesorPlaylists = {
  list: () => request('/profesor/playlists'),
  publicList: (userId) => request(`/profesor/playlists/public/${userId}`),
  create: (campos) => request('/profesor/playlists', { method: 'POST', body: campos }),
  uploadCover: (id, file) => {
    const form = new FormData();
    form.append('cover', file);
    return request(`/profesor/playlists/${id}/cover`, { method: 'PUT', body: form, isForm: true });
  },
  update: (id, campos) => request(`/profesor/playlists/${id}`, { method: 'PATCH', body: campos }),
  reorder: (id, ordenIds) => request(`/profesor/playlists/${id}/orden`, { method: 'PUT', body: { orden: ordenIds } }),
  remove: (id) => request(`/profesor/playlists/${id}`, { method: 'DELETE' }),
  addVideo: (id, videoId, orden) =>
    request(`/profesor/playlists/${id}/videos/${videoId}`, { method: 'POST', body: { orden } }),
  removeVideo: (id, videoId) => request(`/profesor/playlists/${id}/videos/${videoId}`, { method: 'DELETE' }),
  getQuizzes: (id) => request(`/profesor/playlists/${id}/quizzes`),
  saveQuiz: (id, body) => request(`/profesor/playlists/${id}/quiz`, { method: 'PUT', body }),
  removeQuiz: (id, quizId) => request(`/profesor/playlists/${id}/quizzes/${quizId}`, { method: 'DELETE' }),
  getPdfs: (id) => request(`/profesor/playlists/${id}/pdfs`),
  uploadPdf: (id, file, videoId = null) => {
    const form = new FormData();
    form.append('pdf', file);
    if (videoId !== null) form.append('video_id', videoId);
    return request(`/profesor/playlists/${id}/pdf`, { method: 'PUT', body: form, isForm: true });
  },
  removePdf: (id, pdfId) => request(`/profesor/playlists/${id}/pdfs/${pdfId}`, { method: 'DELETE' }),
};

export const cursos = {
  list: (params) => request(`/cursos${qs(params)}`),
  get: (id) => request(`/cursos/${id}`),
  misCursos: () => request('/cursos/mis-cursos'),
  progreso: (id) => request(`/cursos/${id}/progreso`),
  inscribir: (id) => request(`/cursos/${id}/inscripcion`, { method: 'POST' }),
  desinscribir: (id) => request(`/cursos/${id}/inscripcion`, { method: 'DELETE' }),
  completarLeccion: (id, videoId) => request(`/cursos/${id}/lecciones/${videoId}/completar`, { method: 'POST' }),
  descompletarLeccion: (id, videoId) => request(`/cursos/${id}/lecciones/${videoId}/completar`, { method: 'DELETE' }),
  reviews: (id) => request(`/cursos/${id}/reviews`),
  upsertReview: (id, { estrellas, texto }) => request(`/cursos/${id}/reviews`, { method: 'PUT', body: { estrellas, texto } }),
  removeReview: (id) => request(`/cursos/${id}/reviews`, { method: 'DELETE' }),
  getQuiz: (id, quizId) => request(`/cursos/${id}/quizzes/${quizId}`),
  submitQuiz: (id, quizId, respuestas) => request(`/cursos/${id}/quizzes/${quizId}/intento`, { method: 'POST', body: { respuestas } }),
  getPdfs: (id) => request(`/cursos/${id}/pdfs`),
};

export const ai = {
  chat: (video_id, messages) => request('/ai/chat', { method: 'POST', body: { video_id, messages } }),
};

export const subscriptions = {
  list: () => request('/subscriptions'),
  add: (professorId, notificaciones = true) =>
    request(`/subscriptions/${professorId}`, { method: 'POST', body: { notificaciones } }),
  remove: (professorId) => request(`/subscriptions/${professorId}`, { method: 'DELETE' }),
};

export const notifications = {
  list: (params) => request(`/notifications${qs(params)}`),
  readAll: () => request('/notifications/read-all', { method: 'PATCH' }),
  read: (id) => request(`/notifications/${id}/read`, { method: 'PATCH' }),
};

export const premium = {
  activate: () => request('/premium/activate', { method: 'POST' }),
  cancel: () => request('/premium/cancel', { method: 'DELETE' }),
  activatePlus: () => request('/premium/activate-plus', { method: 'POST' }),
  cancelPlus: () => request('/premium/cancel-plus', { method: 'DELETE' }),
  status: () => request('/premium/status'),
  activateTeacherMembership: () => request('/premium/teacher-membership', { method: 'POST' }),
  cancelTeacherMembership: () => request('/premium/teacher-membership', { method: 'DELETE' }),
  teacherMembershipStatus: () => request('/premium/teacher-membership/status'),
};

export const channelSubs = {
  list: () => request('/channel-subs'),
  check: (profesorId) => request(`/channel-subs/check/${profesorId}`),
  subscribe: (profesorId) => request(`/channel-subs/${profesorId}`, { method: 'POST' }),
  unsubscribe: (profesorId) => request(`/channel-subs/${profesorId}`, { method: 'DELETE' }),
};

export const coursePurchases = {
  buy: (cursoId, codigo) => request(`/cursos/${cursoId}/purchase`, { method: 'POST', body: { codigo } }),
  status: (cursoId) => request(`/cursos/${cursoId}/purchase/status`),
  refund: (cursoId) => request(`/cursos/${cursoId}/purchase/refund`, { method: 'DELETE' }),
};

export const couponsApi = {
  list: (playlistId) => request(`/profesor/playlists/${playlistId}/coupons`),
  create: (playlistId, data) => request(`/profesor/playlists/${playlistId}/coupons`, { method: 'POST', body: data }),
  update: (id, data) => request(`/coupons/${id}`, { method: 'PATCH', body: data }),
  remove: (id) => request(`/coupons/${id}`, { method: 'DELETE' }),
};

export const earnings = {
  get: () => request('/profesor/earnings'),
};

export const userSettings = {
  setCanalPrecio: (canal_precio) => request('/users/me/canal-precio', { method: 'PATCH', body: { canal_precio } }),
};
