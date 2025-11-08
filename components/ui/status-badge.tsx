import { cn } from '@/lib/utils'

interface StatusBadgeProps {
  status: 'approved' | 'paid' | 'pending' | 'completed' | 'open' | 'pending-approval' | 'pending-review'
  children: React.ReactNode
  className?: string
}

const statusStyles = {
  'approved': 'bg-green-500 text-white',
  'paid': 'bg-blue-400 text-white',
  'pending': 'bg-gray-300 text-gray-700',
  'completed': 'bg-green-100 text-green-700',
  'open': 'bg-green-100 text-green-700',
  'pending-approval': 'bg-gray-200 text-gray-700',
  'pending-review': 'bg-orange-500 text-white',
}

export function StatusBadge({ status, children, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        statusStyles[status],
        className
      )}
    >
      {children}
    </span>
  )
}

