import 'dotenv/config';
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const seedPassword = process.env.BOOKSHOP_SEED_PASSWORD;
  if (!seedPassword || seedPassword.length < 12) {
    throw new Error('Set BOOKSHOP_SEED_PASSWORD to a value of at least 12 characters before seeding.');
  }

  const password = await bcrypt.hash(seedPassword, 12);

  const [fiction, skills, technology] = await Promise.all([
    prisma.category.upsert({
      where: { slug: 'van-hoc' }, update: {},
      create: { name: 'Văn học', slug: 'van-hoc', description: 'Tiểu thuyết và tác phẩm văn học' },
    }),
    prisma.category.upsert({
      where: { slug: 'ky-nang' }, update: {},
      create: { name: 'Kỹ năng sống', slug: 'ky-nang', description: 'Sách kỹ năng và phát triển bản thân' },
    }),
    prisma.category.upsert({
      where: { slug: 'cong-nghe' }, update: {},
      create: { name: 'Công nghệ', slug: 'cong-nghe', description: 'Sách công nghệ và lập trình' },
    }),
  ]);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@bookshop.local' },
    update: { name: 'BookShop Admin', password, role: 'ADMIN', status: 'ACTIVE' },
    create: {
      name: 'BookShop Admin', email: 'admin@bookshop.local', password,
      role: 'ADMIN', status: 'ACTIVE', cart: { create: {} },
    },
  });

  const [customer, secondCustomer] = await Promise.all([
    prisma.user.upsert({
      where: { email: 'lan.nguyen@bookshop.local' },
      update: { name: 'Nguyễn Hoàng Lan', password, role: 'CUSTOMER' },
      create: {
        name: 'Nguyễn Hoàng Lan', email: 'lan.nguyen@bookshop.local', password,
        phone: '0900000001', address: 'Quận 1, TP. Hồ Chí Minh', points: 180,
        membershipLevel: 'SILVER', cart: { create: {} },
      },
    }),
    prisma.user.upsert({
      where: { email: 'minh.tran@bookshop.local' },
      update: { name: 'Trần Quốc Minh', password, role: 'CUSTOMER' },
      create: {
        name: 'Trần Quốc Minh', email: 'minh.tran@bookshop.local', password,
        phone: '0900000002', address: 'Quận Bình Thạnh, TP. Hồ Chí Minh',
        cart: { create: {} },
      },
    }),
  ]);

  for (const [level, name, minPoints] of [
    ['BRONZE', 'Đồng', 0], ['SILVER', 'Bạc', 100], ['GOLD', 'Vàng', 500], ['PLATINUM', 'Bạch kim', 1500],
  ]) {
    await prisma.membership.upsert({
      where: { level }, update: { name, minPoints },
      create: { level, name, minPoints },
    });
  }

  const books = await Promise.all([
    prisma.book.upsert({
      where: { slug: 'nha-gia-kim' }, update: {},
      create: {
        title: 'Nhà Giả Kim', slug: 'nha-gia-kim', author: 'Paulo Coelho',
        description: 'Câu chuyện về hành trình theo đuổi ước mơ.', price: '79000',
        discountPrice: '69000', stock: 25, categoryId: fiction.id,
      },
    }),
    prisma.book.upsert({
      where: { slug: 'dung-lua-chon-an-nhan-khi-con-tre' }, update: {},
      create: {
        title: 'Đừng Lựa Chọn An Nhàn Khi Còn Trẻ', slug: 'dung-lua-chon-an-nhan-khi-con-tre',
        author: 'Cảnh Thiên', description: 'Sách kỹ năng và phát triển bản thân.',
        price: '89000', stock: 18, categoryId: skills.id,
      },
    }),
    prisma.book.upsert({
      where: { slug: 'clean-code' }, update: {},
      create: {
        title: 'Clean Code', slug: 'clean-code', author: 'Robert C. Martin',
        description: 'A handbook of agile software craftsmanship.',
        price: '320000', discountPrice: '299000', stock: 12, categoryId: technology.id,
      },
    }),
  ]);

  const [alchemist, cleanCode] = books;
  const deliveredOrder = await prisma.order.upsert({
    where: { orderNumber: 'BS-SEED-0001' }, update: {},
    create: {
      orderNumber: 'BS-SEED-0001', userId: customer.id,
      subtotal: '368000', discount: '0', shippingFee: '0', total: '368000',
      shippingAddress: customer.address, paymentMethod: 'COD', paymentStatus: 'PAID',
      orderStatus: 'DELIVERED',
      items: { create: [
        { bookId: alchemist.id, title: alchemist.title, quantity: 1, unitPrice: '69000', subtotal: '69000' },
        { bookId: cleanCode.id, title: cleanCode.title, quantity: 1, unitPrice: '299000', subtotal: '299000' },
      ] },
    },
  });

  await prisma.order.upsert({
    where: { orderNumber: 'BS-SEED-0002' }, update: {},
    create: {
      orderNumber: 'BS-SEED-0002', userId: secondCustomer.id,
      subtotal: '79000', discount: '0', shippingFee: '25000', total: '104000',
      shippingAddress: secondCustomer.address, paymentMethod: 'BANK_TRANSFER',
      paymentStatus: 'PENDING', orderStatus: 'PENDING',
      items: { create: [{
        bookId: alchemist.id, title: alchemist.title, quantity: 1,
        unitPrice: '79000', subtotal: '79000',
      }] },
    },
  });

  await prisma.review.upsert({
    where: { userId_bookId: { userId: customer.id, bookId: alchemist.id } },
    update: {},
    create: {
      userId: customer.id, bookId: alchemist.id, rating: 5,
      comment: 'Một câu chuyện truyền cảm hứng, đáng đọc.',
    },
  });

  await prisma.review.upsert({
    where: { userId_bookId: { userId: customer.id, bookId: cleanCode.id } },
    update: {},
    create: {
      userId: customer.id, bookId: cleanCode.id, rating: 4,
      comment: 'Nội dung hữu ích cho người làm phần mềm.',
    },
  });

  console.info(`Seed completed (admin: ${admin.email}; customers: ${customer.email}, ${secondCustomer.email})`);
}

main()
  .catch((error) => {
    console.error('BookShop seed failed', error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
