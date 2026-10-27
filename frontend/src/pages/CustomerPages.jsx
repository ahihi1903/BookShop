import StatusBadge from '../components/StatusBadge.jsx';
import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowRight, Check, ChevronRight, PackageSearch, ShoppingBag, Star, BookOpen, Gift, Mail, ArrowUpRight } from 'lucide-react';
import BookCard from '../components/BookCard.jsx';
import DiscoveryHero from '../components/DiscoveryHero.jsx';
import PageState from '../components/PageState.jsx';
import BookSkeleton from '../components/BookSkeleton.jsx';
import SearchBar from '../components/SearchBar.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useApi } from '../hooks/useApi.js';
import { authService } from '../services/authService.js';
import { bookService } from '../services/bookService.js';
import { cartService } from '../services/cartService.js';
import { categoryService } from '../services/categoryService.js';
import { membershipService } from '../services/membershipService.js';
import { newsletterService } from '../services/newsletterService.js';
import { orderService } from '../services/orderService.js';
import { promotionService } from '../services/promotionService.js';
import { reviewService } from '../services/reviewService.js';
import { asList, formatCurrency, formatDate, getErrorMessage, unwrapData } from '../utils/apiData.js';

function ScreenTitle({ kicker, title, description, action }) {
  return <div className="screen-title"><div><p className="eyebrow">{kicker}</p><h1>{title}</h1>{description && <p className="screen-description">{description}</p>}</div>{action}</div>;
}

function BookGrid({ books }) {
  return <div className="book-grid">{books.map((book) => <BookCard key={book.id} book={book} />)}</div>;
}

function AuthCard({ register = false }) {
  const { login, register: createAccount } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const destination = location.state?.from?.pathname || '/';
  const update = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }));

  async function submit(event) {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (register) {
        const result = await createAccount(form);
        if (result?.token && result?.user) navigate('/', { replace: true });
        else navigate('/login', { replace: true, state: { registered: true } });
      } else {
        await login({ email: form.email, password: form.password });
        navigate(destination, { replace: true });
      }
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Không thể xác thực tài khoản.'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-wrap"><div className="auth-aside"><p className="eyebrow">MỘT TRANG MỚI ĐANG CHỜ</p><h2>Đôi khi, chỉ cần mở đúng một cuốn sách.</h2><p>Khám phá những câu chuyện, ý tưởng và góc nhìn mới tại BookShop.</p><span className="auth-aside-mark">B.</span></div>
      <section className="auth-card"><p className="eyebrow">{register ? 'BẮT ĐẦU HÀNH TRÌNH' : 'CHÀO MỪNG TRỞ LẠI'}</p><h1>{register ? 'Tạo tài khoản' : 'Đăng nhập'}</h1><p className="muted">{register ? 'Lưu sách yêu thích và theo dõi đơn hàng của bạn.' : 'Đăng nhập để tiếp tục khám phá BookShop.'}</p>
        {location.state?.registered && <div className="inline-success"><Check size={16} /> Tạo tài khoản thành công. Mời bạn đăng nhập.</div>}
        {error && <div className="inline-error" role="alert">{error}</div>}
        <form className="form-stack" onSubmit={submit}>
          {register && <label>Họ và tên<input required minLength="2" maxLength="120" value={form.name} onChange={update('name')} autoComplete="name" /></label>}
          <label>Email<input required type="email" value={form.email} onChange={update('email')} autoComplete="email" /></label>
          <label>Mật khẩu<input required minLength={register ? 8 : 1} type="password" value={form.password} onChange={update('password')} autoComplete={register ? 'new-password' : 'current-password'} /></label>
          <button className="button button-primary button-wide" disabled={busy}>{busy ? 'Đang xử lý…' : register ? 'Tạo tài khoản' : 'Đăng nhập'} <ArrowRight size={17} /></button>
        </form>
        <p className="auth-switch">{register ? 'Đã có tài khoản?' : 'Bạn chưa có tài khoản?'} <Link to={register ? '/login' : '/register'}>{register ? 'Đăng nhập' : 'Tạo tài khoản'}</Link></p>
      </section>
    </div>
  );
}

