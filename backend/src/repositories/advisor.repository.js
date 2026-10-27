import { Prisma } from '@prisma/client';
import { prisma } from '../config/database.js';

export const advisorRepository = {
  lookupCatalog() {
    return prisma.book.findMany({ where: { status: 'ACTIVE', category: { status: 'ACTIVE' } }, select: { id: true, slug: true, isbn: true, title: true } });
  },
  findBook(id) {
    return prisma.book.findFirst({ where: { id, status: 'ACTIVE', category: { status: 'ACTIVE' } }, select: { id: true, slug: true, isbn: true, title: true, author: true, image: true, price: true, discountPrice: true, stock: true, category: { select: { name: true } } } });
  },
  async bestSellers() {
    const ranked = await prisma.orderItem.groupBy({
      by: ['bookId'],
      where: { order: { orderStatus: 'DELIVERED', paymentStatus: { notIn: ['REFUNDED', 'FAILED'] } }, book: { status: 'ACTIVE', stock: { gt: 0 }, category: { status: 'ACTIVE' } } },
      _sum: { quantity: true }, orderBy: [{ _sum: { quantity: 'desc' } }, { bookId: 'asc' }], take: 3,
    });
    return (await Promise.all(ranked.map(({ bookId }) => this.findBook(bookId)))).filter(Boolean);
  },
  async recommend({ categoryId, minPrice, maxPrice, target }) {
    const price = Prisma.sql`CASE WHEN b.discountPrice IS NOT NULL AND b.discountPrice > 0 AND b.discountPrice < b.price THEN b.discountPrice ELSE b.price END`;
    const conditions = [Prisma.sql`b.status = 'ACTIVE'`, Prisma.sql`b.stock > 0`, Prisma.sql`c.status = 'ACTIVE'`];
    if (categoryId) conditions.push(Prisma.sql`b.categoryId = ${categoryId}`);
    if (minPrice !== undefined) conditions.push(Prisma.sql`${price} >= ${minPrice}`);
    if (maxPrice !== undefined) conditions.push(Prisma.sql`${price} <= ${maxPrice}`);
    const order = target !== undefined ? Prisma.sql`ABS(${price} - ${target}) ASC` : Prisma.sql`${price} ASC`;
    const ids = await prisma.$queryRaw(Prisma.sql`SELECT b.id FROM Book b JOIN Category c ON c.id = b.categoryId WHERE ${Prisma.join(conditions, ' AND ')} ORDER BY ${order}, b.id ASC LIMIT 3`);
    const books = await prisma.book.findMany({ where: { id: { in: ids.map(({ id }) => id) }, status: 'ACTIVE', stock: { gt: 0 } }, select: { id: true, slug: true, title: true, author: true, image: true, price: true, discountPrice: true, stock: true, category: { select: { name: true } } } });
    const byId = new Map(books.map((book) => [book.id, book]));
    return ids.map(({ id }) => byId.get(id)).filter(Boolean);
  },
};
