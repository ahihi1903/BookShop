import { favoriteService } from '../services/favorite.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const toggleFavorite = asyncHandler(async (req, res) => {
  const data = await favoriteService.toggle(req.user.id, req.params.bookId);
  res.status(200).json({ success: true, message: 'Favorite updated', data });
});
