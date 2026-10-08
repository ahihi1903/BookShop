import { useCallback, useState } from 'react';
import { ArrowDownRight, ArrowUpRight, BookOpen, CircleAlert, PackageCheck, Users } from 'lucide-react';
import PageState from '../components/PageState.jsx';
import Toast from '../components/Toast.jsx';
import BookImageUpload from '../components/admin/BookImageUpload.jsx';
import { useApi } from '../hooks/useApi.js';
import { adminService } from '../services/adminService.js';
import { asList, formatCurrency, formatDate } from '../utils/apiData.js';

function AdminTitle({ title, description, action }) {
  return <div className="admin-page-title"><div><p className="eyebrow">BOOKSHOP ADMIN</p><h1>{title}</h1><p>{description}</p></div>{action}</div>;
}

const metricConfig = [
  ['revenue', 'Doanh thu', 'currency', ArrowUpRight],
  ['orders', 'Đơn hàng', 'number', PackageCheck],
  ['customers', 'Khách hàng', 'number', Users],
  ['books', 'Đầu sách', 'number', BookOpen],
];

export function AdminDashboard() {
  const load = useCallback(() => adminService.dashboard(), []);
  const { data, loading, error } = useApi(load);
  const metrics = data?.metrics ?? data ?? {};
  const bestSellers = asList(data?.bestSellers);
  const lowStock = asList(data?.lowStock);
  return <div className="admin-page"><AdminTitle title="Tổng quan cửa hàng" description="Bức tranh hoạt động của BookShop từ dữ liệu thực tế." />
    <PageState loading={loading} error={error}>
      <div className="metric-grid">{metricConfig.map(([key, label, type, Icon]) => <article className="metric-card" key={key}><div className="metric-top"><span>{label}</span><Icon size={18} /></div><strong>{metrics[key] == null ? '—' : type === 'currency' ? formatCurrency(metrics[key]) : new Intl.NumberFormat('vi-VN').format(metrics[key])}</strong><small>{metrics[`${key}Change`] == null ? 'Chưa có dữ liệu so sánh' : `${metrics[`${key}Change`] > 0 ? '+' : ''}${metrics[`${key}Change`]}% so với kỳ trước`}</small></article>)}</div>
      <div className="admin-dashboard-grid"><section className="admin-panel"><div className="admin-panel-heading"><div><p className="eyebrow">DOANH THU</p><h2>Xu hướng theo thời gian</h2></div><span className="data-period">Dữ liệu hệ thống</span></div><RevenueChart rows={asList(data?.revenueTrend)} /></section><section className="admin-panel"><div className="admin-panel-heading"><div><p className="eyebrow">HIỆU SUẤT</p><h2>Sách bán chạy</h2></div><span className="data-period">Dữ liệu hệ thống</span></div>{bestSellers.length ? bestSellers.map((book) => <div className="admin-list-row" key={book.id}><span className="admin-row-index">{book.rank || '·'}</span><div><strong>{book.title}</strong><small>{book.author}</small></div><span>{book.sold ?? book.quantitySold ?? '—'} cuốn</span></div>) : <div className="admin-inline-empty">Chưa có dữ liệu sách bán chạy từ API.</div>}</section>
        <section className="admin-panel"><div className="admin-panel-heading"><div><p className="eyebrow">CẦN THEO DÕI</p><h2>Sắp hết hàng</h2></div><CircleAlert size={19} /></div>{lowStock.length ? lowStock.map((book) => <div className="admin-list-row" key={book.id}><div><strong>{book.title}</strong><small>{book.sku || book.id}</small></div><span className="stock-warning">{book.stock} còn lại</span></div>) : <div className="admin-inline-empty">Không có cảnh báo tồn kho.</div>}</section></div>
    </PageState>
  </div>;
}

