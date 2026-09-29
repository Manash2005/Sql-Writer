import { forwardRef } from 'react';

const variantClasses = {
  primary:
    'bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-500 shadow-sm',
  secondary:
    'bg-[#1e2230] hover:bg-[#252a38] text-[#e8eaf0] border border-[#252a38] hover:border-[#363c55]',
  danger:
    'bg-red-600 hover:bg-red-500 text-white border border-red-500 shadow-sm',
  ghost:
    'bg-transparent hover:bg-[#1e2230] text-[#8b91a8] hover:text-[#e8eaf0] border border-transparent',
  outline:
    'bg-transparent hover:bg-[#1e2230] text-[#e8eaf0] border border-[#252a38] hover:border-[#4f46e5]',
  emerald:
    'bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-500 shadow-sm',
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
