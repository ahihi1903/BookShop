import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const prisma = new PrismaClient();
const manifest = JSON.parse(await readFile(new URL('./catalog-expansion.json', import.meta.url), 'utf8'));
const apply = process.argv.includes('--apply');
const groupCounts = (books) => books.reduce((counts, book) => ({ ...counts, [book.categorySlug]: (counts[book.categorySlug] || 0) + 1 }), {});

try {
  if (manifest.books.length !== 65 || Object.values(groupCounts(manifest.books)).some((count) => count !== 13)) throw new Error('Expected exactly 13 books in each of 5 categories.');
  for (const book of manifest.books) {
    const isbn = book.isbn.replace(/-/g, '');
    if (!/^\d{13}$/.test(isbn) || [...isbn].reduce((sum, digit, index) => sum + Number(digit) * (index % 2 ? 3 : 1), 0) % 10) throw new Error(`Invalid ISBN: ${book.title}`);
    if (!book.author || !book.description || book.title.length > 255 || book.stock !== 12 || !Number.isSafeInteger(book.price) || book.price <= 0) throw new Error(`Invalid book: ${book.title}`);
    const bytes = await readFile(new URL(`..${book.image}`, import.meta.url));
    const source = manifest.sources.find((item) => item.isbn === book.isbn);
    if (!source || createHash('sha256').update(bytes).digest('hex') !== source.imageSha256) throw new Error(`Invalid image: ${book.title}`);
  }
  if (new Set(manifest.books.map((book) => book.slug)).size !== 65 || new Set(manifest.books.map((book) => book.isbn)).size !== 65) throw new Error('Duplicate manifest entries.');

  const result = await prisma.$transaction(async (tx) => {
    const categories = await tx.category.findMany();
    const before = await tx.book.findMany();
    const ids = new Map(categories.filter((category) => category.status === 'ACTIVE').map((category) => [category.slug, category.id]));
    const pending = [];
    for (const book of manifest.books) {
      if (!ids.has(book.categorySlug)) throw new Error(`Missing active category: ${book.categorySlug}`);
      const existing = before.find((item) => item.slug === book.slug || item.isbn?.replace(/-/g, '') === book.isbn.replace(/-/g, ''));
      if (existing) {
        if (existing.slug !== book.slug || existing.isbn !== book.isbn || existing.categoryId !== ids.get(book.categorySlug)) throw new Error(`Conflicting book: ${book.title}`);
      } else pending.push(book);
    }
    if (!apply) return { mode: 'preview', existingBooks: before.length, toAdd: pending.length, byCategory: groupCounts(pending) };
    const backupDirectory = new URL('../.local-backups/', import.meta.url);
    await mkdir(backupDirectory, { recursive: true });
    const stamp = Date.now();
    const backup = new URL(`catalog-before-expansion-${stamp}.json`, backupDirectory);
    await writeFile(backup, JSON.stringify({ createdAt: new Date().toISOString(), books: before, categories }, null, 2), { flag: 'wx' });
    const created = [];
    for (const { categorySlug, ...book } of pending) {
      const item = await tx.book.create({ data: { ...book, categoryId: ids.get(categorySlug) } });
      created.push({ id: item.id, title: item.title, isbn: item.isbn, categorySlug });
    }
    return { mode: 'applied', added: created.length, totalBooks: await tx.book.count(), byCategory: groupCounts(pending), backup: backup.pathname, created };
  }, { isolationLevel: 'Serializable', timeout: 60000 });
  if (apply) await writeFile(new URL('./catalog-expansion-result.json', import.meta.url), JSON.stringify(result, null, 2));
  const { created, ...summary } = result;
  console.log(JSON.stringify(summary, null, 2));
} finally { await prisma.$disconnect(); }