const resources = {
  books: { title: 'Quản lý sách', description: 'Danh mục đầu sách đang được lưu trong BookShop.', fields: [['title', 'Tên sách'], ['author', 'Tác giả'], ['category', 'Danh mục'], ['price', 'Giá'], ['stock', 'Tồn kho'], ['status', 'Trạng thái']] },
  categories: { title: 'Quản lý danh mục', description: 'Sắp xếp và theo dõi các nhóm sách.', fields: [['name', 'Tên danh mục'], ['slug', 'Đường dẫn'], ['bookCount', 'Số đầu sách'], ['status', 'Trạng thái']] },
  orders: { title: 'Quản lý đơn hàng', description: 'Theo dõi trạng thái và thông tin các đơn đặt hàng.', fields: [['orderNumber', 'Mã đơn'], ['customerName', 'Khách hàng'], ['createdAt', 'Ngày đặt'], ['total', 'Tổng tiền'], ['orderStatus', 'Trạng thái']] },
  customers: { title: 'Khách hàng', description: 'Thông tin tài khoản và hoạt động mua sắm.', fields: [['name', 'Khách hàng'], ['email', 'Email'], ['phone', 'Điện thoại'], ['points', 'Điểm'], ['membershipLevel', 'Hạng']] },
  reviews: { title: 'Đánh giá', description: 'Nội dung đánh giá do khách hàng gửi lên.', fields: [['bookTitle', 'Sách'], ['customerName', 'Khách hàng'], ['rating', 'Điểm'], ['comment', 'Nhận xét'], ['createdAt', 'Ngày gửi']] },
  promotions: { title: 'Khuyến mãi', description: 'Mã ưu đãi và chương trình giảm giá.', fields: [['code', 'Mã'], ['name', 'Tên chương trình'], ['discountType', 'Loại'], ['discountValue', 'Giá trị'], ['status', 'Trạng thái']] },
  giftCards: { title: 'Thẻ quà tặng', description: 'Giá trị còn lại và trạng thái thẻ quà tặng.', fields: [['code', 'Mã thẻ'], ['initialValue', 'Giá trị ban đầu'], ['balance', 'Số dư'], ['expiresAt', 'Ngày hết hạn'], ['status', 'Trạng thái']] },
  gifts: { title: 'Quà tặng', description: 'Quà đổi điểm và số lượng tồn kho.', fields: [['name', 'Tên quà'], ['pointsCost', 'Điểm đổi'], ['stock', 'Tồn kho'], ['status', 'Trạng thái']] },
  membership: { title: 'Thành viên', description: 'Hạng thành viên, ngưỡng điểm và quyền lợi.', fields: [['name', 'Hạng'], ['level', 'Mã hạng'], ['minPoints', 'Điểm tối thiểu'], ['description', 'Quyền lợi'], ['status', 'Trạng thái']] },
  reports: { title: 'Báo cáo', description: 'Số liệu tổng hợp được cung cấp bởi API quản trị.', fields: [['period', 'Kỳ báo cáo'], ['revenue', 'Doanh thu'], ['orders', 'Đơn hàng'], ['averageOrderValue', 'Giá trị trung bình'], ['createdAt', 'Cập nhật']] },
};

function displayValue(value, field) {
  if (value == null || value === '') return '—';
  if (['price', 'total', 'revenue', 'averageOrderValue', 'initialValue', 'balance'].includes(field)) return formatCurrency(value);
  if (field === 'createdAt' || field === 'expiresAt') return formatDate(value);
  if (typeof value === 'object') return value.name ?? value.title ?? '—';
  return String(value);
}

function RevenueChart({ rows }) {
  if (!rows.length) return <div className="admin-inline-empty">Chưa có dữ liệu doanh thu để vẽ biểu đồ.</div>;
  const values = rows.map((row) => Number(row.revenue ?? row.value ?? 0));
  const max = Math.max(...values, 1);
  const points = values.map((value, index) => {
    const x = rows.length === 1 ? 300 : 20 + (index / (rows.length - 1)) * 560;
    const y = 145 - (value / max) * 125;
    return [x, y];
  });
  const line = points.map(([x, y], i) => `${i ? 'L' : 'M'} ${x} ${y}`).join(' ');
  const area = `${line} L ${points.at(-1)[0]} 155 L ${points[0][0]} 155 Z`;
  return <div className="admin-chart"><svg viewBox="0 0 600 170" role="img" aria-label="Biểu đồ doanh thu"><path className="chart-grid-line" d="M15 20H585 M15 65H585 M15 110H585 M15 155H585" /><path className="chart-area" d={area} /><path className="chart-line" d={line} />{points.map(([x, y], index) => <circle className="chart-dot" key={index} cx={x} cy={y} r="3.5" />)}</svg><div className="chart-labels">{rows.map((row, index) => <span key={index}>{row.label || row.month || row.period || ''}</span>)}</div></div>;
}