export function Home() {
  const loadFeatured = useCallback(() => bookService.list({ limit: 4, featured: true }), []);
  const loadArrivals = useCallback(() => bookService.list({ limit: 4, sort: 'newest' }), []);
  const loadCategories = useCallback(() => categoryService.list(), []);
  const loadReviews = useCallback(() => reviewService.listPublic({ featured: true, limit: 3 }), []);
  const loadPromotions = useCallback(() => promotionService.active(), []);
  const featured = useApi(loadFeatured);
  const bestSellers = featured;
  useEffect(() => {
    let refreshing = false;
    const refresh = async () => {
      if (document.hidden || refreshing) return;
      refreshing = true;
      try { await featured.reload({ background: true }); }
      finally { refreshing = false; }
    };
    const interval = window.setInterval(refresh, 30000);
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, [featured.reload]);
  const arrivals = useApi(loadArrivals);
  const categories = useApi(loadCategories);
  const reviews = useApi(loadReviews);
  const promotions = useApi(loadPromotions);
  const promotion = asList(promotions.data)[0];
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterMessage, setNewsletterMessage] = useState('');
  const [newsletterBusy, setNewsletterBusy] = useState(false);
  async function subscribe(event) {
    event.preventDefault(); setNewsletterBusy(true); setNewsletterMessage('');
    try { await newsletterService.subscribe(newsletterEmail); setNewsletterMessage('Bạn đã đăng ký nhận tin thành công.'); setNewsletterEmail(''); }
    catch (error) { setNewsletterMessage(getErrorMessage(error)); }
    finally { setNewsletterBusy(false); }
  }
  return <>
    <DiscoveryHero state={featured} />
    <BookShelf kicker="BIÊN TẬP VIÊN GỢI Ý" title="Nổi bật & Đáng đọc" state={featured} empty="Chưa có sách nổi bật." />
    <BookShelf kicker="ĐƯỢC ĐỌC NHIỀU" title="Sách bán chạy" state={bestSellers} empty="Chưa có dữ liệu bán chạy." />
    <BookShelf kicker="VỪA LÊN KỆ" title="Sách mới về" state={arrivals} empty="Chưa có sách mới." />
    <section className="shell section-block editorial-categories"><div className="section-heading"><div><p className="eyebrow">KHÁM PHÁ DANH MỤC</p><h2>Bạn muốn đọc gì hôm nay?</h2></div><Link className="text-link" to="/books">Xem tất cả <ArrowRight size={16} /></Link></div>
      <PageState loading={categories.loading} error={categories.error} empty={!categories.loading && !categories.error && !asList(categories.data).length ? 'Chưa có danh mục sách.' : null}>
        <div className="category-pills">{asList(categories.data).map((item, index) => <Link key={item.id} to={`/books?category=${encodeURIComponent(item.id)}`} className={`category-tile category-tile-${index % 4}`}><span className="category-tile-icon"><BookOpen size={20} /></span><strong>{item.name}</strong><ArrowUpRight size={17} /></Link>)}</div>
      </PageState>
    </section>
    <section className="shell section-block promotion-section"><div className="section-heading"><div><p className="eyebrow">DÀNH CHO BẠN</p><h2>Ưu đãi từ BookShop</h2></div><Link className="text-link" to="/books">Xem sách <ArrowRight size={16} /></Link></div><PageState loading={promotions.loading} error={promotions.error} empty={!promotions.loading && !promotions.error && !promotion ? <span><strong>Hiện chưa có ưu đãi.</strong><span>Bạn vẫn có thể khám phá những đầu sách đang có tại BookShop.</span></span> : null}>{promotion && <article className="promotion-card"><div><span className="promotion-tag">{promotion.code}</span><h3>{promotion.name}</h3><p>{promotion.description}</p><small>Áp dụng đến {formatDate(promotion.endsAt)}</small></div><strong>{promotion.discountType === 'PERCENTAGE' ? `${promotion.discountValue}%` : formatCurrency(promotion.discountValue)}</strong></article>}</PageState></section>
    <section className="membership-banner shell"><div className="membership-intro"><span className="membership-symbol" aria-hidden="true"><Gift size={28} /></span><div><p className="eyebrow">ĐỌC NHIỀU, NHẬN NHIỀU HƠN</p><h2>Đọc thêm. Nhận thêm quyền lợi.</h2><p>Tích lũy điểm qua mỗi đơn hàng và khám phá quyền lợi dành cho thành viên.</p></div></div><Link className="button button-light" to="/membership">Khám phá thành viên <ArrowRight size={17} /></Link></section>
    <section className="shell section-block home-reviews"><div className="section-heading"><div><p className="eyebrow">LỜI TỪ BẠN ĐỌC</p><h2>Bạn đọc nói gì?</h2></div><Link className="text-link" to="/reviews">Chia sẻ cảm nhận <ArrowRight size={16} /></Link></div><PageState loading={reviews.loading} error={reviews.error} empty={!reviews.loading && !reviews.error && !asList(reviews.data).length ? 'Chưa có đánh giá nổi bật.' : null}><div className="home-review-grid">{asList(reviews.data).map((review) => <article className="home-review-card" key={review.id}><div className="review-stars">{Array.from({ length: Number(review.rating) || 0 }, (_, i) => <Star key={i} size={14} fill="currentColor" />)}</div><p>“{review.comment}”</p><div className="review-reader"><span className="review-avatar" aria-hidden="true">{(review.user?.name || 'B').trim().slice(0, 1)}</span><div><strong>{review.user?.name || 'Bạn đọc BookShop'}</strong><span>{review.book?.title}</span></div></div></article>)}</div></PageState></section>
    <section className="newsletter-section home-newsletter"><div className="shell newsletter-inner"><div><p className="eyebrow"><Mail size={15} /> THƯ TỪ BOOKSHOP</p><h2>Cuốn sách hay tiếp theo,<br />ngay trong hộp thư của bạn.</h2><p>Nhận gợi ý sách mới, bài đọc hay và ưu đãi dành riêng cho bạn.</p></div><form className="newsletter-form" onSubmit={subscribe}><label htmlFor="newsletter-email">Email của bạn</label><div><input id="newsletter-email" required type="email" value={newsletterEmail} onChange={(e) => setNewsletterEmail(e.target.value)} placeholder="ban@email.com" /><button disabled={newsletterBusy}>{newsletterBusy ? 'Đang gửi…' : 'Đăng ký'} <ArrowRight size={16} /></button></div>{newsletterMessage && <p role="status">{newsletterMessage}</p>}</form></div></section>
  </>;
}

function BookShelf({ kicker, title, state, empty }) {
  const books = asList(state.data);
  return <section className="shell section-block"><div className="section-heading bookshelf-heading"><div><p className="eyebrow">{kicker}</p><h2>{title}</h2></div><Link className="text-link" to="/books">Khám phá cửa hàng <ArrowRight size={16} /></Link></div>
    {state.loading ? <BookSkeleton /> : <PageState error={state.error} empty={!state.error && !books.length ? empty : null}>{books.length > 0 && <BookGrid books={books} />}</PageState>}
  </section>;
}

