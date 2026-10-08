import { BookOpen, Menu, Search, ShoppingBag, UserRound, X, PackageSearch } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { categoryService } from '../services/categoryService.js';
import { asList, unwrapData } from '../utils/apiData.js';

export default function Header() {
  const { user, isAuthenticated, logout } = useAuth();
  const [categories, setCategories] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    categoryService.list().then((response) => {
      if (active) setCategories(asList(unwrapData(response)).slice(0, 5));
    }).catch(() => {});
    return () => { active = false; };
  }, []);

  const search = (event) => {
    event.preventDefault();
    navigate(`/books?q=${encodeURIComponent(query.trim())}`);
    setMenuOpen(false);
    setMobileSearchOpen(false);
  };

  return (
    <header className="site-header">
      <div className="header-main shell">
        <Link className="brand" to="/"><span className="brand-mark"><BookOpen size={20} /></span><span>book<span>shop</span></span></Link>
        <form className="header-search" onSubmit={search}><Search size={17} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tìm cuốn sách của bạn" /><button aria-label="Tìm kiếm">Tìm</button></form>
        <button className="mobile-search-toggle icon-button" onClick={() => setMobileSearchOpen(!mobileSearchOpen)} aria-label="Tìm kiếm"><Search size={20} /></button>
        <div className="header-actions">
          <Link className="header-icon-link orders-shortcut" to={isAuthenticated ? '/orders' : '/login'}><PackageSearch size={19} /><span>Đơn hàng</span></Link>
          <Link className="header-icon-link cart-shortcut" to={isAuthenticated ? '/cart' : '/login'}><ShoppingBag size={19} /><span>Giỏ hàng</span></Link>
          <Link className="header-icon-link account-shortcut" to={isAuthenticated ? '/profile' : '/login'}><UserRound size={19} /><span>{isAuthenticated ? user?.name?.split(' ')[0] : 'Tài khoản'}</span></Link>
        </div>
        <button className="mobile-menu icon-button" onClick={() => setMenuOpen(!menuOpen)} aria-label={menuOpen ? 'Đóng menu' : 'Mở menu'}>{menuOpen ? <X /> : <Menu />}</button>
      </div>
      {mobileSearchOpen && <form className="mobile-search-bar shell" onSubmit={search}><Search size={18} /><input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tìm tên sách, tác giả…" /><button type="submit">Tìm</button></form>}
      <nav className={`category-nav ${menuOpen ? 'is-open' : ''}`} aria-label="Danh mục sách">
        <div className="shell nav-inner">
          <NavLink to="/books" onClick={() => setMenuOpen(false)}>Tất cả sách</NavLink>
          {categories.map((category) => <NavLink key={category.id} to={`/books?category=${encodeURIComponent(category.id)}`} onClick={() => setMenuOpen(false)}>{category.name}</NavLink>)}
          <span className="nav-spacer" />
          {isAuthenticated && <><NavLink to="/orders" onClick={() => setMenuOpen(false)}>Đơn hàng</NavLink><NavLink to="/profile" onClick={() => setMenuOpen(false)}>Tài khoản</NavLink></>}
          {isAuthenticated && user?.role === 'ADMIN' && <NavLink to="/admin" onClick={() => setMenuOpen(false)}>Quản trị</NavLink>}
          {isAuthenticated ? <button className="nav-button" onClick={() => { logout(); navigate('/'); }}>Đăng xuất</button> : <><NavLink to="/login" onClick={() => setMenuOpen(false)}>Đăng nhập</NavLink><Link to="/register" onClick={() => setMenuOpen(false)}>Tạo tài khoản</Link></>}
        </div>
      </nav>
    </header>
  );
}
