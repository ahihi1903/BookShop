import { useState } from 'react';
import { BookOpen } from 'lucide-react';
import { resolveImageUrl } from '../utils/catalog.js';

export default function BookCover({ book }) {
  const source = resolveImageUrl(book.image);
  const [failedSource, setFailedSource] = useState(null);
  if (book.image && source !== failedSource) {
    return <img src={source} alt={`Bìa sách ${book.title} — ${book.author}`} loading="lazy" decoding="async" onError={() => setFailedSource(source)} />;
  }
  return <span className="book-cover-fallback"><BookOpen size={26} /><strong>{book.title}</strong><span>{book.author}</span><small>Chưa có ảnh bìa</small></span>;
}
