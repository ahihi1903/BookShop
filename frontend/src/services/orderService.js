import api from './api.js';

export const orderService = {
  list: (params) => api.get('/orders', { params }),
  get: (id) => api.get(`/orders/${encodeURIComponent(id)}`),
  checkout: (payload) => api.post('/orders', payload),
  cancel: (id) => api.post(`/orders/${encodeURIComponent(id)}/cancel`),
};
