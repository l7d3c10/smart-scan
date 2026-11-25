import { forwardRef } from 'react';
import { Search } from 'lucide-react';

export const SearchInput = forwardRef(function SearchInput(
  { placeholder = 'Tìm kiếm...', value, onChange, className = '', id = 'global-search-input', ...props },
  ref
) {
  return (
    <div className={`search-input-wrapper ${className}`} style={{ width: '100%' }}>
      <span className="search-icon">
        <Search size={14} />
      </span>
      <input
        ref={ref}
        id={id}
        type="text"
        className="form-control"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        style={{ minWidth: 220, width: '100%' }}
        {...props}
      />
    </div>
  );
});
