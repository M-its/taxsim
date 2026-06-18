import { cva, type VariantProps } from "class-variance-authority"
import * as React from "react"

import { cn } from "@/lib/utils"

const inputVariants = cva(
  "flex w-full rounded-none border bg-[#18181b] px-3 py-2 text-sm text-[#fafafa] transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-[#a1a1aa] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#34d399]/50 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "border-[#27272a] focus-visible:border-[#34d399]",
        ghost: "border-transparent bg-transparent focus-visible:bg-[#18181b] focus-visible:border-[#27272a]",
        error: "border-[#f87171] focus-visible:border-[#f87171] focus-visible:ring-[#f87171]/50",
      },
      size: {
        default: "h-9",
        sm: "h-8 px-2.5 text-xs",
        lg: "h-10 px-4",
      },
      hasStartIcon: {
        true: "pl-9",
        false: "",
      },
      hasEndIcon: {
        true: "pr-9",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      hasStartIcon: false,
      hasEndIcon: false,
    },
  }
)

interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement>,
    VariantProps<typeof inputVariants> {
  startIcon?: React.ReactNode
  endIcon?: React.ReactNode
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, variant, size, startIcon, endIcon, ...props }, ref) => {
    return (
      <div className="relative flex w-full items-center">
        {startIcon && (
          <span className="absolute left-3 flex items-center justify-center text-[#a1a1aa] pointer-events-none">
            {startIcon}
          </span>
        )}
        <input
          data-slot="input"
          ref={ref}
          className={cn(
            inputVariants({
              variant,
              size,
              hasStartIcon: !!startIcon,
              hasEndIcon: !!endIcon,
              className,
            })
          )}
          {...props}
        />
        {endIcon && (
          <span className="absolute right-3 flex items-center justify-center text-[#a1a1aa] pointer-events-none">
            {endIcon}
          </span>
        )}
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input, inputVariants }
