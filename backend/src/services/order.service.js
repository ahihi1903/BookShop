import { randomUUID } from 'node:crypto';
import { customerRepository } from '../repositories/customer.repository.js';
import { FREE_SHIPPING_THRESHOLD, MEMBERSHIP_POINTS_PER_10000, ORDER_TRANSITIONS, STANDARD_SHIPPING_FEE } from '../constants/commerce.js';
import { AppError } from '../utils/AppError.js';

function toCents(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric < 0) throw new AppError('Invalid monetary value in catalog', 422, 'INVALID_PRICE');
  return Math.round(numeric * 100);
}

function fromCents(value) { return (value / 100).toFixed(2); }

function effectiveUnitPrice(book) {
  const base = toCents(book.price);
  const discounted = book.discountPrice == null ? null : toCents(book.discountPrice);
  return discounted !== null && discounted > 0 && discounted < base ? discounted : base;
}

function calculatePromotion(promotion, subtotalCents, now = new Date()) {
  if (!promotion || promotion.status !== 'ACTIVE' || promotion.startsAt > now || promotion.endsAt < now) {
    throw new AppError('Promotion code is invalid or expired', 422, 'INVALID_PROMOTION');
  }
  if (promotion.usageLimit !== null && promotion.usedCount >= promotion.usageLimit) {
    throw new AppError('Promotion usage limit has been reached', 409, 'PROMOTION_EXHAUSTED');
  }
  if (subtotalCents < toCents(promotion.minOrderAmount)) {
    throw new AppError('Order does not meet the promotion minimum amount', 422, 'PROMOTION_MINIMUM_NOT_MET');
  }
  const value = Number(promotion.discountValue);
  const amount = promotion.discountType === 'PERCENTAGE'
    ? Math.round(subtotalCents * value / 100)
    : toCents(promotion.discountValue);
  return Math.min(subtotalCents, Math.max(0, amount));
}

function nextMembershipLevel(points, tiers) {
  const tier = [...tiers].sort((a, b) => a.minPoints - b.minPoints).filter((item) => item.minPoints <= points).at(-1);
  return tier?.level ?? 'BRONZE';
}

function orderNumber() {
  return `BS-${new Date().toISOString().slice(0, 10).replaceAll('-', '')}-${randomUUID().slice(0, 8).toUpperCase()}`;
}

