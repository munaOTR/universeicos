import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@universe/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary-50 text-primary-700 hover:bg-primary-100",
        secondary:
          "border-transparent bg-zinc-100 text-zinc-900 hover:bg-zinc-200",
        destructive:
          "border-transparent bg-danger text-white hover:bg-danger/80",
        danger:
          "border-transparent bg-red-100 text-red-700",
        outline: "text-text",
        success: "border-transparent bg-emerald-100 text-emerald-800",
        warning: "border-transparent bg-amber-100 text-amber-800",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
