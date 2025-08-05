import clsx from 'clsx';

export default function GlassCard({ 
  children, 
  className = '', 
  ...props 
}) {
  return (
    <div
      className={clsx(
        'card',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}