export const orderService = {
  async checkout(userId, { shippingAddress, paymentMethod, promotionCode }) {
    return customerRepository.transaction(async (repository) => {
      const cart = await repository.findCartByUser(userId);
      if (!cart?.items?.length) throw new AppError('Your cart is empty', 422, 'EMPTY_CART');

      let subtotalCents = 0;
      const orderItems = [];
      for (const item of cart.items) {
        const book = item.book;
        if (!book || book.status !== 'ACTIVE') throw new AppError('A book in your cart is no longer available', 409, 'BOOK_UNAVAILABLE');
        if (!Number.isInteger(item.quantity) || item.quantity <= 0) throw new AppError('Cart contains an invalid quantity', 422, 'INVALID_QUANTITY');
        if (item.quantity > book.stock) throw new AppError(`${book.title} has only ${book.stock} copies available`, 409, 'INSUFFICIENT_STOCK');
        const unitPriceCents = effectiveUnitPrice(book);
        const lineCents = unitPriceCents * item.quantity;
        subtotalCents += lineCents;
        orderItems.push({ bookId: book.id, title: book.title, quantity: item.quantity, unitPrice: fromCents(unitPriceCents), subtotal: fromCents(lineCents) });
      }

      let promotion = null;
      let discountCents = 0;
      if (promotionCode) {
        promotion = await repository.findPromotionByCode(promotionCode.trim().toUpperCase());
        discountCents = calculatePromotion(promotion, subtotalCents);
        const reserved = await repository.reservePromotion(promotion.id, promotion.usageLimit);
        if (reserved.count !== 1) throw new AppError('Promotion usage limit has been reached', 409, 'PROMOTION_EXHAUSTED');
      }

      const shippingCents = subtotalCents >= FREE_SHIPPING_THRESHOLD * 100 ? 0 : STANDARD_SHIPPING_FEE * 100;
      const totalCents = Math.max(0, subtotalCents - discountCents + shippingCents);

      for (const item of cart.items) {
        const updated = await repository.decrementStock(item.bookId, item.quantity);
        if (updated.count !== 1) throw new AppError(`${item.book.title} no longer has enough stock`, 409, 'INSUFFICIENT_STOCK');
      }

      const order = await repository.createOrder({
        orderNumber: orderNumber(),
        userId,
        subtotal: fromCents(subtotalCents),
        discount: fromCents(discountCents),
        shippingFee: fromCents(shippingCents),
        total: fromCents(totalCents),
        shippingAddress: shippingAddress.trim(),
        paymentMethod,
        paymentStatus: 'PENDING',
        orderStatus: 'PENDING',
        promotionId: promotion?.id,
        items: { create: orderItems },
      });

      await repository.createPayment({
        orderId: order.id,
        method: paymentMethod,
        status: 'PENDING',
        amount: fromCents(totalCents),
      });
      await repository.clearCartItems(cart.id);

      const pointsEarned = Math.floor((totalCents / 100) / 10000) * MEMBERSHIP_POINTS_PER_10000;
      if (pointsEarned > 0) {
        const user = await repository.findUser(userId);
        const tiers = await repository.listMembershipTiers();
        const points = user.points + pointsEarned;
        await repository.updateMembershipPoints(userId, points, nextMembershipLevel(points, tiers));
      }

      const completedOrder = await repository.findOrderForUser(order.id, userId);
      return { ...completedOrder, pointsEarned, paymentPending: true };
    });
  },

  async list(userId, query = {}) {
    const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, Number.parseInt(query.limit, 10) || 10));
    const [items, total] = await Promise.all([
      customerRepository.listOrdersForUser(userId, { skip: (page - 1) * limit, take: limit }),
      customerRepository.countOrdersForUser(userId),
    ]);
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  },

  async get(userId, orderId) {
    const order = await customerRepository.findOrderForUser(orderId, userId);
    if (!order) throw new AppError('Order was not found', 404, 'ORDER_NOT_FOUND');
    return order;
  },

  async cancel(userId, orderId) {
    return customerRepository.transaction(async (repository) => {
      const order = await repository.findOrderForUser(orderId, userId);
      if (!order) throw new AppError('Order was not found', 404, 'ORDER_NOT_FOUND');
      if (!['PENDING', 'CONFIRMED'].includes(order.orderStatus) || order.paymentStatus === 'PAID') {
        throw new AppError('This order can no longer be cancelled', 409, 'ORDER_CANNOT_BE_CANCELLED');
      }
      for (const item of order.items) await repository.incrementStock(item.bookId, item.quantity);
      if (order.promotionId) await repository.releasePromotion(order.promotionId);
      await repository.updateOrderPaymentsStatus(order.id, 'FAILED');
      await repository.updateOrder(order.id, { orderStatus: 'CANCELLED', paymentStatus: 'FAILED' });

      const pointsToReverse = Math.floor((toCents(order.total) / 100) / 10000) * MEMBERSHIP_POINTS_PER_10000;
      if (pointsToReverse > 0) {
        const user = await repository.findUser(userId);
        const tiers = await repository.listMembershipTiers();
        const points = Math.max(0, user.points - pointsToReverse);
        await repository.updateMembershipPoints(userId, points, nextMembershipLevel(points, tiers));
      }
      return { cancelled: true, id: order.id };
    });
  },

  async updateStatusAsAdmin(orderId, nextStatus) {
    return customerRepository.transaction(async (repository) => {
      const order = await repository.findOrderById(orderId);
      if (!order) throw new AppError('Order was not found', 404, 'ORDER_NOT_FOUND');
      if (!(ORDER_TRANSITIONS[order.orderStatus] || []).includes(nextStatus)) {
        throw new AppError(`Cannot transition order from ${order.orderStatus} to ${nextStatus}`, 409, 'INVALID_ORDER_TRANSITION');
      }
      if (nextStatus === 'CANCELLED' && order.paymentStatus === 'PAID') {
        throw new AppError('A paid order must be refunded before it can be cancelled', 409, 'REFUND_REQUIRED');
      }
      if (nextStatus === 'DELIVERED' && order.paymentMethod !== 'COD' && order.paymentStatus !== 'PAID') {
        throw new AppError('The order must be paid before it can be marked delivered', 409, 'PAYMENT_REQUIRED');
      }

      const update = { orderStatus: nextStatus };
      if (nextStatus === 'CANCELLED') {
        for (const item of order.items) await repository.incrementStock(item.bookId, item.quantity);
        if (order.promotionId) await repository.releasePromotion(order.promotionId);
        await repository.updateOrderPaymentsStatus(order.id, 'FAILED');
        update.paymentStatus = 'FAILED';

        const pointsToReverse = Math.floor((toCents(order.total) / 100) / 10000) * MEMBERSHIP_POINTS_PER_10000;
        if (pointsToReverse > 0) {
          const user = await repository.findUser(order.userId);
          const tiers = await repository.listMembershipTiers();
          const points = Math.max(0, user.points - pointsToReverse);
          await repository.updateMembershipPoints(order.userId, points, nextMembershipLevel(points, tiers));
        }
      }
      if (nextStatus === 'DELIVERED' && order.paymentMethod === 'COD') {
        await repository.updateOrderPaymentsStatus(order.id, 'PAID');
        update.paymentStatus = 'PAID';
      }
      return repository.updateOrder(order.id, update);
    });
  },

  async validatePromotion(userId, code) {
    const cart = await customerRepository.findCartByUser(userId);
    if (!cart?.items?.length) throw new AppError('Your cart is empty', 422, 'EMPTY_CART');
    const subtotalCents = cart.items.reduce((sum, item) => sum + effectiveUnitPrice(item.book) * item.quantity, 0);
    const promotion = await customerRepository.findPromotionByCode(code.trim().toUpperCase());
    const discountCents = calculatePromotion(promotion, subtotalCents);
    return { code: promotion.code, name: promotion.name, discount: fromCents(discountCents), subtotal: fromCents(subtotalCents) };
  },
};
