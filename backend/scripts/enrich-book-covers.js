// Only fills missing covers for titles/authors verified against these references.
// Does not infer edition, ISBN, price or publisher from a cover image.
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { writeFile, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const references = [
  { title: 'Nhà Giả Kim', author: 'Paulo Coelho', image: '/uploads/books/nha-gia-kim-reference.webp', source: 'https://www.fahasa.com/nha-gia-kim-tai-ban-2020.html' },
  { title: 'Clean Code', author: 'Robert C. Martin', image: '/uploads/books/clean-code-reference.jpg', source: 'https://www.informit.com/store/clean-code-a-handbook-of-agile-software-craftsmanship-9780132350884' },
  { title: 'Đừng Lựa Chọn An Nhàn Khi Còn Trẻ', author: 'Cảnh Thiên', image: '/uploads/books/dung-lua-chon-an-nhan-reference.jpg', source: 'https://www.fahasa.com/dung-lua-chon-an-nhan-khi-con-tre.html' },
];
const prisma = new PrismaClient();
try {
  for (const reference of references) await access(fileURLToPath(new URL(`..${reference.image}`, import.meta.url)));
  const records = await prisma.book.findMany({ where: { OR: references.map(({ title, author }) => ({ title, author })), image: null }, select: { id: true, title: true, author: true, image: true } });
  const backup = new URL(`../uploads/book-covers-backup-${Date.now()}.json`, import.meta.url);
  await writeFile(backup, JSON.stringify({ records, references }, null, 2), { flag: 'wx' });
  const results = await prisma.$transaction(records.map((record) => {
    const reference = references.find((item) => item.title === record.title && item.author === record.author);
    if (!reference) throw new Error(`Unmatched book: ${record.id}`);
    return prisma.book.updateMany({ where: { id: record.id, image: null }, data: { image: reference.image } });
  }));
  console.log(JSON.stringify({ updated: results.reduce((sum, result) => sum + result.count, 0), backup: fileURLToPath(backup) }));
} finally { await prisma.$disconnect(); }
