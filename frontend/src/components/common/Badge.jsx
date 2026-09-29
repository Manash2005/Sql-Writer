const variants = {
  indigo: 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20',
  violet: 'bg-violet-500/10 text-violet-400 border border-violet-500/20',
  emerald: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
  amber: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
  red: 'bg-red-500/10 text-red-400 border border-red-500/20',
  blue: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
  gray: 'bg-white/5 text-[#8b91a8] border border-[#252a38]',
};

const sizes = {
  sm: 'px-1.5 py-0.5 text-xs',
  md: 'px-2 py-0.5 text-xs',
  lg: 'px-2.5 py-1 text-sm',
};

/**
 * @param {Object} props
 * @param {'indigo'|'violet'|'emerald'|'amber'|'red'|'blue'|'gray'} [props.variant]
 * @param {'sm'|'md'|'lg'} [props.size]
 * @param {React.ReactNode} props.children
 * @param {string} [props.className]
 */
export default function Badge({ variant = 'gray', size = 'md', children, className = '' }) {
  return (
    <span
      className={[
        'inline-flex items-center gap-1 rounded font-mono font-medium uppercase tracking-wider',
        variants[variant] || variants.gray,
        sizes[size] || sizes.md,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </span>
  );
}
