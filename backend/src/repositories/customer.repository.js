import { Prisma } from '@prisma/client';
import { prisma } from '../config/database.js';

function createRepository(db) {
  return {
    listBooks({ where, orderBy, skip, take }) {
      return db.book.findMany({
        where,
        orderBy,
        skip,
        take,
        include: {
          category: { select: { id: true, name: true, slug: true } },
          reviews: { where: { status: 'ACTIVE' }, select: { rating: true } },
          _count: { select: { reviews: true } },
        },
      });
    },
    countBooks(where) { return db.book.count({ where }); },
    findBook(idOrSlug) {
      return db.book.findFirst({
        where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
        include: {
          category: { select: { id: true, name: true, slug: true } },
          reviews: { where: { status: 'ACTIVE' }, select: { rating: true } },
          _count: { select: { reviews: true } },
        },
      });
    },
    findCategoryById(id) { return db.category.findUnique({ where: { id } }); },
    listCategories() {
      return db.category.findMany({ where: { status: 'ACTIVE' }, orderBy: { name: 'asc' }, include: { _count: { select: { books: true } } } });
    },
    findCartByUser(userId) {
      return db.cart.findUnique({
        where: { userId },
        include: {
          items: {
            orderBy: { createdAt: 'asc' },
            include: {
              book: { include: { category: { select: { id: true, name: true, slug: true } } } },
            },
          },
        },
      });
    },
    createCart(userId) { return db.cart.create({ data: { userId } }); },
    findCartItem(cartId, bookId) { return db.cartItem.findUnique({ where: { cartId_bookId: { cartId, bookId } } }); },
    createCartItem(data) { return db.cartItem.create({ data }); },
    updateCartItem(id, quantity) { return db.cartItem.update({ where: { id }, data: { quantity } }); },
    deleteCartItem(id) { return db.cartItem.delete({ where: { id } }); },
    clearCartItems(cartId) { return db.cartItem.deleteMany({ where: { cartId } }); },
    findBookForPurchase(id) { return db.book.findUnique({ where: { id } }); },
    findPromotionByCode(code) { return db.promotion.findUnique({ where: { code } }); },
    listActivePromotions(now) {
      return db.promotion.findMany({
        where: { status: 'ACTIVE', startsAt: { lte: now }, endsAt: { gte: now } },
        orderBy: { endsAt: 'asc' },
        select: { id: true, code: true, name: true, description: true, discountType: true, discountValue: true, minOrderAmount: true, startsAt: true, endsAt: true },
      });
    },
    reservePromotion(id, usageLimit) {
      const where = { id, status: 'ACTIVE' };
      if (usageLimit !== null) where.usedCount = { lt: usageLimit };
      return db.promotion.updateMany({
        where,
        data: { usedCount: { increment: 1 } },
      });
    },
    releasePromotion(id) {
      return db.promotion.updateMany({ where: { id, usedCount: { gt: 0 } }, data: { usedCount: { decrement: 1 } } });
    },
    decrementStock(bookId, quantity) {
      return db.book.updateMany({ where: { id: bookId, status: 'ACTIVE', stock: { gte: quantity } }, data: { stock: { decrement: quantity } } });
    },
    incrementStock(bookId, quantity) {
      return db.book.update({ where: { id: bookId }, data: { stock: { increment: quantity } } });
    },
    createOrder(data) { return db.order.create({ data, include: { items: true, payments: true } }); },
    createPayment(data) { return db.payment.create({ data }); },
    findOrderForUser(id, userId) {
      return db.order.findFirst({ where: { id, userId }, include: { items: true, payments: true, promotion: true } });
    },
    findOrderById(id) {
      return db.order.findUnique({ where: { id }, include: { items: true, payments: true, promotion: true } });
    },
    listOrdersForUser(userId, { skip, take }) {
      return db.order.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, skip, take, include: { items: true } });
    },
    countOrdersForUser(userId) { return db.order.count({ where: { userId } }); },
    updateOrder(id, data) { return db.order.update({ where: { id }, data, include: { items: true, payments: true } }); },
    updateOrderPaymentsStatus(orderId, status) { return db.payment.updateMany({ where: { orderId, status: 'PENDING' }, data: { status } }); },
    hasDeliveredBookPurchase(userId, bookId) {
      return db.orderItem.findFirst({ where: { bookId, order: { userId, orderStatus: 'DELIVERED' } }, select: { id: true } });
    },
    listReviews({ bookId, userId, skip, take }) {
      return db.review.findMany({
        where: { status: 'ACTIVE', ...(bookId ? { bookId } : {}), ...(userId ? { userId } : {}) },
        orderBy: { createdAt: 'desc' }, skip, take,
        include: { user: { select: { id: true, name: true } }, book: { select: { id: true, title: true, slug: true } } },
      });
    },
    countReviews(where) { return db.review.count({ where: { status: 'ACTIVE', ...where } }); },
    upsertReview({ userId, bookId, rating, comment }) {
      return db.review.upsert({
        where: { userId_bookId: { userId, bookId } },
        create: { userId, bookId, rating, comment },
        update: { rating, comment, status: 'ACTIVE' },
        include: { book: { select: { id: true, title: true, slug: true } } },
      });
    },
    findUser(id) { return db.user.findUnique({ where: { id } }); },
    findPublicUser(id) { return db.user.findUnique({ where: { id }, select: publicUserSelect }); },
    findReview(userId, bookId) { return db.review.findUnique({ where: { userId_bookId: { userId, bookId } } }); },
    findFavorite(userId, bookId) { return db.favorite.findUnique({ where: { userId_bookId: { userId, bookId } } }); },
    createFavorite(userId, bookId) { return db.favorite.create({ data: { userId, bookId } }); },
    deleteFavorite(userId, bookId) { return db.favorite.delete({ where: { userId_bookId: { userId, bookId } } }); },
    updateUser(id, data) {
      return db.user.update({ where: { id }, data, select: publicUserSelect });
    },
    getMembership(userId) {
      return db.user.findUnique({
        where: { id: userId },
        select: { id: true, points: true, membershipLevel: true },
      });
    },
    listMembershipTiers() { return db.membership.findMany({ where: { status: 'ACTIVE' }, orderBy: { minPoints: 'asc' } }); },
    updateMembershipPoints(userId, points, membershipLevel) {
      return db.user.update({ where: { id: userId }, data: { points, membershipLevel } });
    },
    transaction(callback) {
      return db.$transaction((tx) => callback(createRepository(tx)), { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    },
  };
}

const publicUserSelect = {
  id: true, name: true, email: true, phone: true, address: true, role: true,
  status: true, points: true, membershipLevel: true, createdAt: true, updatedAt: true,
};

export const customerRepository = createRepository(prisma);
