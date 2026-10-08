import { customerRepository } from '../repositories/customer.repository.js';
import { AppError } from '../utils/AppError.js';

function effectiveUnitPrice(book) {
  const basePrice = Number(book.price);
  const discountedPrice = book.discountPrice == null ? null : Number(book.discountPrice);
  return Number.isFinite(discountedPrice) && discountedPrice > 0 && discountedPrice < basePrice
    ? discountedPrice
    : basePrice;
}

async function getOrCreateCart(repository, userId) {
  let cart = await repository.findCartByUser(userId);
  if (!cart) {
    try { await repository.createCart(userId); }
    catch (error) { if (error?.code !== 'P2002') throw error; }
    cart = await repository.findCartByUser(userId);
  }
  return cart;
}

export const cartService = {
  async getCart(userId) {
    const cart = await getOrCreateCart(customerRepository, userId);
    const items = cart.items.map((item) => ({
      ...item,
      lineSubtotal: effectiveUnitPrice(item.book) * item.quantity,
    }));
    return { ...cart, items, itemCount: items.reduce((sum, item) => sum + item.quantity, 0) };
  },

  async addToCart(userId, bookId, quantity) {
    if (!Number.isInteger(quantity) || quantity <= 0) throw new AppError('Quantity must be a positive integer', 422, 'INVALID_QUANTITY');
    return customerRepository.transaction(async (repository) => {
      const book = await repository.findBookForPurchase(bookId);
      if (!book || book.status !== 'ACTIVE') throw new AppError('Book was not found', 404, 'BOOK_NOT_FOUND');
      const cart = await getOrCreateCart(repository, userId);
      const existing = await repository.findCartItem(cart.id, bookId);
      const nextQuantity = (existing?.quantity ?? 0) + quantity;
      if (nextQuantity > book.stock) throw new AppError(`Only ${book.stock} copies are available`, 409, 'INSUFFICIENT_STOCK');
      const item = existing
        ? await repository.updateCartItem(existing.id, nextQuantity)
        : await repository.createCartItem({ cartId: cart.id, bookId, quantity });
      return { ...item, book, lineSubtotal: effectiveUnitPrice(book) * nextQuantity };
    });
  },

  async updateQuantity(userId, itemId, quantity) {
    if (!Number.isInteger(quantity) || quantity <= 0) throw new AppError('Quantity must be a positive integer', 422, 'INVALID_QUANTITY');
    return customerRepository.transaction(async (repository) => {
      const cart = await getOrCreateCart(repository, userId);
      const item = cart.items.find((cartItem) => cartItem.id === itemId);
      if (!item) throw new AppError('Cart item was not found', 404, 'CART_ITEM_NOT_FOUND');
      if (item.book.status !== 'ACTIVE') throw new AppError('This book is no longer available', 409, 'BOOK_UNAVAILABLE');
      if (quantity > item.book.stock) throw new AppError(`Only ${item.book.stock} copies are available`, 409, 'INSUFFICIENT_STOCK');
      return repository.updateCartItem(itemId, quantity);
    });
  },

  async removeFromCart(userId, itemId) {
    const cart = await getOrCreateCart(customerRepository, userId);
    const item = cart.items.find((cartItem) => cartItem.id === itemId);
    if (!item) throw new AppError('Cart item was not found', 404, 'CART_ITEM_NOT_FOUND');
    await customerRepository.deleteCartItem(itemId);
    return { removed: true, itemId };
  },

  async clearCart(userId) {
    const cart = await getOrCreateCart(customerRepository, userId);
    await customerRepository.clearCartItems(cart.id);
    return { cleared: true };
  },
};
