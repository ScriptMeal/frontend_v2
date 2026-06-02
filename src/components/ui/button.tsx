import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

// DESIGN.md §7 — pill 버튼 기본. Ink Pill이 유일한 프라이머리 CTA.
const buttonVariants = cva(
  "group/button inline-flex shrink-0 cursor-pointer items-center justify-center rounded-full border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none active:translate-y-px focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        // Ink Pill (Primary)
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        // Outline Pill (Secondary)
        outline:
          "border-chalk bg-transparent text-foreground hover:bg-secondary",
        // Filled surface-strong
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-surface-strong",
        // Ghost
        ghost: "text-muted-foreground hover:bg-secondary hover:text-foreground",
        // Accent (즐겨찾기·완료·태그)
        accent: "bg-accent text-accent-foreground hover:bg-accent/90",
        // Destructive — outline 변형
        destructive:
          "border-destructive/30 bg-transparent text-destructive hover:bg-destructive/10 focus-visible:ring-destructive/20",
        link: "text-foreground underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 gap-2 px-5",
        xs: "h-7 gap-1 px-3 text-xs [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1.5 px-4 text-[0.8rem] [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-11 gap-2 px-6 text-base",
        icon: "size-10",
        "icon-xs": "size-7 [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8",
        "icon-lg": "size-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
