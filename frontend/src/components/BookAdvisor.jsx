import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, MessageCircle, RotateCcw, Send, X } from 'lucide-react';
import BookCover from './BookCover.jsx';
import { advisorService } from '../services/advisorService.js';
import { formatCurrency, getErrorMessage } from '../utils/apiData.js';
import { getEffectiveBookPrice } from '../utils/catalog.js';
import '../styles/advisor.css';

const welcome = { role: 'assistant', message: 'Chào bạn! Bạn có thể gửi tên sách, ISBN hoặc mã sách để tìm đúng cuốn mình muốn; hoặc cho tôi biết thể loại và ngân sách.', books: [] };

export default function BookAdvisor() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([welcome]);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const dialog = useRef(null);
  const input = useRef(null);
  const end = useRef(null);
  const pending = useRef(null);
  const history = useRef([]);
  useEffect(() => () => pending.current?.abort(), []);
  useEffect(() => {
    if (!open) return;
    const focus = document.activeElement;
    const overflow = document.body.style.overflow;
    dialog.current.showModal();
    document.body.style.overflow = 'hidden';
    input.current?.focus();
    return () => { dialog.current?.close(); document.body.style.overflow = overflow; focus?.focus(); };
  }, [open]);
  useEffect(() => { if (open) end.current?.scrollIntoView({ block: 'nearest' }); }, [messages, busy, open]);

  async function send(text = draft) {
    const message = text.trim();
    if (!message || pending.current) return;
    const controller = new AbortController();
    pending.current = controller;
    const nextHistory = [...history.current, message].slice(-8);
    setError(''); setBusy(true); setDraft('');
    setMessages((current) => [...current, { role: 'user', message }]);
    try {
      const result = await advisorService.reply(nextHistory, controller.signal);
      if (!result?.message || !Array.isArray(result.books)) throw new Error('Phản hồi tư vấn không hợp lệ.');
      history.current = nextHistory;
      setMessages((current) => [...current, { role: 'assistant', ...result }]);
    } catch (err) {
      if (!controller.signal.aborted) {
        setError(getErrorMessage(err)); setDraft(message);
        setMessages((current) => current.slice(0, -1));
      }
    } finally { if (pending.current === controller) { pending.current = null; setBusy(false); } }
  }
  function reset() {
    pending.current?.abort(); pending.current = null; history.current = [];
    setMessages([welcome]); setDraft(''); setError(''); setBusy(false); input.current?.focus();
  }
  return <>
    <button className="advisor-launcher" type="button" onClick={() => setOpen(true)} aria-label="Mở tư vấn chọn sách" aria-haspopup="dialog"><MessageCircle size={21} /><span>Tư vấn chọn sách</span></button>
    <dialog ref={dialog} className="advisor-dialog" aria-labelledby="advisor-title" onCancel={(event) => { event.preventDefault(); setOpen(false); }}>
      <header className="advisor-heading"><div><h2 id="advisor-title">Cùng bạn chọn sách</h2><p>Tìm theo tên, ISBN, thể loại & ngân sách</p></div><button type="button" className="icon-button" onClick={reset} aria-label="Bắt đầu tư vấn mới"><RotateCcw size={18} /></button><button type="button" className="icon-button" onClick={() => setOpen(false)} aria-label="Đóng tư vấn"><X size={20} /></button></header>
      <div className="advisor-messages" role="log" aria-live="polite" aria-relevant="additions" aria-label="Nội dung tư vấn">
        {messages.map((item, index) => <div className={`advisor-message advisor-${item.role}`} key={index}>
          <p>{item.message}</p>{item.criteria && <p className="advisor-criteria">Đang tìm: {item.criteria}</p>}
          {item.alternative && item.books?.length > 0 && <strong className="advisor-alternative">{item.alternativeLabel || 'Gợi ý thay thế'}</strong>}
          {item.books?.map((book) => <Link className="advisor-book" to={`/books/${book.slug || book.id}`} key={book.id} onClick={() => setOpen(false)}><BookCover book={book} /><div><strong>{book.title}</strong><span>{book.category?.name} · {book.author}</span><b>{formatCurrency(getEffectiveBookPrice(book))}</b>{book.stock <= 0 && <span>Tạm hết hàng</span>}<small>Xem sách <ArrowUpRight size={13} /></small></div></Link>)}
          {item.categories?.length > 0 && <div className="advisor-suggestions">{item.categories.map((name) => <button key={name} type="button" disabled={busy} onClick={() => send(`Tôi muốn sách thể loại ${name}`)}>{name}</button>)}</div>}
        </div>)}
        {messages.length === 1 && <div className="advisor-suggestions"><button type="button" disabled={busy} onClick={() => send('Sách thời trang tầm 800.000đ')}>Thời trang · khoảng 800.000đ</button><button type="button" disabled={busy} onClick={() => send('Sách không quá 500.000đ')}>Ngân sách dưới 500.000đ</button></div>}
        {busy && <p className="advisor-loading" role="status">Đang tìm trong kho sách…</p>}<div ref={end} />
      </div>
      <form className="advisor-form" onSubmit={(event) => { event.preventDefault(); send(); }}>
        {error && <p className="inline-error" role="alert">{error} Bạn có thể gửi lại yêu cầu.</p>}
        <label htmlFor="advisor-input">Bạn đang tìm cuốn sách như thế nào?</label>
        <div><input ref={input} id="advisor-input" value={draft} maxLength={500} disabled={busy} placeholder="Nhập tên sách, ISBN hoặc nhu cầu…" onChange={(event) => setDraft(event.target.value)} /><button type="submit" disabled={busy || !draft.trim()} aria-label="Gửi yêu cầu tư vấn"><Send size={18} /></button></div>
        <p>Tìm theo tên, ISBN, danh mục và giá hiện tại. “Tầm” được hiểu là ±20%. Giá và tồn kho có thể thay đổi.</p>
      </form>
    </dialog>
  </>;
}
