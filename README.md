# BOOKSHOP

BookShop là ứng dụng thương mại điện tử sách gồm storefront cho khách hàng và khu vực quản trị. Tài liệu này mô tả những gì đang có trong source hiện tại; các chức năng chưa được nối với nhà cung cấp ngoài được ghi rõ.

## Công nghệ

- **Frontend:** React 18, Vite, JavaScript (ES Modules), React Router, Axios.
- **Backend:** Node.js, Express 5, JavaScript (ES Modules), Zod, Multer, Pino.
- **Database:** MySQL qua Prisma ORM.
- **Authentication:** JWT và bcrypt.

Không có Java, Spring Boot hoặc TypeScript trong ứng dụng.

## Tài liệu

- [Kiến trúc](docs/architecture.md)
- [Database và Prisma](docs/database.md)
- [REST API](docs/api.md)
- [Authentication và authorization](docs/authentication.md)
- [Business rules và các flow](docs/business-rules.md)
- [Cài đặt và chạy project](docs/setup.md)

## Cấu trúc repository

```text
backend/
  prisma/                 # schema, migration, seed
  src/
    config/ constants/ controllers/ middlewares/ models/
    repositories/ routes/ services/ utils/ validators/
    app.js server.js
  test/
frontend/
  src/
    assets/ components/ contexts/ hooks/ layouts/ pages/
    routes/ services/ styles/ utils/ constants/
    App.jsx main.jsx
docs/
```

## Chức năng hiện có

Catalog sách/danh mục; đăng ký, đăng nhập và hồ sơ; giỏ hàng; checkout tạo đơn; lịch sử/hủy đơn; đánh giá sau khi đơn giao; điểm/hạng thành viên; promotion; favorites; newsletter; API quản trị cho sách, danh mục, đơn hàng, khách hàng, đánh giá, khuyến mãi, membership, gift card và gift. Admin có dashboard và báo cáo.

Checkout tạo bản ghi `Payment` ở trạng thái `PENDING`. Source hiện chưa có payment gateway, webhook, thao tác thanh toán hoặc hoàn tiền, và không có `/api/payments` router. Gift card và gift hiện có API quản trị, chưa có API đổi/redeem ở phía khách hàng.

## Chạy project

Xem [docs/setup.md](docs/setup.md) để tạo MySQL database, cấu hình biến môi trường, migrate, seed và chạy frontend/backend. Không có root-level `package.json`; cài dependency riêng trong `backend/` và `frontend/`.

## Kiểm tra

- Backend tests: `cd backend && npm test`.
- Frontend production build: `cd frontend && npm run build`.
- Backend health endpoint: `GET /api/health`.
