export function Input({
  label,
  error,
  required,
  id,
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
      <input
        id={id}
        className={`form-control${error ? ' error' : ''} ${className}`}
        {...props}
      />
      {error && <span className="form-error">{error}</span>}
    </div>
  );
}
