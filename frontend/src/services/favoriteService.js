import api from './api.js';

export const favoriteService = {
  toggle: async (bookId) => (await api.put(`/users/me/favorites/${encodeURIComponent(bookId)}`)).data?.data,
};
