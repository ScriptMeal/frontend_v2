import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

/**
 * 로딩 자리표시용 베이스 블록.
 * DESIGN.md §8 "opacity 펄스" 언어에 맞춰 shimmer 대신 animate-pulse 만 사용한다.
 * 스크린리더에는 상위 컨테이너(role=status)가 안내하므로 블록 자체는 aria-hidden.
 */
export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden
      className={cn('animate-pulse rounded bg-surface-strong', className)}
      {...props}
    />
  )
}
