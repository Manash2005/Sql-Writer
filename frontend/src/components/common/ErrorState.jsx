import { AlertTriangle } from 'lucide-react';

/**
 * @param {Object} props
 * @param {string} props.title
 * @param {string} [props.description]
 * @param {React.ReactNode} [props.action]
 */
export default function ErrorState({ title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center border border-orange-500/20 bg-orange-500/5 rounded-xl">
      <div className="mb-4 text-orange-500">
        <AlertTriangle size={28} strokeWidth={1.5} />
      </div>
      <p className="text-sm font-semibold text-orange-500 mb-2">{title}</p>
      {description && (
        <p className="text-xs text-orange-200 max-w-sm leading-relaxed">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
