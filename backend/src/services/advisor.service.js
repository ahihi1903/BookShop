import { customerRepository } from '../repositories/customer.repository.js';
import { advisorRepository } from '../repositories/advisor.repository.js';
import { parseAdvisorQuery } from '../utils/advisorQuery.js';
import { resolveAdvisorReference } from '../utils/advisorReference.js';

const money = (value) => new Intl.NumberFormat('vi-VN').format(value) + 'đ';
export const advisorService = {
  async reply(messages) {
    const categories = await customerRepository.listCategories();
    const catalog = await advisorRepository.lookupCatalog();
    const lookup = resolveAdvisorReference(messages.at(-1), catalog, categories);
    if (lookup.isLookup) {
      const book = lookup.bookId ? await advisorRepository.findBook(lookup.bookId) : null;
      if (book) return { message: book.stock > 0 ? 'Đây là cuốn sách bạn đang tìm.' : 'Đã tìm thấy đúng sách, nhưng hiện sách đang tạm hết hàng.', criteria: book.isbn ? `ISBN: ${book.isbn}` : `Mã sách: ${book.id}`, books: [book], alternative: false };
      const books = await advisorRepository.bestSellers();
      return { message: books.length ? 'Không tìm thấy sách với tên hoặc mã bạn gửi. Bạn có thể tham khảo các cuốn đang bán chạy dưới đây.' : 'Không tìm thấy sách với tên hoặc mã bạn gửi. Hiện chưa có sách bán chạy còn hàng để gợi ý; bạn có thể khám phá danh mục sách.', criteria: `Tìm sách: ${lookup.reference}`, books, alternative: true, alternativeLabel: 'Sách bán chạy hiện tại' };
    }
    // Book identifiers and years in titles must not become budgets in follow-up messages.
    const filterMessages = messages.filter((message) => !resolveAdvisorReference(message, catalog, categories).isLookup);
    const parsed = parseAdvisorQuery(filterMessages, categories);
    const { category, minPrice, maxPrice, approximate, unknownCategory } = parsed;
    const choices = categories.map(({ name }) => name);
    if ([minPrice, maxPrice].some((value) => value !== undefined && (!Number.isSafeInteger(value) || value < 0 || value > 10000000000))) return { message: 'Ngân sách chưa hợp lệ. Bạn hãy nhập giá bằng VNĐ, ví dụ 800.000đ hoặc 800k.', books: [] };
    if (unknownCategory) return { message: `Tôi chưa xác định được thể loại bạn muốn tìm. Bạn có thể chọn một danh mục đang có: ${choices.join(', ') || 'chưa có danh mục'}.`, books: [], categories: choices };
    if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) return { message: 'Giá thấp nhất đang lớn hơn giá cao nhất. Bạn hãy nhập lại, ví dụ: từ 500.000 đến 900.000đ.', books: [] };
    if (!category && minPrice === undefined && maxPrice === undefined) return { message: 'Bạn muốn đọc thể loại nào và ngân sách bao nhiêu? Ví dụ: “Sách thời trang tầm 800.000đ”. Tôi hỗ trợ tìm theo thể loại và giá; chưa tư vấn chuyên sâu về nội dung sách.', books: [], categories: choices };
    const budget = minPrice !== undefined && maxPrice !== undefined ? `${money(minPrice)}–${money(maxPrice)}` : minPrice !== undefined ? `từ ${money(minPrice)}` : maxPrice !== undefined ? `không quá ${money(maxPrice)}` : 'không giới hạn giá';
    const criteria = `${category?.name || 'Tất cả thể loại'} · ${budget}${approximate ? ' (khoảng ±20%)' : ''}`;
    const target = minPrice !== undefined && maxPrice !== undefined ? (minPrice + maxPrice) / 2 : maxPrice ?? minPrice;
    let books = await advisorRepository.recommend({ categoryId: category?.id, minPrice, maxPrice, target });
    if (books.length) return { message: 'Bạn có thể tham khảo những cuốn đang còn hàng và phù hợp với điều kiện dưới đây.', criteria, books, alternative: false };
    // Relax price first; never present these results as matching the original request.
    books = await advisorRepository.recommend({ categoryId: category?.id, target });
    let reason = 'Những cuốn cùng thể loại dưới đây có giá ngoài khoảng bạn yêu cầu.';
    if (!books.length && category) {
      books = await advisorRepository.recommend({ minPrice, maxPrice, target });
      reason = 'Bạn có thể tham khảo sách thuộc thể loại khác, trong ngân sách đã chọn.';
    }
    return { message: books.length ? `Chưa có sách đáp ứng đầy đủ điều kiện. ${reason}` : 'Hiện chưa có sách còn hàng phù hợp. Bạn có thể thử thể loại khác hoặc thay đổi ngân sách.', criteria, books, alternative: true, categories: choices };
  },
};
