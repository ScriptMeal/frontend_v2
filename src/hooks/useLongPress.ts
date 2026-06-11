import { useCallback, useRef } from 'react'
import type { PointerEvent as ReactPointerEvent, MouseEvent as ReactMouseEvent } from 'react'

interface Options {
  /** 길게 누름으로 인정하는 시간(ms). 기본 500. */
  delay?: number
  /** 이 픽셀 이상 움직이면 스크롤/드래그로 보고 취소한다. 기본 10. */
  moveThreshold?: number
  /** false 면 빈 핸들러를 반환해 아무것도 부착하지 않는다(데스크톱). 기본 true. */
  enabled?: boolean
}

type Handlers = {
  onPointerDown: (e: ReactPointerEvent) => void
  onPointerMove: (e: ReactPointerEvent) => void
  onPointerUp: () => void
  onPointerLeave: () => void
  onContextMenu: (e: ReactMouseEvent) => void
}

/**
 * 터치 길게 누름(롱프레스) 감지 훅 — 반환한 핸들러 묶음을 대상 요소에 spread 한다.
 *
 * - 마우스(pointerType === 'mouse')는 무시한다(모바일 전용, 호출부에서 coarse 로도 거른다).
 * - 누른 채 `delay` 가 지나면 `onLongPress` 를 호출하고, 이동(threshold 초과)·뗌·이탈 시 취소한다.
 * - `onContextMenu` 로 네이티브 컨텍스트 메뉴/콜아웃을 억제한다.
 * - 훅이므로 한 컴포넌트당 1회만 호출한다(목록은 래퍼 컴포넌트로 감싸 인스턴스별로 호출).
 */
export function useLongPress(
  onLongPress: (e: ReactPointerEvent) => void,
  { delay = 500, moveThreshold = 10, enabled = true }: Options = {},
): Handlers | Record<string, never> {
  const timer = useRef<number | null>(null)
  const start = useRef<{ x: number; y: number } | null>(null)

  const clear = useCallback(() => {
    if (timer.current !== null) {
      clearTimeout(timer.current)
      timer.current = null
    }
    start.current = null
  }, [])

  const onPointerDown = useCallback(
    (e: ReactPointerEvent) => {
      if (e.pointerType === 'mouse') return
      start.current = { x: e.clientX, y: e.clientY }
      timer.current = window.setTimeout(() => {
        timer.current = null
        start.current = null
        onLongPress(e)
      }, delay)
    },
    [delay, onLongPress],
  )

  const onPointerMove = useCallback(
    (e: ReactPointerEvent) => {
      if (timer.current === null || !start.current) return
      const dx = Math.abs(e.clientX - start.current.x)
      const dy = Math.abs(e.clientY - start.current.y)
      if (dx > moveThreshold || dy > moveThreshold) clear()
    },
    [moveThreshold, clear],
  )

  const onContextMenu = useCallback((e: ReactMouseEvent) => {
    // 롱프레스 직후 뜨려는 네이티브 메뉴/텍스트 콜아웃을 막는다.
    e.preventDefault()
  }, [])

  if (!enabled) return {}
  return { onPointerDown, onPointerMove, onPointerUp: clear, onPointerLeave: clear, onContextMenu }
}