export function Login() { return <div className="shell auth-shell"><AuthCard /></div>; }
export function Register() { return <div className="shell auth-shell"><AuthCard register /></div>; }

export function Books() {
  const [params, setParams] = useSearchParams();
  const query = params.get('q') || '';
  const categoryId = params.get('category') || '';
  const sort = params.get('sort') || 'newest';
  const [searchText, setSearchText] = useState(query);
  const [categoryResponse, setCategoryResponse] = useState([]);
  const [categoryLoading, setCategoryLoading] = useState(true);
  const [categoryError, setCategoryError] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [minPrice, setMinPrice] = useState(params.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(params.get('maxPrice') || '');
  const [rating, setRating] = useState(params.get('rating') || '');
  const page = Number(params.get('page') || 1);
  useEffect(() => { setSearchText(query); }, [query]);
  useEffect(() => {
    setMinPrice(params.get('minPrice') || '');
    setMaxPrice(params.get('maxPrice') || '');
    setRating(params.get('rating') || '');
  }, [params]);
  const load = useCallback(() => bookService.list({ q: query, categoryId, sort, minPrice: params.get('minPrice') || undefined, maxPrice: params.get('maxPrice') || undefined, rating: params.get('rating') || undefined, page, limit: 12 }), [query, categoryId, sort, params.get('minPrice'), params.get('maxPrice'), params.get('rating'), page]);
  const { data, loading, error } = useApi(load, [query, categoryId, sort, params.get('minPrice'), params.get('maxPrice'), params.get('rating'), page]);
  useEffect(() => {
    let active = true;
    categoryService.list()
      .then((response) => {
        if (active) setCategoryResponse(asList(unwrapData(response)));
      })
      .catch((requestError) => {
        if (active) setCategoryError(getErrorMessage(requestError, 'Không thể tải danh mục sách.'));
      })
      .finally(() => {
        if (active) setCategoryLoading(false);
      });
    return () => { active = false; };
  }, []);
  const books = asList(data);
  function submit(event) { event.preventDefault(); setParams((current) => { const next = new URLSearchParams(current); searchText.trim() ? next.set('q', searchText.trim()) : next.delete('q'); next.delete('page'); return next; }); }
  function applyFilters(event) {
    event.preventDefault();
    setParams((current) => {
      const next = new URLSearchParams(current);
      const min = minPrice.trim();
      const max = maxPrice.trim();
      min ? next.set('minPrice', min) : next.delete('minPrice');
      max ? next.set('maxPrice', max) : next.delete('maxPrice');
      rating ? next.set('rating', rating) : next.delete('rating');
      next.delete('page');
      return next;
    });
    setFiltersOpen(false);
  }
  const filters = <form className="filter-form" onSubmit={applyFilters}><div className="filter-title"><strong>Bộ lọc</strong><button type="button" onClick={() => { setMinPrice(''); setMaxPrice(''); setRating(''); setParams((current) => { const n = new URLSearchParams(current); ['category', 'minPrice', 'maxPrice', 'rating', 'page'].forEach((key) => n.delete(key)); return n; }); }}>Xóa lọc</button></div><label>Danh mục<select value={categoryId} disabled={categoryLoading} onChange={(e) => setParams((p) => { const n = new URLSearchParams(p); e.target.value ? n.set('category', e.target.value) : n.delete('category'); n.delete('page'); return n; })}><option value="">{categoryLoading ? 'Đang tải danh mục…' : 'Tất cả danh mục'}</option>{categoryResponse.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>{categoryError && <p className="inline-error" role="alert">Không thể tải danh mục: {categoryError}</p>}<div className="filter-label">Khoảng giá</div><div className="price-range-fields"><label><span>Từ</span><input type="text" inputMode="decimal" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} placeholder="Ví dụ: 100.000" /></label><label><span>Đến</span><input type="text" inputMode="decimal" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} placeholder="Không giới hạn" /></label></div><label>Đánh giá<select value={rating} onChange={(e) => setRating(e.target.value)}><option value="">Tất cả</option><option value="4">Từ 4 sao</option><option value="3">Từ 3 sao</option><option value="2">Từ 2 sao</option></select></label><button className="button button-primary button-wide" type="submit">Áp dụng bộ lọc</button></form>;
  return <div className="shell page-shell"><ScreenTitle kicker="CỬA HÀNG" title="Tìm cuốn sách của bạn" description="Từ những câu chuyện để đắm mình đến những ý tưởng để mang theo." />
    <div className="catalog-toolbar"><SearchBar value={searchText} onChange={(e) => setSearchText(e.target.value)} onSubmit={submit} /><div className="catalog-toolbar-actions"><button className="filter-toggle button button-outline" onClick={() => setFiltersOpen(true)}>Bộ lọc</button><label className="sort-control"><span>Sắp xếp</span><select aria-label="Sắp xếp sách" value={sort} onChange={(e) => setParams((p) => { const n = new URLSearchParams(p); n.set('sort', e.target.value); n.delete('page'); return n; })}><option value="newest">Mới nhất</option><option value="best_selling">Bán chạy</option><option value="price_asc">Giá thấp đến cao</option><option value="price_desc">Giá cao đến thấp</option><option value="title_asc">Tên sách A–Z</option></select></label></div></div>
    <div className="catalog-layout"><aside className="filter-sidebar">{filters}</aside>{filtersOpen && <div className="filter-drawer-backdrop" onClick={() => setFiltersOpen(false)}><aside className="filter-drawer" onClick={(e) => e.stopPropagation()}><div className="filter-drawer-heading"><strong>Lọc sách</strong><button onClick={() => setFiltersOpen(false)} aria-label="Đóng bộ lọc">×</button></div>{filters}</aside></div>}
    <div className="catalog-results"><p className="result-caption">{loading ? 'Đang tìm sách…' : `${data?.total ?? books.length} kết quả`}</p><PageState loading={loading} error={error} empty={!loading && !error && !books.length ? 'Không tìm thấy sách phù hợp.' : null}>{books.length > 0 && <BookGrid books={books} />}</PageState>
      {(Number(data?.totalPages) > 1 || page > 1) && <nav className="pagination" aria-label="Phân trang"><button disabled={page <= 1} onClick={() => setParams((p) => { const n = new URLSearchParams(p); n.set('page', String(page - 1)); return n; })}>← Trước</button><span>Trang {page}{data?.totalPages ? ` / ${data.totalPages}` : ''}</span><button disabled={data?.totalPages ? page >= Number(data.totalPages) : books.length < 12} onClick={() => setParams((p) => { const n = new URLSearchParams(p); n.set('page', String(page + 1)); return n; })}>Tiếp →</button></nav>}
    </div></div>
  </div>;
}

