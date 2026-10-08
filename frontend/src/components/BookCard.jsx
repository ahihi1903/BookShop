import { Link } from 'react-router-dom';
import { ArrowUpRight, Heart, ShoppingBag, Star } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { cartService } from '../services/cartService.js';
import { favoriteService } from '../services/favoriteService.js';
import { getErrorMessage } from '../utils/apiData.js';
import { formatCurrency } from '../utils/apiData.js';
import { getEffectiveBookPrice, resolveImageUrl } from '../utils/catalog.js';

export default function BookCard({ book }) {
  const price = getEffectiveBookPrice(book);
  const [favorite, setFavorite] = useState(Boolean(book.isFavorite));
  const [feedback, setFeedback] = useState('');
  const [busy, setBusy] = useState(false);
  const { isAuthenticated } = useAuth();
  async function addToCart() {
    if (!isAuthenticated) { setFeedback('Đăng nhập để thêm sách vào giỏ.'); return; }
    setBusy(true); setFeedback('');
    try { await cartService.addItem(book.id); setFeedback('Đã thêm vào giỏ hàng.'); }
    catch (error) { setFeedback(getErrorMessage(error)); }
    finally { setBusy(false); }
  }
  async function toggleFavorite() {
    if (!isAuthenticated) { setFeedback('Đăng nhập để lưu sách yêu thích.'); return; }
    setBusy(true); setFeedback('');
    try { const result = await favoriteService.toggle(book.id); setFavorite(result?.isFavorite ?? !favorite); }
    catch (error) { setFeedback(getErrorMessage(error)); }
    finally { setBusy(false); }
  }
  return (
    <article className="book-card">
      <div className="book-cover">
        <Link className="cover-image-link" to={`/books/${book.slug || book.id}`} aria-label={`Xem ${book.title}`}>
        {book.image
          ? <img src={resolveImageUrl(book.image)} alt={book.title} loading="lazy" />
          : <span className="cover-placeholder"><span>BOOKSHOP</span><strong>{book.title?.slice(0, 1) || 'B'}</strong></span>}
        {(book.badge || book.isNew || book.discountPrice) && <span className={`book-badge ${book.discountPrice ? 'badge-sale' : ''}`}>{book.badge || (book.discountPrice ? 'Ưu đãi' : 'Mới')}</span>}
        </Link>
        <button className={`favorite-button ${favorite ? 'is-favorite' : ''}`} type="button" disabled={busy} aria-label={favorite ? 'Bỏ yêu thích' : 'Thêm yêu thích'} onClick={toggleFavorite}><Heart size={17} fill={favorite ? 'currentColor' : 'none'} /></button>
      </div>
      <div className="book-card-body">
        <p className="eyebrow">{book.category?.name || 'Sách chọn lọc'}</p>
        <h3><Link to={`/books/${book.slug || book.id}`}>{book.title}</Link></h3>
        <p className="muted">{book.author}</p>
        <div className="book-rating" aria-label={book.rating ? `${book.rating} trên 5 sao` : 'Chưa có đánh giá'}><Star size={13} fill={book.rating ? 'currentColor' : 'none'} /><strong>{book.rating ?? '—'}</strong><span>({book.reviewCount ?? 0})</span></div>
        <div className="book-price-row">
          <strong>{formatCurrency(price)}</strong>
          {book.discountPrice && <del>{formatCurrency(book.price)}</del>}
          <Link to={`/books/${book.slug || book.id}`} className="icon-link" aria-label="Xem chi tiết"><ArrowUpRight size={17} /></Link>
        </div>
        <button className="card-add-button" type="button" disabled={busy || book.stock === 0} onClick={addToCart}><ShoppingBag size={14} />{busy ? 'Đang thêm…' : book.stock === 0 ? 'Tạm hết hàng' : 'Thêm vào giỏ'}</button>
        {feedback && <p className="card-feedback" role="status">{feedback}</p>}
      </div>
    </article>
  );
}
