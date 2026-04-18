interface SeverityBadgeProps {
  severity: 'critical' | 'high' | 'medium' | 'low';
  className?: string;
}

const config = {
  critical: { label: 'Critical', classes: 'bg-red-100 text-red-700 border-red-200' },
  high: { label: 'High', classes: 'bg-orange-100 text-orange-700 border-orange-200' },
  medium: { label: 'Medium', classes: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  low: { label: 'Low', classes: 'bg-blue-100 text-blue-600 border-blue-200' },
};

export default function SeverityBadge({ severity, className = '' }: SeverityBadgeProps) {
  const { label, classes } = config[severity];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${classes} ${className}`}>
      {label}
    </span>
  );
}
