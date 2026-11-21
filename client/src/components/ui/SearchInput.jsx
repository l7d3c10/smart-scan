import { Search } from 'lucide-react';

export function SearchInput({ placeholder = 'Tìm kiếm...', value, onChange, className = '' }) {
  return (
    <div className={`search-input-wrapper ${className}`}>
      <span className="search-icon">
        <Search size={14} />
      </span>
      <input
        type="text"
        className="form-control"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        style={{ minWidth: 220 }}
      />
    </div>
  );
}
