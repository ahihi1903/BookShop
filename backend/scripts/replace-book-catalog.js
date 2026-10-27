import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { readFile, writeFile, mkdir, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

// One-time replacement authorized by the owner. Refuses a different catalogue.
const expectedIds = ['cmuzni42e000hvo7w1eiou2ji', 'cmuzni42e000ivo7wfwmv7cet', 'cmuzni42e000gvo7wrm8ggflz', 'cmvj2t3ha001mvo3coftonktc', 'cmvmjo0600005vo7cxf0gdu2a'];
const manifest = JSON.parse(await readFile(new URL('./catalog-taschen.json', import.meta.url), 'utf8'));
const prisma = new PrismaClient();
try {
  for (const book of manifest.books) await access(new URL(`..${book.image}`, import.meta.url));
  if (!process.argv.includes('--apply')) {
    console.log('Prepared replacement:', manifest.books.length, 'books;', manifest.categories.length, 'categories. Use --apply only with owner authorization.');
  } else {
    const directory = new URL('../.local-backups/', import.meta.url);
    await mkdir(directory, { recursive: true });
    const backupFile = new URL(`catalog-before-replacement-${Date.now()}.json`, directory);
    const result = await prisma.$transaction(async (tx) => {
      const books = await tx.book.findMany();
      if (books.length !== expectedIds.length || books.some((book) => !expectedIds.includes(book.id))) throw new Error('Catalogue changed: replacement stopped.');
      const orders = await tx.order.findMany({ where: { items: { some: { bookId: { in: expectedIds } } } } });
      const orderIds = orders.map((order) => order.id);
      const orderFilter = { orderId: { in: orderIds } };
      const bookFilter = { bookId: { in: expectedIds } };
      const backup = {
        createdAt: new Date().toISOString(), books, categories: await tx.category.findMany(), orders,
        orderItems: await tx.orderItem.findMany({ where: orderFilter }),
        payments: await tx.payment.findMany({ where: orderFilter }),
        reviews: await tx.review.findMany({ where: bookFilter }),
        cartItems: await tx.cartItem.findMany({ where: bookFilter }),
        favorites: await tx.favorite.findMany({ where: bookFilter }),
      };
      // A failed backup prevents any deletion. Contains no passwords or JWTs.
      await writeFile(backupFile, JSON.stringify(backup, null, 2), { flag: 'wx' });
      await tx.payment.deleteMany({ where: orderFilter });
      await tx.orderItem.deleteMany({ where: orderFilter });
      await tx.order.deleteMany({ where: { id: { in: orderIds } } });
      await tx.review.deleteMany({ where: bookFilter });
      await tx.cartItem.deleteMany({ where: bookFilter });
      await tx.favorite.deleteMany({ where: bookFilter });
      await tx.book.deleteMany({ where: { id: { in: expectedIds } } });
      await tx.category.deleteMany({ where: { id: { in: backup.categories.map((category) => category.id) } } });
      const categoryIds = new Map();
      for (const category of manifest.categories) {
        const created = await tx.category.create({ data: category });
        categoryIds.set(category.slug, created.id);
      }
      for (const { categorySlug, source, ...book } of manifest.books) {
        await tx.book.create({ data: { ...book, categoryId: categoryIds.get(categorySlug) } });
      }
      return { removedBooks: books.length, removedCategories: backup.categories.length, removedOrders: orders.length, removedOrderItems: backup.orderItems.length, removedPayments: backup.payments.length, removedReviews: backup.reviews.length, createdBooks: manifest.books.length, createdCategories: categoryIds.size };
    }, { isolationLevel: 'Serializable', timeout: 30000 });
    console.log(JSON.stringify({ ...result, backup: fileURLToPath(backupFile) }, null, 2));
  }
} finally { await prisma.$disconnect(); }
