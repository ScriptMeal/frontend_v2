import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type Variant = 'loading' | 'empty' | 'error'

interface Props {
  variant: Variant
  children: ReactNode
  className?: string
}

const TONE: Record<Variant, string> = {
  loading: 'text-muted-foreground',
  empty: 'text-muted-foreground',
  error: 'text-destructive',
}

/**
 * 로딩/빈/에러 상태를 일관된 톤·간격으로 보여주는 공통 메시지.
 * 에러는 `role=alert`, 로딩은 `role=status` 로 스크린리더에 알린다.
 */
export default function StateMessage({ variant, children, className }: Props) {
  return (
    <p
      role={variant === 'error' ? 'alert' : variant === 'loading' ? 'status' : undefined}
      className={cn(
        'px-4 py-12 text-center text-sm',
        TONE[variant],
        className,
      )}
    >
      {children}
    </p>
  )
}