function AdminResourcePage({ resource }) {
  const config = resources[resource];
  const [searchText, setSearchText] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRow, setEditingRow] = useState(null);
  const [detailOrder, setDetailOrder] = useState(null);
  const [toast, setToast] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const load = useCallback(() => adminService.resource(resource, { q: search || undefined, status: status || undefined, page, limit: 12 }), [resource, search, status, page]);
  const { data, loading, error, reload } = useApi(load, [resource, search, status, page]);
  const rows = asList(data?.items ?? data?.records ?? data);
  const createFields = {
    books: [['title', 'Tên sách'], ['author', 'Tác giả'], ['categoryId', 'Mã danh mục'], ['price', 'Giá'], ['discountPrice', 'Giá ưu đãi'], ['stock', 'Tồn kho'], ['description', 'Mô tả']],
    categories: [['name', 'Tên danh mục'], ['description', 'Mô tả']],
    promotions: [['code', 'Mã ưu đãi'], ['name', 'Tên chương trình'], ['discountType', 'PERCENTAGE hoặc FIXED_AMOUNT'], ['discountValue', 'Giá trị'], ['minOrderAmount', 'Đơn hàng tối thiểu'], ['startsAt', 'Bắt đầu (ISO)'], ['endsAt', 'Kết thúc (ISO)'], ['usageLimit', 'Giới hạn lượt dùng']],
    membership: [['level', 'Mã hạng'], ['name', 'Tên hạng'], ['minPoints', 'Điểm tối thiểu'], ['description', 'Mô tả']],
    giftCards: [['code', 'Mã thẻ'], ['initialValue', 'Giá trị ban đầu'], ['balance', 'Số dư'], ['expiresAt', 'Ngày hết hạn']],
    gifts: [['name', 'Tên quà'], ['description', 'Mô tả'], ['pointsCost', 'Điểm đổi'], ['stock', 'Tồn kho'], ['imageUrl', 'URL ảnh']],
  }[resource] || [];
  async function createRecord(event) {
    event.preventDefault(); setSaving(true);
    try {
      const payload = { ...form };
      for (const key of ['price', 'discountPrice', 'discountValue', 'stock', 'minPoints', 'minOrderAmount', 'usageLimit', 'initialValue', 'balance', 'pointsCost']) if (payload[key] !== undefined && payload[key] !== '') payload[key] = Number(payload[key]);
      if (payload.discountPrice === '') payload.discountPrice = null;
      for (const key of ['minOrderAmount', 'usageLimit', 'balance', 'expiresAt']) if (payload[key] === '') delete payload[key];
      if (payload.imageUrl === '') payload.imageUrl = null;
      if (editingRow) await adminService.update(resource, editingRow.id, payload);
      else await adminService.create(resource, payload);
      setModalOpen(false); setEditingRow(null); setForm({}); setToast({ message: editingRow ? 'Đã cập nhật bản ghi.' : 'Đã tạo bản ghi.', type: 'success' }); await reload();
    } catch (requestError) { setToast({ message: requestError?.response?.data?.message || requestError.message || 'Không thể lưu bản ghi.', type: 'error' }); }
    finally { setSaving(false); }
  }
  async function performRowAction(row, action) {
    try {
      if (action === 'edit') {
        setEditingRow(row);
        setForm({ ...row, startsAt: row.startsAt ? new Date(row.startsAt).toISOString().slice(0, 16) : '', endsAt: row.endsAt ? new Date(row.endsAt).toISOString().slice(0, 16) : '', expiresAt: row.expiresAt ? new Date(row.expiresAt).toISOString().slice(0, 10) : '' });
        setModalOpen(true);
        return;
      }
      if (action === 'details') {
        const response = await adminService.orderDetails(row.id);
        setDetailOrder(response.data?.data ?? response.data);
        return;
      }
      if (action === 'delete') {
        if (!window.confirm('Bạn có chắc muốn xóa hoặc ẩn bản ghi này?')) return;
        await adminService.remove(resource, row.id);
      } else if (action === 'lock') await adminService.lockCustomer(row.id);
      else if (action === 'unlock') await adminService.unlockCustomer(row.id);
      else if (action === 'approve') await adminService.approveReview(row.id);
      else if (action === 'hide') await adminService.hideReview(row.id);
      else if (action === 'activate') await adminService.activatePromotion(row.id);
      else if (action === 'deactivate') await adminService.deactivatePromotion(row.id);
      else if (action.startsWith('order:')) await adminService.updateOrderStatus(row.id, action.slice(6));
      setToast({ message: 'Đã cập nhật dữ liệu.', type: 'success' });
      await reload();
    } catch (requestError) {
      setToast({ message: requestError?.response?.data?.message || requestError.message || 'Không thể cập nhật dữ liệu.', type: 'error' });
    }
  }
  return <div className="admin-page"><AdminTitle title={config.title} description={config.description} />
    <section className="admin-panel resource-panel"><div className="admin-panel-heading"><div><p className="eyebrow">DỮ LIỆU BOOKSHOP</p><h2>{config.title}</h2></div><div className="resource-heading-actions"><span className="data-period">{loading ? 'Đang tải…' : `${data?.total ?? rows.length} bản ghi`}</span>{createFields.length > 0 && <button className="button button-primary" onClick={() => { setForm({}); setModalOpen(true); }}>Thêm mới</button>}</div></div>
      <form className="admin-resource-tools" onSubmit={(event) => { event.preventDefault(); setPage(1); setSearch(searchText.trim()); }}><input value={searchText} onChange={(event) => setSearchText(event.target.value)} placeholder={`Tìm trong ${config.title.toLowerCase()}…`} aria-label="Tìm kiếm" /><select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }} aria-label="Lọc trạng thái"><option value="">Mọi trạng thái</option><option value="ACTIVE">Đang hoạt động</option><option value="INACTIVE">Tạm ẩn</option></select><button className="button button-outline" type="submit">Tìm kiếm</button></form>
      <PageState loading={loading} error={error} empty={!loading && !error && !rows.length ? 'API chưa trả về dữ liệu cho mục này.' : null}>
        {rows.length > 0 && <div className="table-scroll"><table className="admin-table"><thead><tr>{config.fields.map(([field, label]) => <th key={field}>{label}</th>)}<th>Thao tác</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id || row.orderNumber}>{config.fields.map(([field]) => <td key={field}>{displayValue(row[field] ?? (field === 'bookTitle' ? row.book?.title : field === 'customerName' ? row.user?.name : undefined), field)}</td>)}<td><div className="admin-row-actions">
          {['books', 'categories', 'promotions', 'membership', 'giftCards', 'gifts'].includes(resource) && <><button type="button" onClick={() => performRowAction(row, 'edit')}>Sửa</button><button type="button" onClick={() => performRowAction(row, 'delete')}>Xóa/ẩn</button></>}
          {resource === 'orders' && <><button type="button" onClick={() => performRowAction(row, 'details')}>Chi tiết</button><select aria-label={`Trạng thái đơn ${row.orderNumber}`} value={row.orderStatus} onChange={(event) => performRowAction(row, `order:${event.target.value}`)}>{['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPING', 'DELIVERED', 'CANCELLED'].map((value) => <option key={value} value={value}>{value}</option>)}</select></>}
          {resource === 'customers' && <button type="button" onClick={() => performRowAction(row, row.status === 'INACTIVE' ? 'unlock' : 'lock')}>{row.status === 'INACTIVE' ? 'Mở khóa' : 'Khóa'}</button>}
          {resource === 'reviews' && <><button type="button" onClick={() => performRowAction(row, 'approve')}>Duyệt</button><button type="button" onClick={() => performRowAction(row, 'hide')}>Ẩn</button><button type="button" onClick={() => performRowAction(row, 'delete')}>Xóa</button></>}
          {resource === 'promotions' && <button type="button" onClick={() => performRowAction(row, row.status === 'ACTIVE' ? 'deactivate' : 'activate')}>{row.status === 'ACTIVE' ? 'Tắt' : 'Bật'}</button>}
        </div></td></tr>)}</tbody></table></div>}
      </PageState>
      {(Number(data?.totalPages) > 1 || page > 1) && <div className="admin-pagination"><button disabled={page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>← Trước</button><span>Trang {page}{data?.totalPages ? ` / ${data.totalPages}` : ''}</span><button disabled={data?.totalPages ? page >= Number(data.totalPages) : rows.length < 12} onClick={() => setPage((current) => current + 1)}>Tiếp →</button></div>}
    </section>
    {modalOpen && <div className="admin-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) { setModalOpen(false); setEditingRow(null); } }}><section className="admin-modal" role="dialog" aria-modal="true" aria-labelledby="admin-modal-title"><div className="admin-modal-heading"><div><h2 id="admin-modal-title">{editingRow ? 'Sửa' : 'Thêm'} {config.title.toLowerCase()}</h2><p>Thông tin sẽ được lưu qua API quản trị.</p></div><button onClick={() => { setModalOpen(false); setEditingRow(null); }} aria-label="Đóng">×</button></div><form className="form-stack" onSubmit={createRecord}>{createFields.map(([key, label]) => <label key={key}>{label}<input required={!['discountPrice', 'description', 'minOrderAmount', 'usageLimit', 'balance', 'expiresAt', 'imageUrl'].includes(key)} type={key === 'expiresAt' ? 'date' : ['price', 'discountPrice', 'discountValue', 'stock', 'minPoints', 'minOrderAmount', 'usageLimit', 'initialValue', 'balance', 'pointsCost'].includes(key) ? 'number' : 'text'} min={['price', 'discountPrice', 'discountValue', 'stock', 'minPoints', 'minOrderAmount', 'usageLimit', 'initialValue', 'balance', 'pointsCost'].includes(key) ? '0' : undefined} value={form[key] ?? ''} onChange={(event) => setForm((current) => ({ ...current, [key]: event.target.value }))} /></label>)}{resource === 'books' && editingRow && <BookImageUpload bookId={editingRow.id} value={form.image ?? editingRow.image} onChange={(image) => setForm((current) => ({ ...current, image }))} disabled={saving} />}<div className="modal-actions"><button type="button" className="button button-outline" onClick={() => { setModalOpen(false); setEditingRow(null); }}>Hủy</button><button className="button button-primary" disabled={saving}>{saving ? 'Đang lưu…' : 'Lưu thay đổi'}</button></div></form></section></div>}
    {detailOrder && <div className="admin-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setDetailOrder(null); }}><section className="admin-modal" role="dialog" aria-modal="true" aria-labelledby="order-detail-title"><div className="admin-modal-heading"><div><h2 id="order-detail-title">Đơn {detailOrder.orderNumber}</h2><p>{detailOrder.user?.name} · {detailOrder.user?.email}</p></div><button type="button" onClick={() => setDetailOrder(null)} aria-label="Đóng">×</button></div><p>Giao đến: {detailOrder.shippingAddress}</p><p>Trạng thái: {detailOrder.orderStatus} · Thanh toán: {detailOrder.paymentStatus}</p><div className="admin-order-lines">{asList(detailOrder.items).map((item) => <div key={item.id}><span>{item.title} × {item.quantity}</span><strong>{formatCurrency(item.subtotal)}</strong></div>)}</div><p className="summary-total">Tổng đơn hàng: {formatCurrency(detailOrder.total)}</p></section></div>}
    <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
  </div>;
}

export function AdminBooks() { return <AdminResourcePage resource="books" />; }
export function AdminCategories() { return <AdminResourcePage resource="categories" />; }
export function AdminOrders() { return <AdminResourcePage resource="orders" />; }
export function AdminCustomers() { return <AdminResourcePage resource="customers" />; }
export function AdminReviews() { return <AdminResourcePage resource="reviews" />; }
export function AdminPromotions() { return <AdminResourcePage resource="promotions" />; }
export function AdminMembership() { return <AdminResourcePage resource="membership" />; }
export function AdminReports() { return <AdminResourcePage resource="reports" />; }
export function AdminGiftCards() { return <AdminResourcePage resource="giftCards" />; }
export function AdminGifts() { return <AdminResourcePage resource="gifts" />; }

