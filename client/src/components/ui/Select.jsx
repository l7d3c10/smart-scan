export function Select({
  label,
  error,
  required,
  id,
  children,
  className = '',
  ...props
}) {
  return (
    <div className="form-group">
      {label && (
        <label className={`form-label${required ? ' form-label-required' : ''}`} htmlFor={id}>
          {label}
        </label>
      )}
      <select
        id={id}
        className={`form-control form-select${error ? ' error' : ''} ${className}`}
        {...props}
      >
        {children}
      </select>
      {error && <span className="form-error">{error}</span>}
    </div>
  );
}