export function BookDetail() {
  const { idOrSlug } = useParams();
  const { isAuthenticated } = useAuth();
  const [message, setMessage] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('description');
  const [selectedImage, setSelectedImage] = useState('');
  const load = useCallback(() => bookService.get(idOrSlug), [idOrSlug]);
  const { data, loading, error } = useApi(load, [idOrSlug]);
  const loadReviews = useCallback(() => reviewService.listPublic({ bookId: idOrSlug }), [idOrSlug]);
  const bookReviews = useApi(loadReviews, [idOrSlug]);
  const loadRelated = useCallback(() => bookService.related(idOrSlug), [idOrSlug]);
  const related = useApi(loadRelated, [idOrSlug]);
  const book = data?.book ?? data;
  const gallery = book ? [book.image, ...(Array.isArray(book.images) ? book.images : [])].filter(Boolean) : [];
  const activeImage = selectedImage || gallery[0];
  async function addToCart() {
    setMessage('');
    try { await cartService.addItem(book.id, quantity); setMessage('Đã thêm sách vào giỏ hàng.'); }
    catch (requestError) { setMessage(getErrorMessage(requestError)); }
  }
  async function buyNow() {
    setMessage('');
    try { await cartService.addItem(book.id, quantity); window.location.assign('/checkout'); }
    catch (requestError) { setMessage(getErrorMessage(requestError)); }
  }
  return <div className="shell page-shell"><PageState loading={loading} error={error} empty={!loading && !error && !book ? 'Không tìm thấy cuốn sách này.' : null}>{book && <><div className="book-detail"><div className="detail-gallery"><div className="detail-cover">{activeImage ? <img src={activeImage} alt={book.title} /> : <span className="cover-placeholder"><span>BOOKSHOP</span><strong>{book.title?.slice(0, 1)}</strong></span>}</div>{gallery.length > 1 && <div className="gallery-thumbnails">{gallery.map((image) => <button key={image} className={activeImage === image ? 'selected' : ''} onClick={() => setSelectedImage(image)} aria-label="Xem ảnh sách"><img src={image} alt="" /></button>)}</div>}</div><div className="detail-copy"><p className="eyebrow">{book.category?.name || 'SÁCH BOOKSHOP'}</p><h1>{book.title}</h1><p className="detail-author">{book.author}</p><div className="detail-rating"><span className="review-stars"><Star size={15} fill="currentColor" /></span><strong>{book.rating ?? '—'}</strong><span>{book.reviewCount ?? asList(book.reviews).length} đánh giá</span></div><p className="detail-price">{formatCurrency(book.discountPrice ?? book.price)} {book.discountPrice && <del>{formatCurrency(book.price)}</del>}</p><p className="detail-description">{book.description || 'Thông tin giới thiệu cho cuốn sách này chưa được cập nhật.'}</p><dl className="detail-meta"><div><dt>Tình trạng</dt><dd>{book.stock > 0 ? `Còn ${book.stock} cuốn` : 'Tạm hết hàng'}</dd></div><div><dt>Mã sách</dt><dd>{book.isbn || book.id}</dd></div></dl><div className="detail-buy-row"><div className="quantity-control"><button disabled={quantity <= 1} onClick={() => setQuantity((q) => Math.max(1, q - 1))} aria-label="Giảm số lượng">−</button><span>{quantity}</span><button disabled={quantity >= Number(book.stock || 1)} onClick={() => setQuantity((q) => Math.min(Number(book.stock || 1), q + 1))} aria-label="Tăng số lượng">+</button></div>{isAuthenticated ? <><button className="button button-outline" disabled={!book.stock} onClick={addToCart}><ShoppingBag size={17} /> Thêm giỏ</button><button className="button button-primary" disabled={!book.stock} onClick={buyNow}>Mua ngay <ArrowRight size={17} /></button></> : <Link className="button button-primary" to="/login">Đăng nhập để mua <ArrowRight size={17} /></Link>}</div>{message && <p className="form-feedback" role="status">{message}</p>}</div></div><div className="book-detail-lower"><div className="detail-tabs" role="tablist"><button className={activeTab === 'description' ? 'active' : ''} onClick={() => setActiveTab('description')}>Mô tả</button><button className={activeTab === 'information' ? 'active' : ''} onClick={() => setActiveTab('information')}>Thông tin sách</button><button className={activeTab === 'reviews' ? 'active' : ''} onClick={() => setActiveTab('reviews')}>Đánh giá ({asList(bookReviews.data).length})</button></div>{activeTab === 'description' && <div className="detail-tab-content"><h2>Về cuốn sách</h2><p>{book.description || 'Thông tin giới thiệu cho cuốn sách này chưa được cập nhật.'}</p></div>}{activeTab === 'information' && <div className="detail-tab-content detail-information"><h2>Thông tin sách</h2><p><span>Tác giả</span><strong>{book.author}</strong></p><p><span>Danh mục</span><strong>{book.category?.name || '—'}</strong></p><p><span>ISBN</span><strong>{book.isbn || '—'}</strong></p><p><span>Nhà xuất bản</span><strong>{book.publisher || '—'}</strong></p><p><span>Ngày xuất bản</span><strong>{formatDate(book.publishedAt)}</strong></p></div>}{activeTab === 'reviews' && <div className="detail-tab-content"><h2>Đánh giá từ bạn đọc</h2><PageState loading={bookReviews.loading} error={bookReviews.error} empty={!bookReviews.loading && !bookReviews.error && !asList(bookReviews.data).length ? 'Cuốn sách chưa có đánh giá.' : null}><div className="home-review-grid">{asList(bookReviews.data).map((review) => <article className="home-review-card" key={review.id}><div className="review-stars">{Array.from({ length: Number(review.rating) || 0 }, (_, i) => <Star key={i} size={14} fill="currentColor" />)}</div><p>{review.comment}</p><strong>{review.user?.name}</strong></article>)}</div></PageState><Link className="text-link" to="/reviews">Viết đánh giá <ArrowRight size={15} /></Link></div>}</div><section className="related-books"><div className="section-heading"><div><p className="eyebrow">CÓ THỂ BẠN SẼ THÍCH</p><h2>Sách liên quan</h2></div></div><PageState loading={related.loading} error={related.error} empty={!related.loading && !related.error && !asList(related.data).length ? 'Chưa có gợi ý liên quan.' : null}>{asList(related.data).length > 0 && <BookGrid books={asList(related.data)} />}</PageState></section></>}</PageState></div>;
}

