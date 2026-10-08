import { AppError } from '../utils/AppError.js';
import { customerRepository } from '../repositories/customer.repository.js';

const MAX_PAGE_SIZE = 48;

function ratingSummary(book) {
  const ratings = book.reviews ?? [];
  const averageRating = ratings.length
    ? Math.round((ratings.reduce((sum, review) => sum + review.rating, 0) / ratings.length) * 10) / 10
    : null;
  const { reviews: _reviews, ...publicBook } = book;
  return { ...publicBook, rating: averageRating, reviewCount: ratings.length };
}

function buildOrderBy(sort) {
  switch (sort) {
    case 'price_asc': return { price: 'asc' };
    case 'price_desc': return { price: 'desc' };
    case 'title_asc': return { title: 'asc' };
    case 'best_selling': return { orderItems: { _count: 'desc' } };
    default: return { createdAt: 'desc' };
  }
}

export const bookService = {
  async list(query) {
    const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
    const limit = Math.min(MAX_PAGE_SIZE, Math.max(1, Number.parseInt(query.limit, 10) || 12));
    const where = { status: 'ACTIVE' };
    const search = String(query.q ?? query.search ?? '').trim();
    if (search) where.OR = [
      { title: { contains: search } },
      { author: { contains: search } },
      { description: { contains: search } },
    ];
    if (query.categoryId) where.categoryId = String(query.categoryId);
    if (query.minPrice || query.maxPrice) {
      where.price = {};
      if (query.minPrice && Number.isFinite(Number(query.minPrice))) where.price.gte = Number(query.minPrice);
      if (query.maxPrice && Number.isFinite(Number(query.maxPrice))) where.price.lte = Number(query.maxPrice);
    }
    const minRating = Number(query.rating);
    if (Number.isFinite(minRating) && minRating >= 1 && minRating <= 5) {
      where.reviews = { some: { status: 'ACTIVE', rating: { gte: Math.floor(minRating) } } };
    }

    const requestedSort = query.featured === 'true' ? 'best_selling' : query.sort;
    const [rows, total] = await Promise.all([
      customerRepository.listBooks({ where, orderBy: buildOrderBy(requestedSort), skip: (page - 1) * limit, take: limit }),
      customerRepository.countBooks(where),
    ]);
    return { items: rows.map(ratingSummary), total, page, limit, totalPages: Math.ceil(total / limit) };
  },

  async get(idOrSlug) {
    const book = await customerRepository.findBook(idOrSlug);
    if (!book || book.status !== 'ACTIVE') throw new AppError('Book was not found', 404, 'BOOK_NOT_FOUND');
    return ratingSummary(book);
  },

  async related(idOrSlug) {
    const book = await customerRepository.findBook(idOrSlug);
    if (!book || book.status !== 'ACTIVE') throw new AppError('Book was not found', 404, 'BOOK_NOT_FOUND');
    const result = await customerRepository.listBooks({
      where: { status: 'ACTIVE', categoryId: book.categoryId, NOT: { id: book.id } },
      orderBy: { createdAt: 'desc' }, skip: 0, take: 8,
    });
    return result.map(ratingSummary);
  },
};
