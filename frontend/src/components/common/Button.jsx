import { forwardRef } from 'react';

const variantClasses = {
  primary:
    'bg-[#457B9D] hover:bg-[#4f8ab0] text-[#FFF8F0] font-semibold border border-[#5a92b5] shadow-[0_2px_0_0_#2e556e] active:translate-y-0.5',
  secondary:
    'bg-[#210d14] hover:bg-[#2b111a] text-[#FFF8F0] border border-[#8B1E2D] shadow-[0_2px_0_0_#53121b] hover:border-[#F4D35E]/50 active:translate-y-0.5',
  danger:
    'bg-[#E63946] hover:bg-[#ec4856] text-white font-semibold border border-[#ec5863] shadow-[0_2px_0_0_#a8242f] active:translate-y-0.5',
  ghost:
    'bg-transparent hover:bg-[#2b111a] text-[#e2d4cf] hover:text-[#FFF8F0] border border-transparent',
  outline:
    'bg-transparent hover:bg-[#210d14] text-[#FFF8F0] border border-[#8B1E2D] hover:border-[#F4D35E] active:translate-y-0.5',
  emerald:
    'bg-[#F4D35E] hover:bg-[#fae17f] text-[#0f0608] font-bold border border-[#fae28b] shadow-[0_2px_0_0_#c2a135] active:translate-y-0.5',
  lime:
    'bg-[#F4D35E] hover:bg-[#fae17f] text-[#0f0608] font-bold border border-[#fae28b] shadow-[0_2px_0_0_#c2a135] active:translate-y-0.5',
  gold:
    'bg-[#F4D35E] hover:bg-[#fae17f] text-[#0f0608] font-bold border border-[#fae28b] shadow-[0_2px_0_0_#c2a135] active:translate-y-0.5',
  wine:
    'bg-[#8B1E2D] hover:bg-[#a12335] text-[#FFF8F0] font-semibold border border-[#8B1E2D] shadow-[0_2px_0_0_#53121b] active:translate-y-0.5',
  plum:
    'bg-[#8B1E2D] hover:bg-[#a12335] text-[#FFF8F0] font-semibold border border-[#8B1E2D] shadow-[0_2px_0_0_#53121b] active:translate-y-0.5',
};

const sizeClasses = {
  xs: 'px-2 py-1 text-xs gap-1',
  sm: 'px-3 py-1.5 text-sm gap-1.5',
  md: 'px-4 py-2 text-sm gap-2',
  lg: 'px-5 py-2.5 text-base gap-2',
};

/**
 * @param {Object} props
 * @param {'primary'|'secondary'|'danger'|'ghost'|'outline'|'emerald'} [props.variant]
 * @param {'xs'|'sm'|'md'|'lg'} [props.size]
 * @param {boolean} [props.disabled]
 * @param {boolean} [props.loading]
 * @param {string} [props.className]
 * @param {React.ReactNode} [props.leftIcon]
 * @param {React.ReactNode} [props.rightIcon]
 * @param {React.ReactNode} props.children
 */
const Button = forwardRef(function Button(
  {
    variant = 'secondary',
    size = 'md',
    disabled = false,
    loading = false,
    className = '',
    leftIcon,
    rightIcon,
    children,
    ...rest
  },
  ref
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={[
        'inline-flex items-center justify-center font-medium rounded-md',
        'transition-colors duration-150',
        'focus-visible:outline-2 focus-visible:outline-indigo-500 focus-visible:outline-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variantClasses[variant] || variantClasses.secondary,
        sizeClasses[size] || sizeClasses.md,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...rest}
    >
      {loading ? (
        <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
      ) : leftIcon ? (
        <span className="shrink-0">{leftIcon}</span>
      ) : null}
      {children}
      {rightIcon && !loading && <span className="shrink-0">{rightIcon}</span>}
    </button>
  );
});

export default Button;
