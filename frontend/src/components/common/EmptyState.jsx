import { Database } from 'lucide-react';

/**
 * @param {Object} props
 * @param {React.ReactNode} [props.icon]
 * @param {string} props.title
 * @param {string} [props.description]
 * @param {React.ReactNode} [props.action]
 */
export default function EmptyState({ icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="mb-4 text-[#565c75]">
        {icon || <Database size={32} strokeWidth={1.5} />}
      </div>
      <p className="text-sm font-medium text-[#8b91a8] mb-1">{title}</p>
      {description && (
        <p className="text-xs text-[#565c75] max-w-xs leading-relaxed">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
