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
  save: (id) => api.post(`/characters/${id}/save`),
  saved: () => api.get('/me/saved-characters'),
  generateAvatar: (data) => api.post('/characters/generate-avatar', data),
};

export const chatsAPI = {
  list: () => api.get('/chats'),
  create: (characterId) => api.post('/chats', { characterId }),
  sendMessage: (chatId, message) => api.post(`/chats/${chatId}/message`, { message }),
  regenerate: (chatId) => api.post(`/chats/${chatId}/regenerate`),
  editMessage: (chatId, index, content, regenerate = true) =>
    api.put(`/chats/${chatId}/messages/${index}`, { content, regenerate }),
  deleteMessage: (chatId, index) => api.delete(`/chats/${chatId}/messages/${index}`),
  variant: (chatId, index, direction) =>
    api.post(`/chats/${chatId}/messages/${index}/variant`, { direction }),
  setEngine: (chatId, engine) => api.post(`/chats/${chatId}/engine`, { engine }),
  save: (chatId, name) => api.post(`/chats/${chatId}/save`, { name: name || null }),
  reset: (chatId, opts = {}) => api.post(`/chats/${chatId}/reset`, {
    save_first: !!opts.saveFirst,
    save_name: opts.saveName || null,
  }),
  archives: (chatId) => api.get(`/chats/${chatId}/archives`),
};

export const archivesAPI = {
  get: (archiveId) => api.get(`/archives/${archiveId}`),
  delete: (archiveId) => api.delete(`/archives/${archiveId}`),
  restore: (archiveId) => api.post(`/archives/${archiveId}/restore`),
};

export const enginesAPI = {
  list: () => api.get('/engines'),
};

export const subscriptionAPI = {
  plans: () => api.get('/subscription/plans'),
  stats: () => api.get('/me/stats'),
  checkout: (plan) => api.post('/subscription/checkout', { plan }),
};

export const tagsAPI = {
  defaults: () => api.get('/tags/default'),
};

export const adminAPI = {
  listUsers: () => api.get('/admin/users'),
  setSubscription: (userId, data) => api.post(`/admin/users/${userId}/subscription`, data),
  banUser: (userId, banned) => api.post(`/admin/users/${userId}/ban`, { banned }),
  setKyr: (userId, amount, mode = 'add') => api.post(`/admin/users/${userId}/kyr`, { amount, mode }),
  listCharacters: (params = {}) => api.get('/admin/characters', { params }),
  deleteCharacter: (charId) => api.delete(`/admin/characters/${charId}`),
};

export const shopAPI = {
  items: () => api.get('/shop/items'),
  wallet: () => api.get('/me/wallet'),
  purchase: (kind, item_id) => api.post('/shop/purchase', { kind, item_id }),
  equip: (kind, item_id) => api.post('/me/equip', { kind, item_id }),
};

export const dailyBoxAPI = {
  status: () => api.get('/me/daily-box'),
  claim: () => api.post('/me/daily-box/claim'),
};
