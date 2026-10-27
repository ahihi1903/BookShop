import { Heart, Menu, Search, ShoppingBag, UserRound, X, PackageSearch } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import ThemeToggle from './ThemeToggle.jsx';
import CategoryMenu from './CategoryMenu.jsx';
import { useFavorites } from '../contexts/FavoritesContext.jsx';

export default function Header() {
  const { user, isAuthenticated, logout } = useAuth();
  const { books: favorites, setOpen: openFavorites, loading: favoritesLoading, error: favoritesError } = useFavorites();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const urlQuery = searchParams.get('q') || '';

  useEffect(() => {
    setQuery(urlQuery);
  }, [urlQuery]);

  const search = (event) => {
    event.preventDefault();
    navigate(`/books?q=${encodeURIComponent(query.trim())}`);
    setMenuOpen(false);
    setMobileSearchOpen(false);
  };

  return (
    <header className="site-header">
      <div className="header-main shell">
        <Link className="brand editorial-wordmark" to="/" aria-label="BookShop — Trang chủ">BOOKSHOP</Link>
        <form className="header-search" onSubmit={search}><Search size={17} /><input value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Tìm sách hoặc tác giả" placeholder="Tìm sách, tác giả…" /><button aria-label="Tìm kiếm">Tìm</button></form>
        <button className="mobile-search-toggle icon-button" onClick={() => setMobileSearchOpen(!mobileSearchOpen)} aria-label="Tìm kiếm"><Search size={20} /></button>
        <div className="header-actions">
          <button className="header-icon-link wishlist-shortcut" type="button" aria-label={`Sách yêu thích${!favoritesLoading && !favoritesError ? `: ${favorites.length} cuốn` : ''}`} onClick={() => openFavorites(true)}><Heart size={19} /><span>Yêu thích</span>{!favoritesLoading && !favoritesError && favorites.length > 0 && <b className="wishlist-count">{favorites.length}</b>}</button>
          <Link className="header-icon-link orders-shortcut" to={isAuthenticated ? '/orders' : '/login'}><PackageSearch size={19} /><span>Đơn hàng</span></Link>
          <Link className="header-icon-link cart-shortcut" to={isAuthenticated ? '/cart' : '/login'}><ShoppingBag size={19} /><span>Giỏ hàng</span></Link>
          <Link className="header-icon-link account-shortcut" to={isAuthenticated ? '/profile' : '/login'}><UserRound size={19} /><span>{isAuthenticated ? user?.name?.split(' ')[0] : 'Tài khoản'}</span></Link>
          <ThemeToggle />
        </div>
        <button className="mobile-menu icon-button" onClick={() => setMenuOpen(!menuOpen)} aria-expanded={menuOpen} aria-controls="customer-navigation" aria-label={menuOpen ? 'Đóng menu' : 'Mở menu'}>{menuOpen ? <X /> : <Menu />}</button>
      </div>
      {mobileSearchOpen && <form className="mobile-search-bar shell" onSubmit={search}><Search size={18} /><input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tìm tên sách, tác giả…" /><button type="submit">Tìm</button></form>}
      <nav id="customer-navigation" className={`category-nav ${menuOpen ? 'is-open' : ''}`} aria-label="Danh mục sách">
        <div className="shell nav-inner">
          <NavLink to="/books" onClick={() => setMenuOpen(false)}>Tất cả sách</NavLink>
          <CategoryMenu onNavigate={() => setMenuOpen(false)} />
          <Link to="/books?sort=newest" onClick={() => setMenuOpen(false)}>Sách mới</Link>
          <Link to="/books?sort=best_selling" onClick={() => setMenuOpen(false)}>Bán chạy</Link>
          <span className="nav-spacer" /><div className="nav-account-links">
          {isAuthenticated && <><NavLink to="/orders" onClick={() => setMenuOpen(false)}>Đơn hàng</NavLink><NavLink to="/profile" onClick={() => setMenuOpen(false)}>Tài khoản</NavLink></>}
          {isAuthenticated && user?.role === 'ADMIN' && <NavLink to="/admin" onClick={() => setMenuOpen(false)}>Quản trị</NavLink>}
          {isAuthenticated ? <button className="nav-button" onClick={() => { logout(); navigate('/'); }}>Đăng xuất</button> : <><NavLink to="/login" onClick={() => setMenuOpen(false)}>Đăng nhập</NavLink><Link className="nav-register" to="/register" onClick={() => setMenuOpen(false)}>Tạo tài khoản</Link></>}
          </div>
        </div>
      </nav>
    </header>
  );
}