export function Cart() {
  const load = useCallback(() => cartService.get(), []);
  const { data, loading, error, reload } = useApi(load);
  const [actionError, setActionError] = useState('');
  const items = asList(data?.items ?? data?.cart?.items);
  async function update(item, quantity) {
    try { setActionError(''); if (quantity < 1) await cartService.removeItem(item.id); else await cartService.updateItem(item.id, quantity); await reload(); }
    catch (requestError) { setActionError(getErrorMessage(requestError)); }
  }
  const total = items.reduce((sum, item) => sum + Number(item.book?.discountPrice ?? item.book?.price ?? item.unitPrice ?? 0) * Number(item.quantity), 0);
  return <div className="shell page-shell"><ScreenTitle kicker="GIỎ HÀNG" title="Những cuốn sách của bạn" description="Kiểm tra lại lựa chọn trước khi đến bước thanh toán." />
    <PageState loading={loading} error={error} empty={!loading && !error && !items.length ? 'Giỏ hàng đang trống.' : null}>
      {items.length > 0 && <div className="cart-layout"><div className="cart-list"><div className="cart-list-heading"><span>Sản phẩm</span><span>Đơn giá</span><span>Số lượng</span><span>Tạm tính</span></div>{items.map((item) => { const unitPrice = Number(item.book?.discountPrice ?? item.book?.price ?? item.unitPrice ?? 0); return <article className="cart-item" key={item.id}><div className="cart-thumb">{item.book?.image ? <img src={item.book.image} alt="" /> : <BookPlaceholder title={item.book?.title} />}</div><div className="cart-item-info"><Link to={`/books/${item.book?.slug || item.bookId}`}><strong>{item.book?.title || 'Sách'}</strong></Link><span>{item.book?.author}</span><span className="cart-mobile-price">{formatCurrency(unitPrice)}</span></div><strong className="cart-desktop-price">{formatCurrency(unitPrice)}</strong><div className="cart-quantity-wrap"><div className="quantity-control"><button onClick={() => update(item, item.quantity - 1)} aria-label="Giảm số lượng">−</button><span>{item.quantity}</span><button onClick={() => update(item, item.quantity + 1)} aria-label="Tăng số lượng">+</button></div><button className="remove-link" onClick={() => update(item, 0)}>Xóa</button></div><strong className="cart-line-subtotal">{formatCurrency(unitPrice * Number(item.quantity))}</strong></article>; })}{actionError && <p className="inline-error">{actionError}</p>}</div><aside className="order-summary"><p className="eyebrow">TÓM TẮT ĐƠN HÀNG</p><div><span>Tạm tính</span><strong>{formatCurrency(total)}</strong></div><div><span>Vận chuyển</span><span>Tính ở bước sau</span></div><hr /><div className="summary-total"><span>Tổng tạm tính</span><strong>{formatCurrency(total)}</strong></div><p className="summary-note">Giá hiển thị là ước tính. Backend sẽ xác nhận lại tồn kho, ưu đãi và tổng tiền khi tạo đơn.</p><Link className="button button-primary button-wide" to="/checkout">Tiến hành đặt hàng <ArrowRight size={17} /></Link><Link className="text-link" to="/books">Tiếp tục mua sắm</Link></aside></div>}
    </PageState></div>;
}

