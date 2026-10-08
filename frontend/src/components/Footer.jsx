import { ArrowUpRight, BookOpen, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="shell footer-grid">
        <div className="footer-brand"><Link className="brand" to="/"><span className="brand-mark"><BookOpen size={20} /></span><span>book<span>shop</span></span></Link><p>Một góc nhỏ để tìm những cuốn sách ở lại thật lâu.</p></div>
        <div><p className="footer-label">Khám phá</p><Link to="/books">Tất cả sách</Link><Link to="/membership">Thành viên</Link><Link to="/orders">Đơn hàng</Link></div>
        <div><p className="footer-label">Kết nối</p><a href="mailto:hello@bookshop.vn"><Mail size={15} /> hello@bookshop.vn</a><span>Thứ 2 – Thứ 7, 9:00 – 18:00</span></div>
        <div className="footer-note"><span>Đọc thêm một chút mỗi ngày.</span><ArrowUpRight size={17} /></div>
      </div>
      <div className="shell footer-bottom"><span>© {new Date().getFullYear()} BookShop</span><span>Được làm cho những người yêu sách</span></div>
    </footer>
  );
}
