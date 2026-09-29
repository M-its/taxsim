import { cn } from '@/lib/utils'

interface AsyncStatusProps {
  message: string
  assertive?: boolean
  className?: string
}

export function AsyncStatus({ message, assertive = false, className }: AsyncStatusProps) {
  return (
    <p
      role={assertive ? 'alert' : 'status'}
      aria-live={assertive ? 'assertive' : 'polite'}
      aria-atomic="true"
      className={cn('sr-only', className)}
    >
      {message}
    </p>
  )
}
