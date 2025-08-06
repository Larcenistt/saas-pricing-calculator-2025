import clsx from 'clsx';

export default function GlassCard({ children, className, ...props }) {
  return (
    <div 
      className={clsx(
        'glass-card backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 shadow-2xl',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}