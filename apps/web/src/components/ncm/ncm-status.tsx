import type { NcmEligibilityStatus } from '@/lib/api'
import { getNcmStatusMessage } from '@/lib/ncm-eligibility'
import { cn } from '@/lib/utils'

export function NcmStatus({
  status,
  className,
}: {
  status: NcmEligibilityStatus
  className?: string
}) {
  return (
    <p
      className={cn(
        'text-xs',
        status === 'ELIGIBLE' && 'text-[#34d399]',
        status === 'NO_ACTIVE_RULE' && 'text-[#facc15]',
        status === 'CONFIGURATION_UNAVAILABLE' && 'text-[#fb923c]',
        status === 'NOT_CURRENT' && 'text-[#f59e0b]',
        status === 'NOT_FOUND' && 'text-[#f472b6]',
        status === 'INVALID_FORMAT' && 'text-[#f87171]',
        status === 'UNVERIFIED' && 'text-[#a1a1aa]',
        className,
      )}
    >
      {getNcmStatusMessage(status)}
    </p>
  )
}
