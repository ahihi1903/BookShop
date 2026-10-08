import { customerRepository } from '../repositories/customer.repository.js';

export const categoryService = {
  async list() {
    const categories = await customerRepository.listCategories();
    return categories.map(({ _count, ...category }) => ({ ...category, bookCount: _count.books }));
  },
};
