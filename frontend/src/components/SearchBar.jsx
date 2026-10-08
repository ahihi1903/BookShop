import { Search } from 'lucide-react';

export default function SearchBar({ value, onChange, onSubmit, placeholder = 'Tìm tên sách, tác giả…' }) {
  return (
    <form className="search-bar" onSubmit={onSubmit} role="search">
      <Search size={18} aria-hidden="true" />
      <input value={value} onChange={onChange} placeholder={placeholder} aria-label="Tìm kiếm sách" />
      <button type="submit">Tìm sách</button>
    </form>
  );
}
