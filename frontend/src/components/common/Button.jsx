import { forwardRef } from 'react';

const variantClasses = {
  primary:
    'btn-3d-teal active:translate-y-0.5',
  secondary:
    'bg-bg-elevated hover:bg-bg-overlay text-c2 border border-c4 shadow-[0_2px_0_0_color-mix(in_srgb,var(--theme-c4)_70%,black)] hover:border-c1 active:translate-y-0.5',
  danger:
    'btn-3d-danger active:translate-y-0.5',
  ghost:
    'bg-transparent hover:bg-bg-overlay text-text-secondary hover:text-text-primary border border-transparent',
  outline:
    'bg-transparent hover:bg-bg-elevated text-c2 border border-c4 hover:border-c1 active:translate-y-0.5',
  emerald:
    'btn-3d-teal active:translate-y-0.5',
  teal:
    'btn-3d-teal active:translate-y-0.5',
  lime:
    'btn-3d-gold active:translate-y-0.5',
  gold:
    'btn-3d-gold active:translate-y-0.5',
  champagne:
    'btn-3d-gold active:translate-y-0.5',
  wine:
    'bg-c4 hover:bg-c4/80 text-text-primary font-semibold border border-c4 shadow-[0_2px_0_0_black] active:translate-y-0.5',
  maroon:
    'bg-c4 hover:bg-c4/80 text-text-primary font-semibold border border-c4 shadow-[0_2px_0_0_black] active:translate-y-0.5',
  plum:
    'bg-c4 hover:bg-c4/80 text-text-primary font-semibold border border-c4 shadow-[0_2px_0_0_black] active:translate-y-0.5',
};

const sizeClasses = {
  xs: 'px-2 py-1 text-xs gap-1',
  sm: 'px-3 py-1.5 text-sm gap-1.5',
  md: 'px-4 py-2 text-sm gap-2',
  lg: 'px-5 py-2.5 text-base gap-2',
};

/**
 * @param {Object} props
 * @param {'primary'|'secondary'|'danger'|'ghost'|'outline'|'emerald'|'teal'|'gold'|'wine'} [props.variant]
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
        'focus-visible:outline-2 focus-visible:outline-c1 focus-visible:outline-offset-2',
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
