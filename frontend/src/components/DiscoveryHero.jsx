import { ArrowLeft, ArrowRight, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import PageState from './PageState.jsx';
import { asList } from '../utils/apiData.js';
import { resolveImageUrl } from '../utils/catalog.js';
import useHeroCarousel from '../hooks/useHeroCarousel.js';

export default function DiscoveryHero({ state }) {
  const books = asList(state.data).slice(0, 4);
  const carousel = useHeroCarousel(books.length);
  return (
    <section ref={carousel.stage} {...carousel.handlers} className={`editorial-hero editorial-carousel ${carousel.motion.offset && !carousel.motion.settling ? 'is-dragging' : ''}`}
      tabIndex={0} aria-label="Sách bán chạy — kéo hoặc vuốt trái/phải để chuyển ảnh" aria-roledescription="băng chuyền">
      <PageState loading={state.loading && !books.length} error={!books.length ? state.error : null} empty={!books.length ? 'Chưa có sách nổi bật. Khám phá các đầu sách trong cửa hàng.' : null}>
        {state.error && books.length > 0 && <p className="shell" role="status">Chưa cập nhật được sách bán chạy. Đang hiển thị dữ liệu gần nhất.</p>}
        <div className="editorial-deck">
          {books.map((book, index) => {
            const position = carousel.position(index);
            const active = index === carousel.index;
            return <div key={book.id} className="editorial-panel" aria-hidden={!active} inert={active ? undefined : ''}
              style={{ transform: `translate3d(${position * 100 + carousel.motion.offset}%,0,0)`, visibility: Math.abs(position) > 1 ? 'hidden' : 'visible', transition: carousel.motion.settling ? 'transform 320ms cubic-bezier(.22,.61,.36,1)' : 'none' }}>
              <div className="editorial-slide shell">
                <Link draggable={false} className="editorial-cover" to={`/books/${book.slug || book.id}`} aria-label={`Khám phá ${book.title}`}>
                  {book.image ? <img draggable={false} src={resolveImageUrl(book.image)} alt={book.title} fetchpriority={active ? 'high' : 'auto'} /> : <div className="editorial-cover-empty"><BookOpen size={64} /><span>{book.title}</span></div>}
                </Link>
                <div className="editorial-copy">
                  <p className="editorial-kicker">{book.category?.name || 'BOOKSHOP SELECTION'}</p>
                  <h1>{book.title}</h1>
                  <p className="editorial-author">{book.author}</p>
                  {book.description && <p className="editorial-description">{book.description}</p>}
                  <Link draggable={false} className="editorial-cta" to={`/books/${book.slug || book.id}`}>Khám phá cuốn sách <ArrowRight size={17} /></Link>
                </div>
              </div>
            </div>;
          })}
        </div>
        {!!books.length && <div className="editorial-controls shell">
          <Link to="/books" className="editorial-all">Tất cả sách <ArrowRight size={14} /></Link>
          <div className="editorial-dots" aria-label="Chọn sách nổi bật">{books.map((item, index) => <button key={item.id} type="button" className={index === carousel.index ? 'is-active' : ''} aria-label={`Xem sách ${index + 1}: ${item.title}`} aria-pressed={index === carousel.index} onClick={() => carousel.select(index)} />)}</div>
          <div className="editorial-arrows"><span aria-live="polite" aria-atomic="true">{carousel.index + 1} / {books.length}</span><button type="button" disabled={books.length < 2} onClick={() => carousel.select(carousel.index - 1)} aria-label="Sách trước"><ArrowLeft size={18} /></button><button type="button" disabled={books.length < 2} onClick={() => carousel.select(carousel.index + 1)} aria-label="Sách tiếp theo"><ArrowRight size={18} /></button></div>
        </div>}
      </PageState>
    </section>
  );
}
