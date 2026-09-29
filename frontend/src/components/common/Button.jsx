import { forwardRef } from 'react';

const variantClasses = {
  primary:
    'bg-[#00B7CD] hover:bg-[#00c5dd] text-[#0f1118] font-semibold border border-[#00B7CD] shadow-[0_2px_0_0_#008494] active:translate-y-0.5',
  secondary:
    'bg-[#161922] hover:bg-[#1f2330] text-[#FFF1D1] border border-[#252a38] shadow-[0_2px_0_0_#0b0d12] hover:border-[#00B7CD]/40 active:translate-y-0.5',
  danger:
    'bg-[#DF301C] hover:bg-[#eb3a25] text-white font-semibold border border-[#DF301C] shadow-[0_2px_0_0_#9f2113] active:translate-y-0.5',
  ghost:
    'bg-transparent hover:bg-[#161922] text-[#8b91a8] hover:text-[#FFF1D1] border border-transparent',
  outline:
    'bg-transparent hover:bg-[#161922] text-[#FFF1D1] border border-[#252a38] hover:border-[#00B7CD] active:translate-y-0.5',
  emerald:
    'bg-[#B9D175] hover:bg-[#c5dc86] text-[#450C3F] font-bold border border-[#B9D175] shadow-[0_2px_0_0_#899e4f] active:translate-y-0.5',
  lime:
    'bg-[#B9D175] hover:bg-[#c5dc86] text-[#450C3F] font-bold border border-[#B9D175] shadow-[0_2px_0_0_#899e4f] active:translate-y-0.5',
  plum:
    'bg-[#450C3F] hover:bg-[#581050] text-[#FFF1D1] font-semibold border border-[#450C3F] shadow-[0_2px_0_0_#280725] active:translate-y-0.5',
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