function BookPlaceholder({ title }) { return <span className="cover-placeholder"><span>BOOKSHOP</span><strong>{title?.slice(0, 1) || 'B'}</strong></span>; }

export function Checkout() {
  const load = useCallback(() => cartService.get(), []);
  const { data, loading, error } = useApi(load);
  const [form, setForm] = useState({ shippingAddress: '', paymentMethod: 'COD' });
  const [promotionCode, setPromotionCode] = useState('');
  const [promotion, setPromotion] = useState(null);
  const [promotionMessage, setPromotionMessage] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const items = asList(data?.items ?? data?.cart?.items);
  const estimatedSubtotal = items.reduce((sum, item) => sum + Number(item.book?.discountPrice ?? item.book?.price ?? 0) * Number(item.quantity), 0);
  const update = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }));
  async function submit(event) {
    event.preventDefault(); setBusy(true); setMessage('');
    try {
      const result = unwrapData(await orderService.checkout({ ...form, promotionCode: promotion?.code || undefined }));
      navigate('/order-success', { replace: true, state: { order: result } });
    } catch (requestError) { setMessage(getErrorMessage(requestError)); }
    finally { setBusy(false); }
  }
  async function applyPromotion() {
    setPromotionMessage('');
    try { const result = unwrapData(await promotionService.validate(promotionCode.trim())); setPromotion(result); setPromotionMessage(result?.message || 'Mã ưu đãi đã được xác nhận.'); }
    catch (requestError) { setPromotion(null); setPromotionMessage(getErrorMessage(requestError)); }
  }
  return <div className="shell page-shell"><ScreenTitle kicker="THANH TOÁN" title="Hoàn tất đơn hàng" description="Thông tin giá và phí sẽ được xác nhận bởi hệ thống khi tạo đơn." />
    <PageState loading={loading} error={error} empty={!loading && !error && !items.length ? 'Giỏ hàng trống. Hãy chọn sách trước khi thanh toán.' : null}>
      {items.length > 0 && <div className="checkout-layout"><div className="checkout-main"><form className="checkout-form form-stack" onSubmit={submit}><h2>Thông tin giao hàng</h2><label>Địa chỉ nhận hàng<textarea required minLength="8" value={form.shippingAddress} onChange={update('shippingAddress')} rows="4" placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố" /></label><label>Phương thức thanh toán<select value={form.paymentMethod} onChange={update('paymentMethod')}><option value="COD">Thanh toán khi nhận hàng</option><option value="BANK_TRANSFER">Chuyển khoản</option><option value="CARD">Thẻ ngân hàng</option><option value="E_WALLET">Ví điện tử</option></select></label><section className="checkout-items"><h2>Sản phẩm trong đơn</h2>{items.map((item) => <div className="summary-line" key={item.id}><span>{item.book?.title || 'Sách'} × {item.quantity}</span><strong>{formatCurrency(Number(item.book?.discountPrice ?? item.book?.price ?? 0) * item.quantity)}</strong></div>)}</section><section className="promotion-entry"><h2>Mã khuyến mãi</h2><div className="promotion-input"><input value={promotionCode} onChange={(e) => setPromotionCode(e.target.value)} placeholder="Nhập mã ưu đãi" /><button type="button" className="button button-outline" onClick={applyPromotion} disabled={!promotionCode.trim()}>Áp dụng</button></div>{promotionMessage && <p className={promotion ? 'inline-success' : 'inline-error'}>{promotionMessage}</p>}</section>{message && <div className="inline-error">{message}</div>}<button className="button button-primary" disabled={busy}>{busy ? 'Đang tạo đơn…' : 'Xác nhận đặt hàng'} <ArrowRight size={17} /></button></form></div><aside className="order-summary"><p className="eyebrow">TÓM TẮT ĐƠN HÀNG</p>{items.map((item) => <div className="summary-line" key={item.id}><span>{item.book?.title || 'Sách'} × {item.quantity}</span><strong>{formatCurrency(Number(item.book?.discountPrice ?? item.book?.price ?? 0) * item.quantity)}</strong></div>)}<div className="price-breakdown"><div><span>Tạm tính ước tính</span><strong>{formatCurrency(estimatedSubtotal)}</strong></div>{promotion && <div><span>Ưu đãi</span><strong>Đã xác nhận</strong></div>}<div><span>Phí giao hàng</span><strong>Backend tính</strong></div><div className="summary-total"><span>Tổng cuối</span><strong>Backend xác nhận</strong></div></div><p className="summary-note">Backend sẽ tính lại giá, tồn kho, mức giảm và phí giao hàng khi tạo đơn.</p></aside></div>}
    </PageState></div>;
}

