import { useCallback, useState } from 'react';
import { ArrowRight, Heart, ShoppingBag, Star } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import BookCard from '../components/BookCard.jsx';
import PageState from '../components/PageState.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useApi } from '../hooks/useApi.js';
import { bookService } from '../services/bookService.js';
import { cartService } from '../services/cartService.js';
import { reviewService } from '../services/reviewService.js';
import { asList, formatCurrency, formatDate, getErrorMessage } from '../utils/apiData.js';
import { getEffectiveBookPrice, resolveImageUrl } from '../utils/catalog.js';

export default function BookDetailPage() {
  const { idOrSlug } = useParams();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState('');
  const [tab, setTab] = useState('description');
  const [message, setMessage] = useState('');
  const loadBook = useCallback(() => bookService.get(idOrSlug), [idOrSlug]);
  const loadReviews = useCallback(() => reviewService.listPublic({ bookId: idOrSlug }), [idOrSlug]);
  const loadRelated = useCallback(() => bookService.related(idOrSlug), [idOrSlug]);
  const bookState = useApi(loadBook, [idOrSlug]);
  const reviewState = useApi(loadReviews, [idOrSlug]);
  const relatedState = useApi(loadRelated, [idOrSlug]);
  const book = bookState.data?.book ?? bookState.data;
  const images = book ? [book.image, ...(Array.isArray(book.images) ? book.images : [])].filter(Boolean).map(resolveImageUrl) : [];
  const heroImage = selectedImage || images[0];

  async function addToCart(andCheckout = false) {
    setMessage('');
    try {
      await cartService.addItem(book.id, quantity);
      if (andCheckout) navigate('/checkout');
      else setMessage('Đã thêm vào giỏ hàng.');
    } catch (error) { setMessage(getErrorMessage(error)); }
  }

  return <div className="shell page-shell"><PageState loading={bookState.loading} error={bookState.error} empty={!bookState.loading && !bookState.error && !book ? 'Không tìm thấy cuốn sách này.' : null}>
    {book && <>
      <div className="book-detail"><div className="detail-gallery"><div className="detail-cover">{heroImage ? <img src={heroImage} alt={book.title} /> : <div className="cover-placeholder"><span>BOOKSHOP</span><strong>{book.title?.slice(0, 1)}</strong></div>}{book.discountPrice && <span className="book-badge badge-sale">Ưu đãi</span>}</div>{images.length > 1 && <div className="gallery-thumbnails">{images.map((image) => <button key={image} className={heroImage === image ? 'selected' : ''} onClick={() => setSelectedImage(image)} aria-label="Chọn ảnh sách"><img src={image} alt="" /></button>)}</div>}</div>
        <div className="detail-copy"><p className="eyebrow">{book.category?.name || 'SÁCH BOOKSHOP'}</p><h1>{book.title}</h1><p className="detail-author">{book.author}</p><div className="detail-rating"><span className="review-stars"><Star size={15} fill="currentColor" /></span><strong>{book.rating ?? '—'}</strong><span>{book.reviewCount ?? asList(book.reviews).length} đánh giá</span></div><p className="detail-price">{formatCurrency(getEffectiveBookPrice(book))} {book.discountPrice && <del>{formatCurrency(book.price)}</del>}</p><p className={`stock-state ${book.stock > 0 ? 'in-stock' : 'out-of-stock'}`}><span />{book.stock > 0 ? `Còn ${book.stock} cuốn` : 'Tạm hết hàng'}</p><p className="detail-description">{book.description || 'Thông tin giới thiệu cho cuốn sách này chưa được cập nhật.'}</p><dl className="detail-meta"><div><dt>Tác giả</dt><dd>{book.author}</dd></div><div><dt>Danh mục</dt><dd>{book.category?.name || '—'}</dd></div><div><dt>Mã sách</dt><dd>{book.isbn || book.id}</dd></div></dl><div className="detail-buy-row"><div className="quantity-control"><button disabled={quantity <= 1} onClick={() => setQuantity((n) => Math.max(1, n - 1))} aria-label="Giảm số lượng">−</button><span>{quantity}</span><button disabled={quantity >= Number(book.stock || 1)} onClick={() => setQuantity((n) => Math.min(Number(book.stock || 1), n + 1))} aria-label="Tăng số lượng">+</button></div>{isAuthenticated ? <><button className="button button-outline" disabled={!book.stock} onClick={() => addToCart(false)}><ShoppingBag size={16} /> Thêm giỏ</button><button className="button button-primary" disabled={!book.stock} onClick={() => addToCart(true)}>Mua ngay <ArrowRight size={16} /></button></> : <Link className="button button-primary" to="/login">Đăng nhập để mua</Link>}</div>{message && <p className="form-feedback" role="status">{message}</p>}</div>
      </div>
      <section className="book-detail-lower"><div className="detail-tabs" role="tablist"><button className={tab === 'description' ? 'active' : ''} onClick={() => setTab('description')}>Mô tả</button><button className={tab === 'information' ? 'active' : ''} onClick={() => setTab('information')}>Thông tin sách</button><button className={tab === 'reviews' ? 'active' : ''} onClick={() => setTab('reviews')}>Đánh giá ({asList(reviewState.data).length})</button></div>
        {tab === 'description' && <div className="detail-tab-content"><h2>Về cuốn sách</h2><p>{book.description || 'Thông tin giới thiệu cho cuốn sách này chưa được cập nhật.'}</p></div>}
        {tab === 'information' && <div className="detail-tab-content detail-information"><h2>Thông tin sách</h2><p><span>Tác giả</span><strong>{book.author}</strong></p><p><span>Danh mục</span><strong>{book.category?.name || '—'}</strong></p><p><span>ISBN</span><strong>{book.isbn || '—'}</strong></p><p><span>Nhà xuất bản</span><strong>{book.publisher || '—'}</strong></p><p><span>Ngày xuất bản</span><strong>{formatDate(book.publishedAt)}</strong></p></div>}
        {tab === 'reviews' && <div className="detail-tab-content"><h2>Đánh giá từ bạn đọc</h2><PageState loading={reviewState.loading} error={reviewState.error} empty={!reviewState.loading && !reviewState.error && !asList(reviewState.data).length ? 'Cuốn sách chưa có đánh giá.' : null}><div className="home-review-grid">{asList(reviewState.data).map((review) => <article className="home-review-card" key={review.id}><div className="review-stars">{Array.from({ length: Number(review.rating) || 0 }, (_, index) => <Star key={index} size={14} fill="currentColor" />)}</div><p>{review.comment}</p><strong>{review.user?.name || 'Bạn đọc BookShop'}</strong><span>{formatDate(review.createdAt)}</span></article>)}</div></PageState><Link className="text-link" to="/reviews">Viết đánh giá <ArrowRight size={15} /></Link></div>}
      </section>
      <section className="related-books"><div className="section-heading"><div><p className="eyebrow">CÓ THỂ BẠN SẼ THÍCH</p><h2>Sách liên quan</h2></div></div><PageState loading={relatedState.loading} error={relatedState.error} empty={!relatedState.loading && !relatedState.error && !asList(relatedState.data).length ? 'Chưa có gợi ý liên quan.' : null}>{asList(relatedState.data).length > 0 && <div className="book-grid">{asList(relatedState.data).map((relatedBook) => <BookCard key={relatedBook.id} book={relatedBook} />)}</div>}</PageState></section>
    </>}
  </PageState></div>;
}

