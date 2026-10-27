import test from 'node:test';
import assert from 'node:assert/strict';
import { registerSchema } from '../src/validators/auth.validator.js';
import { reviewSchema } from '../src/validators/customer.validator.js';
import { bookCreateSchema, membershipCreateSchema, membershipUpdateSchema, promotionCreateSchema } from '../src/validators/admin.validator.js';
import { ORDER_TRANSITIONS } from '../src/constants/commerce.js';
import { newsletterSubscribeSchema } from '../src/validators/newsletter.validator.js';
import { validate } from '../src/middlewares/validate.js';

test('registration rejects role injection and malformed identities', () => {
  assert.equal(registerSchema.safeParse({ name: 'Test User', email: 'test@example.com', password: 'long-enough-password', role: 'ADMIN' }).success, false);
  assert.equal(registerSchema.safeParse({ name: 'Test User', email: 'invalid', password: 'long-enough-password' }).success, false);
  assert.equal(registerSchema.safeParse({ name: 'Test User', email: 'test@example.com', password: 'é'.repeat(40) }).success, false);
});

test('reviews only accept integer ratings from one through five', () => {
  for (const rating of [0, 6, 2.5, 'invalid']) {
    assert.equal(reviewSchema.safeParse({ bookId: 'book-id', rating }).success, false);
  }
  assert.equal(reviewSchema.safeParse({ bookId: 'book-id', rating: '5', comment: 'Good' }).success, true);
});

test('book discounts cannot exceed the regular price', () => {
  const base = { title: 'A Book', author: 'An Author', price: 100, stock: 3, categoryId: 'category-id' };
  assert.equal(bookCreateSchema.safeParse({ ...base, discountPrice: 101 }).success, false);
  assert.equal(bookCreateSchema.safeParse({ ...base, discountPrice: 80 }).success, true);
});

test('promotions reject invalid percentages and inverted date ranges', () => {
  const base = {
    code: 'SAVE10', name: 'Save', discountType: 'PERCENTAGE', discountValue: 10,
    startsAt: '2026-10-01T00:00:00.000Z', endsAt: '2026-10-31T00:00:00.000Z',
  };
  assert.equal(promotionCreateSchema.safeParse({ ...base, discountValue: 101 }).success, false);
  assert.equal(promotionCreateSchema.safeParse({ ...base, endsAt: '2026-09-30T00:00:00.000Z' }).success, false);
  assert.equal(promotionCreateSchema.safeParse(base).success, true);
});

test('membership tiers accept dynamic level codes and validate editable fields', () => {
  const tier = { level: 'diamond_plus', name: 'Kim cương+', minPoints: '2500', description: 'Ưu đãi đặc biệt' };
  assert.deepEqual(membershipCreateSchema.parse(tier), { ...tier, level: 'DIAMOND_PLUS', minPoints: 2500 });
  assert.equal(membershipCreateSchema.safeParse({ ...tier, level: 'DIAMOND-PLUS' }).success, false);
  assert.equal(membershipCreateSchema.safeParse({ ...tier, minPoints: -1 }).success, false);
  assert.equal(membershipCreateSchema.safeParse({ ...tier, minPoints: '' }).success, false);
  assert.equal(membershipUpdateSchema.safeParse({ status: 'ACTIVE' }).success, true);
  assert.equal(membershipUpdateSchema.safeParse({}).success, false);
});

test('membership validation errors identify the invalid fields for the admin form', () => {
  let validationError;
  validate(membershipCreateSchema, 'body')({ body: { level: 'BAD-LEVEL', name: '', minPoints: -1 } }, {}, (error) => { validationError = error; });
  assert.equal(validationError.statusCode, 422);
  assert.match(validationError.message, /level:/);
  assert.match(validationError.message, /name:/);
});

test('order state transitions do not allow delivery before shipping or reopening cancelled orders', () => {
  assert.equal(ORDER_TRANSITIONS.PENDING.includes('DELIVERED'), false);
  assert.deepEqual(ORDER_TRANSITIONS.CANCELLED, []);
  assert.equal(ORDER_TRANSITIONS.SHIPPING.includes('DELIVERED'), true);
});

test('newsletter signup requires a valid email and rejects extra fields', () => {
  assert.equal(newsletterSubscribeSchema.safeParse({ email: 'reader@example.com' }).success, true);
  assert.equal(newsletterSubscribeSchema.safeParse({ email: 'invalid' }).success, false);
  assert.equal(newsletterSubscribeSchema.safeParse({ email: 'reader@example.com', role: 'ADMIN' }).success, false);
});
