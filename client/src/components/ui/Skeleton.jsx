export function Skeleton({ width, height = 14, className = '', style = {} }) {
  return (
    <div
      className={`skeleton skeleton-text ${className}`}
      style={{ width, height, ...style }}
    />
  );
}

export function SkeletonRow({ cols = 7 }) {
  const widths = ['32px', '80px', '200px', '80px', '160px', '90px', '80px'];
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} style={{ padding: '0 16px', height: 48 }}>
          <Skeleton width={widths[i] || '80px'} />
        </td>
      ))}
    </tr>
  );
}