export function OrderSuccess() {
  const { orderId } = useParams();
  const stateOrder = useLocation().state?.order;
  const requestedOrderId = orderId || stateOrder?.id;
  const load = useCallback(() => {
    if (!requestedOrderId) return Promise.resolve({ data: null });
    if (stateOrder?.id === requestedOrderId) return Promise.resolve({ data: stateOrder });
    return orderService.get(requestedOrderId);
  }, [requestedOrderId, stateOrder]);
  const { data, loading, error } = useApi(load, [requestedOrderId, stateOrder]);
  const order = data?.order ?? data;

  return <div className="shell page-shell"><PageState loading={loading} error={error} empty={!loading && !error && !order ? 'Không tìm thấy đơn hàng. Hãy mở lịch sử đơn hàng để tra cứu.' : null}>{order && <div className="success-card"><span className="success-icon"><Check size={28} /></span><p className="eyebrow">ĐƠN HÀNG ĐÃ ĐƯỢC TẠO</p><h1>Cảm ơn bạn đã chọn BookShop.</h1><p>Đơn hàng đã được ghi nhận. Bạn có thể theo dõi giao hàng và tình trạng thanh toán trong chi tiết đơn.</p>{order.orderNumber && <p className="order-number">Mã đơn hàng <strong>{order.orderNumber}</strong></p>}<p className="order-number">Thanh toán <strong>{order.paymentStatus || 'Đang chờ xác nhận'}</strong></p><div className="hero-actions"><Link className="button button-primary" to={order.id ? `/orders/${order.id}` : '/orders'}>Theo dõi đơn hàng <ArrowRight size={17} /></Link><Link className="text-link" to="/books">Tiếp tục khám phá</Link></div></div>}</PageState>{!loading && !order && <p className="form-feedback"><Link to="/orders">Xem lịch sử đơn hàng</Link></p>}</div>;
}

export function Orders() {
  const load = useCallback(() => orderService.list(), []);
  const { data, loading, error } = useApi(load);
  const orders = asList(data);
  return <div className="shell page-shell"><ScreenTitle kicker="TÀI KHOẢN CỦA BẠN" title="Lịch sử đơn hàng" description="Theo dõi hành trình của những cuốn sách đang về với bạn." />
    <PageState loading={loading} error={error} empty={!loading && !error && !orders.length ? 'Bạn chưa có đơn hàng nào.' : null}>{orders.length > 0 && <div className="orders-list">{orders.map((order) => <Link className="order-row" to={`/orders/${order.id}`} key={order.id}><div className="order-row-icon"><PackageSearch size={20} /></div><div><span className="muted">{formatDate(order.createdAt)}</span><strong>{order.orderNumber || order.id}</strong></div><span className={`status-pill status-${String(order.orderStatus || order.status).toLowerCase()}`}>{order.orderStatus || order.status}</span><strong>{formatCurrency(order.total)}</strong><ArrowRight size={17} /></Link>)}</div>}</PageState></div>;
}

export function OrderDetail() {
  const { orderId } = useParams();
  const load = useCallback(() => orderService.get(orderId), [orderId]);
  const { data, loading, error, reload } = useApi(load, [orderId]);
  const [actionError, setActionError] = useState('');
  const order = data?.order ?? data;
  async function cancelOrder() {
    try { await orderService.cancel(orderId); setActionError(''); await reload(); }
    catch (requestError) { setActionError(getErrorMessage(requestError)); }
  }
  const canCancel = ['PENDING', 'CONFIRMED'].includes(order?.orderStatus ?? order?.status);
  return <div className="shell page-shell"><ScreenTitle kicker="CHI TIẾT ĐƠN HÀNG" title={order?.orderNumber || 'Đơn hàng'} action={<Link className="text-link" to="/orders">← Lịch sử đơn hàng</Link>} />
    <PageState loading={loading} error={error} empty={!loading && !error && !order ? 'Không tìm thấy đơn hàng.' : null}>{order && <div className="order-detail-layout"><div className="panel"><div className="detail-heading"><div><p className="eyebrow">TRẠNG THÁI</p><span className={`status-pill status-${String(order.orderStatus ?? order.status).toLowerCase()}`}>{order.orderStatus ?? order.status}</span></div><span className="muted">Đặt ngày {formatDate(order.createdAt)}</span></div><h2>Sản phẩm trong đơn</h2>{asList(order.items).map((item) => <div className="summary-line order-product" key={item.id}><div><strong>{item.title || item.book?.title}</strong><span className="muted">Số lượng: {item.quantity}</span></div><strong>{formatCurrency(item.subtotal ?? Number(item.unitPrice) * item.quantity)}</strong></div>)}<div className="price-breakdown"><div><span>Tạm tính</span><strong>{formatCurrency(order.subtotal)}</strong></div><div><span>Ưu đãi</span><strong>− {formatCurrency(order.discount)}</strong></div><div><span>Phí vận chuyển</span><strong>{formatCurrency(order.shippingFee)}</strong></div><div className="summary-total"><span>Tổng cộng</span><strong>{formatCurrency(order.total)}</strong></div></div></div><aside className="panel"><p className="eyebrow">GIAO HÀNG & THANH TOÁN</p><h3>Địa chỉ nhận hàng</h3><p>{order.shippingAddress}</p><h3>Thanh toán</h3><p>{order.paymentMethod} · {order.paymentStatus}</p>{canCancel && <button className="button button-outline button-wide" onClick={cancelOrder}>Hủy đơn hàng</button>}{actionError && <p className="inline-error">{actionError}</p>}</aside></div>}</PageState></div>;
}

export function Profile() {
  const { refreshUser } = useAuth();
  const load = useCallback(() => authService.me(), []);
  const { data, loading, error } = useApi(load);
  const user = data?.user ?? data;
  return <div className="shell page-shell"><ScreenTitle kicker="TÀI KHOẢN CỦA BẠN" title="Thông tin cá nhân" description="Thông tin hồ sơ đang được lấy từ tài khoản BookShop của bạn." />
    <PageState loading={loading} error={error} empty={!loading && !error && !user ? 'Không tìm thấy hồ sơ.' : null}>{user && <div className="profile-card panel"><div className="profile-avatar">{user.name?.slice(0, 1) || 'B'}</div><div><p className="eyebrow">HỒ SƠ THÀNH VIÊN</p><h2>{user.name}</h2><p>{user.email}</p><div className="profile-details"><span><strong>Điện thoại</strong>{user.phone || 'Chưa cập nhật'}</span><span><strong>Địa chỉ</strong>{user.address || 'Chưa cập nhật'}</span><span><strong>Điểm tích lũy</strong>{user.points ?? 0}</span><span><strong>Hạng thành viên</strong>{user.membershipLevel || 'BRONZE'}</span></div><button className="button button-outline" onClick={refreshUser}>Làm mới thông tin</button></div></div>}</PageState></div>;
}

