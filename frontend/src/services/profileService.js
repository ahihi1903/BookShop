import api from './api.js';

export const profileService = {
  get: () => api.get('/users/me'),
  update: (payload) => api.patch('/users/me', payload),
  changePassword: (payload) => api.patch('/users/me/password', payload),
};
