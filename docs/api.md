# REST API

Base path: `/api`. All endpoints consume/return JSON except book image upload, which uses `multipart/form-data`. Success envelope:

```json
{ "success": true, "message": "...", "data": {} }
```

Errors use `{ "success": false, "message": "...", "data": null }`. Protected routes expect `Authorization: Bearer <JWT>`. `ADMIN` means a valid token with current role `ADMIN`; owner-scoped endpoints only return data belonging to the authenticated user.

## Health and authentication

| Method | Path | Access | Notes |
| --- | --- | --- | --- |
| GET | `/health` | Public | Returns API status. |
| POST | `/auth/register` | Public | Creates customer and cart; returns user and JWT. |
| POST | `/auth/login` | Public | Verifies credentials; returns user and JWT. |
| GET | `/auth/me` | Authenticated | Returns current public user. |

## Storefront and customer APIs

| Method | Path | Access | Notes |
| --- | --- | --- | --- |
| GET | `/books` | Public | Query: `q`/`search`, `categoryId`, `minPrice`, `maxPrice`, `rating`, `sort`, `featured`, `page`, `limit`. Sort supports `price_asc`, `price_desc`, `title_asc`, `best_selling`; default newest. Returns paged `items`, `total`, `page`, `limit`, `totalPages`. |
| GET | `/books/:idOrSlug` | Public | Book detail by ID or slug. |
| GET | `/books/:idOrSlug/related` | Public | Related active books, same category, up to eight. |
| GET | `/categories` | Public | Active categories. |
| GET | `/users/me` | Authenticated | Current profile. |
| PATCH | `/users/me` | Authenticated | Update provided name/phone/address fields. |
| PATCH | `/users/me/password` | Authenticated | Change password after checking current password. |
| PUT | `/users/me/favorites/:bookId` | Authenticated | Toggle favorite for the current user. |
| GET | `/cart` | Authenticated | Get/create current user's cart. |
| POST | `/cart/items` | Authenticated | Body: `bookId`, optional positive integer `quantity` (default 1). |
| PATCH | `/cart/items/:itemId` | Authenticated | Body: positive integer `quantity`. |
| DELETE | `/cart/items/:itemId` | Authenticated | Remove owned cart item. |
| DELETE | `/cart` | Authenticated | Clear current cart. |
| GET | `/orders` | Authenticated | Own orders; query `page`, `limit`. |
| POST | `/orders` | Authenticated | Checkout with `shippingAddress`, `paymentMethod`, optional `promotionCode`; server calculates all prices. |
| GET | `/orders/:orderId` | Authenticated, owner | Get own order. |
| POST | `/orders/:orderId/cancel` | Authenticated, owner | Cancel only eligible unpaid orders. |
| GET | `/reviews` | Public | Active reviews; optional `bookId`, `page`, `limit`. |
| GET | `/reviews/mine` | Authenticated | Current user's active reviews; query `page`, `limit`. |
| POST | `/reviews` | Authenticated | Body: `bookId`, `rating` (1–5), optional `comment`; delivered purchase required. Creates or updates the user's review for that book. |
| GET | `/membership/tiers` | Public | Active tiers in threshold order. |
| GET | `/membership/me` | Authenticated | Current points, level and progress to next active tier. |
| GET | `/promotions/active` | Public | Active and currently in-date promotions. |
| POST | `/promotions/validate` | Authenticated | Body: `code`; validates against current cart subtotal. |
| POST | `/newsletter/subscribe` | Public | Subscribe an email address. |

## Admin APIs

Every `/admin` path requires authentication and `ADMIN` role.

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/admin/dashboard` | Dashboard metrics, low-stock list and best sellers. |
| GET, POST | `/admin/books` | Search/list or create books. |
| GET, PATCH, DELETE | `/admin/books/:id` | Read, update or deactivate a book. |
| POST, DELETE | `/admin/books/:id/image` | Upload one `image` file or remove the book image. Upload accepts JPG/JPEG/PNG/WEBP up to 5 MB. |
| GET, POST | `/admin/categories` | List/create categories. |
| GET, PATCH, DELETE | `/admin/categories/:id` | Read, update or deactivate a category. |
| GET | `/admin/orders` | Search/list orders. |
| GET | `/admin/orders/:id` | Order detail. |
| PATCH | `/admin/orders/:id/status` | Body: `orderStatus`; validates allowed transition and payment constraints. |
| GET | `/admin/customers` | Search/list customers. |
| GET | `/admin/customers/:id` | Customer details. |
| PATCH | `/admin/customers/:id/lock` | Set customer inactive. |
| PATCH | `/admin/customers/:id/unlock` | Set customer active. |
| GET | `/admin/reviews` | Search/list reviews, including hidden ones. |
| PATCH | `/admin/reviews/:id/approve` | Set review active. |
| PATCH | `/admin/reviews/:id/hide` | Set review inactive. |
| DELETE | `/admin/reviews/:id` | Delete review. |
| GET, POST | `/admin/promotions` | List/create promotions. |
| PATCH, DELETE | `/admin/promotions/:id` | Update/delete promotion. |
| PATCH | `/admin/promotions/:id/activate` | Activate promotion. |
| PATCH | `/admin/promotions/:id/deactivate` | Deactivate promotion. |
| GET, POST | `/admin/membership` | List/create membership tiers. |
| PATCH, DELETE | `/admin/membership/:id` | Update/deactivate membership tier. |
| GET | `/admin/reports` | Paid revenue/orders grouped by month for recent months. |
| GET, POST | `/admin/gift-cards` | List/create gift cards. |
| PATCH, DELETE | `/admin/gift-cards/:id` | Update/deactivate gift card. |
| GET, POST | `/admin/gifts` | List/create gifts. |
| PATCH, DELETE | `/admin/gifts/:id` | Update/deactivate gift. |

Admin list endpoints support some combination of `q`, `status`, page/limit and feature-specific filters. Default page size is 20 and maximum is 100 in `admin.service.js`; see the service for the filters supported by each resource.

## Validation, status codes and limits

Zod schemas validate route bodies; many schemas reject unknown fields. Invalid inputs return 422. Common statuses: 400 malformed JSON/upload, 401 missing/invalid/expired JWT or invalid credentials, 403 role/account restriction, 404 route/resource not found, 409 uniqueness/state/stock conflict, 413 image over 5 MB, 422 validation/business-rule failure, 429 rate limit, 500 unexpected error. Auth routes are limited to 10 requests per IP per 15 minutes; image uploads to 30 per IP per 15 minutes. The configured limiter is in-memory.

There is no payment router or `/payments` endpoint in the current source.