export function Membership() {
  const load = useCallback(() => membershipService.getMine(), []);
  const loadTiers = useCallback(() => membershipService.getTiers(), []);
  const mine = useApi(load);
  const tiers = useApi(loadTiers);
  const data = mine.data?.membership ?? mine.data;
  return <div className="shell page-shell"><ScreenTitle kicker="BOOKSHOP MEMBERS" title="Đọc nhiều, nhận nhiều hơn" description="Điểm và hạng thành viên được tính từ dữ liệu tài khoản của bạn." />
    <PageState loading={mine.loading} error={mine.error} empty={!mine.loading && !mine.error && !data ? 'Chưa có dữ liệu thành viên cho tài khoản.' : null}>{data && <div className="membership-current"><div><p className="eyebrow">HẠNG HIỆN TẠI</p><h2>{data.membershipLevel || data.level}</h2><p>{data.points ?? 0} điểm tích lũy</p></div><div className="points-mark">{data.points ?? 0}<small>POINTS</small></div></div>}</PageState>
    <section className="section-block"><h2>Các hạng thành viên</h2><PageState loading={tiers.loading} error={tiers.error} empty={!tiers.loading && !tiers.error && !asList(tiers.data).length ? 'Thông tin hạng thành viên chưa khả dụng.' : null}><div className="tier-grid">{asList(tiers.data).map((tier) => <article className="tier-card" key={tier.id || tier.level}><span>{tier.level}</span><h3>{tier.name}</h3><p>Từ {tier.minPoints} điểm</p><p>{tier.description}</p></article>)}</div></PageState></section>
  </div>;
}

export function Reviews() {
  const load = useCallback(() => reviewService.listMine(), []);
  const { data, loading, error, reload } = useApi(load);
  const [form, setForm] = useState({ bookId: '', rating: 5, comment: '' });
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [submitError, setSubmitError] = useState(false);
  const reviews = asList(data);
  async function submit(event) {
    event.preventDefault(); if (busy) return; setBusy(true); setMessage(''); setSubmitError(false);
    try { await reviewService.create({ ...form, rating: Number(form.rating) }); setMessage('Đánh giá đã được gửi và đang chờ quản trị viên duyệt.'); setForm({ bookId: '', rating: 5, comment: '' }); await reload(); }
    catch (requestError) { setSubmitError(true); setMessage(getErrorMessage(requestError)); }
    finally { setBusy(false); }
  }
  return <div className="shell page-shell"><ScreenTitle kicker="CỘNG ĐỒNG ĐỌC SÁCH" title="Đánh giá của bạn" description="Chia sẻ cảm nhận để giúp người đọc khác tìm được cuốn sách phù hợp." />
    <div className="review-layout"><form className="panel form-stack" onSubmit={submit}><h2>Viết đánh giá</h2><label>Mã sách hoặc ISBN<input required maxLength={280} value={form.bookId} onChange={(e) => setForm({ ...form, bookId: e.target.value })} placeholder="Ví dụ: 978-3-8365-3920-3" /></label><p className="muted">Nhập ISBN trên trang chi tiết sách. Bạn có thể đánh giá sau khi đơn hàng đã được giao. Đánh giá mới hoặc gửi lại chỉ được công khai và tính điểm sao sau khi quản trị viên duyệt.</p><label>Điểm đánh giá<select value={form.rating} onChange={(e) => setForm({ ...form, rating: e.target.value })}>{[5, 4, 3, 2, 1].map((rating) => <option key={rating} value={rating}>{rating} sao</option>)}</select></label><label>Cảm nhận<textarea maxLength="5000" rows="4" value={form.comment} onChange={(e) => setForm({ ...form, comment: e.target.value })} /></label>{message && <p className={submitError ? "inline-error" : "form-feedback"} role={submitError ? "alert" : "status"}>{message}</p>}<button className="button button-primary" disabled={busy}>{busy ? 'Đang gửi…' : 'Gửi đánh giá'} <ArrowRight size={16} /></button></form>
      <div><h2>Lịch sử đánh giá</h2><PageState loading={loading} error={error} empty={!loading && !error && !reviews.length ? 'Bạn chưa gửi đánh giá nào.' : null}>{reviews.map((review) => <article className="review-card" key={review.id}><div className="review-stars">{Array.from({ length: Number(review.rating) || 0 }, (_, i) => <Star key={i} size={15} fill="currentColor" />)}</div><StatusBadge value={review.status} resource="reviews" /><strong>{review.book?.title || review.bookId}</strong><p>{review.comment}</p><span className="muted">{formatDate(review.createdAt)}</span></article>)}</PageState></div></div>
  </div>;
}

export function NotFound() {
  return <div className="shell page-shell"><div className="not-found"><span>404</span><p className="eyebrow">TRANG KHÔNG TỒN TẠI</p><h1>Cuốn sách này chưa có ở đây.</h1><Link className="button button-primary" to="/">Về trang chủ <ArrowRight size={17} /></Link></div></div>;
}
