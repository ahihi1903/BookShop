import { customerRepository } from '../repositories/customer.repository.js';
import { AppError } from '../utils/AppError.js';

export const favoriteService = {
  async toggle(userId, bookId) {
    const book = await customerRepository.findBookForPurchase(bookId);
    if (!book || book.status !== 'ACTIVE') throw new AppError('Book was not found', 404, 'BOOK_NOT_FOUND');

    return customerRepository.transaction(async (repository) => {
      const existing = await repository.findFavorite(userId, bookId);
      if (existing) {
        await repository.deleteFavorite(userId, bookId);
        return { bookId, isFavorite: false };
      }
      await repository.createFavorite(userId, bookId);
      return { bookId, isFavorite: true };
    });
  },
};
