import bcrypt from 'bcrypt';
import { customerRepository } from '../repositories/customer.repository.js';
import { AppError } from '../utils/AppError.js';

export const profileService = {
  async get(userId) {
    const user = await customerRepository.findPublicUser(userId);
    if (!user) throw new AppError('User account was not found', 404, 'USER_NOT_FOUND');
    return user;
  },

  async update(userId, payload) {
    return customerRepository.updateUser(userId, payload);
  },

  async changePassword(userId, { currentPassword, newPassword }) {
    const user = await customerRepository.findUser(userId);
    if (!user) throw new AppError('User account was not found', 404, 'USER_NOT_FOUND');
    const matches = await bcrypt.compare(currentPassword, user.password);
    if (!matches) throw new AppError('Current password is incorrect', 401, 'INVALID_CURRENT_PASSWORD');
    const password = await bcrypt.hash(newPassword, 12);
    await customerRepository.updateUser(userId, { password });
    return { changed: true };
  },
};
