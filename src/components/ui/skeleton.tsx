import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

/**
 * 로딩 자리표시용 베이스 블록.
 * 회색 베이스(surface-strong) 위로 밝은 띠가 흐르는 shimmer(`.skeleton-shimmer`)를 입힌다.
 * shimmer 기구(position/overflow/::after)는 index.css 에 정의되어 있다.
 * 스크린리더에는 상위 컨테이너(role=status)가 안내하므로 블록 자체는 aria-hidden.
 */
export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden
      className={cn('skeleton-shimmer rounded bg-surface-strong', className)}
      {...props}
    />
  )
}
