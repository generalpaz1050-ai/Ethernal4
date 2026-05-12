import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

const api = axios.create({
  baseURL: API,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('ethernal-token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  googleSession: (session_id) => api.post('/auth/google/session', { session_id }),
  me: () => api.get('/auth/me'),
  profile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data),
  logout: () => api.post('/auth/logout'),
};

export const charactersAPI = {
  list: (params = {}) => api.get('/characters', { params }),
  create: (data) => api.post('/characters', data),
  update: (id, data) => api.put(`/characters/${id}`, data),
  delete: (id) => api.delete(`/characters/${id}`),
  like: (id) => api.post(`/characters/${id}/like`),
};

export const chatsAPI = {
  list: () => api.get('/chats'),
  create: (characterId) => api.post('/chats', { characterId }),
  sendMessage: (chatId, message) => api.post(`/chats/${chatId}/message`, { message }),
};

export const subscriptionAPI = {
  plans: () => api.get('/subscription/plans'),
  stats: () => api.get('/me/stats'),
  checkout: (plan) => api.post('/subscription/checkout', { plan }),
};
