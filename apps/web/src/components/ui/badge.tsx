import { cva, type VariantProps } from "class-variance-authority"
import * as React from "react"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-none border px-2 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[#34d399]/50",
  {
    variants: {
      variant: {
        default: "border-transparent bg-[#34d399]/10 text-[#34d399] hover:bg-[#34d399]/20",
        secondary: "border-transparent bg-[#27272a] text-[#fafafa] hover:bg-[#27272a]/80",
        outline: "border-[#27272a] text-[#fafafa] hover:bg-[#27272a]/50",
        destructive: "border-transparent bg-[#f87171]/10 text-[#f87171] hover:bg-[#f87171]/20",
        emerald: "border-transparent bg-[#34d399]/10 text-[#34d399] hover:bg-[#34d399]/20",
        amber: "border-transparent bg-[#facc15]/10 text-[#facc15] hover:bg-[#facc15]/20",
        red: "border-transparent bg-[#f87171]/10 text-[#f87171] hover:bg-[#f87171]/20",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div
      data-slot="badge"
      className={cn(badgeVariants({ variant, className }))}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
