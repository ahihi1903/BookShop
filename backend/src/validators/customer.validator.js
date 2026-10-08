import { z } from 'zod';

export const cartAddSchema = z.object({
  bookId: z.string().min(1),
  quantity: z.coerce.number().int().positive().default(1),
}).strict();

export const cartQuantitySchema = z.object({
  quantity: z.coerce.number().int().positive(),
}).strict();

export const checkoutSchema = z.object({
  shippingAddress: z.string().trim().min(8).max(500),
  paymentMethod: z.enum(['COD', 'BANK_TRANSFER', 'CARD', 'E_WALLET']),
  promotionCode: z.string().trim().min(1).max(40).optional(),
}).strict();

export const reviewSchema = z.object({
  bookId: z.string().min(1),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().max(5000).optional().transform((value) => value || undefined),
}).strict();

export const profileSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  phone: z.string().trim().min(7).max(30).nullable().optional(),
  address: z.string().trim().max(500).nullable().optional(),
}).strict().refine((value) => Object.keys(value).length > 0, 'At least one profile field is required');

export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1).max(72).refine((value) => Buffer.byteLength(value, 'utf8') <= 72, 'Password must be at most 72 UTF-8 bytes'),
  newPassword: z.string().min(8).max(72).refine((value) => Buffer.byteLength(value, 'utf8') <= 72, 'Password must be at most 72 UTF-8 bytes'),
}).strict();
