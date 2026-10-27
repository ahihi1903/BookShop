import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BookOpen, ChevronDown, Search } from 'lucide-react';
import { categoryService } from '../services/categoryService.js';
import { asList, getErrorMessage, unwrapData } from '../utils/apiData.js';

const normalize = (text) => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase();

export default function CategoryMenu({ onNavigate }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [attempt, setAttempt] = useState(0);
  const menu = useRef(null);
  const location = useLocation();
  useEffect(() => {
    let active = true;
    setLoading(true); setError('');
    categoryService.list().then((response) => {
      if (active) setCategories(asList(unwrapData(response)));
    }).catch((cause) => {
      if (active) setError(getErrorMessage(cause, 'Không thể tải danh mục.'));
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [attempt]);
  useEffect(() => { if (menu.current) menu.current.open = false; setQuery(''); }, [location.key]);
  useEffect(() => {
    const dismiss = (event) => {
      if (menu.current && !menu.current.contains(event.target)) menu.current.open = false;
    };
    const escape = (event) => {
      if (event.key === 'Escape' && menu.current?.open) {
        menu.current.open = false;
        menu.current.querySelector('summary')?.focus();
      }
    };
    document.addEventListener('pointerdown', dismiss);
    document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('pointerdown', dismiss); document.removeEventListener('keydown', escape); };
  }, []);
  const items = categories.filter((category) => normalize(category.name).includes(normalize(query.trim())));
  const selected = new URLSearchParams(location.search).get('category');
  function close() { if (menu.current) menu.current.open = false; onNavigate?.(); }

  return <details className="category-menu" ref={menu} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) event.currentTarget.open = false; }}>
    <summary>Danh mục sách <ChevronDown size={15} /></summary>
    <div className="category-mega">
      <div className="category-mega-heading"><div><strong>Khám phá theo danh mục</strong><p>Tìm chủ đề bạn muốn đọc.</p></div><Link to="/books" onClick={close}>Tất cả sách →</Link></div>
      <label className="category-mega-search"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm danh mục…" aria-label="Tìm danh mục sách" /></label>
      {loading ? <p role="status">Đang tải danh mục…</p> : error ? <div role="alert"><p>{error}</p><button type="button" onClick={() => setAttempt((value) => value + 1)}>Thử lại</button></div> : <>
        <div className="category-mega-grid">{items.map((category) => <Link key={category.id} to={`/books?category=${encodeURIComponent(category.id)}`} onClick={close} aria-current={location.pathname === '/books' && selected === category.id ? 'page' : undefined}><BookOpen size={18} /><span><strong>{category.name}</strong>{category.bookCount != null && <small>{category.bookCount} đầu sách</small>}</span></Link>)}</div>
        {!items.length && <p role="status">{query ? 'Không có danh mục phù hợp.' : 'Chưa có danh mục sách.'}</p>}
      </>}
    </div>
  </details>;
}
