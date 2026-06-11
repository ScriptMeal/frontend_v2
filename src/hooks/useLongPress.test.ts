import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useLongPress } from './useLongPress'
import type { PointerEvent as ReactPointerEvent, MouseEvent as ReactMouseEvent } from 'react'

// 최소 형태의 포인터 이벤트 — 핸들러가 읽는 필드만 채운다.
function ptr(over: Partial<{ pointerType: string; clientX: number; clientY: number }> = {}) {
  return { pointerType: 'touch', clientX: 0, clientY: 0, ...over } as unknown as ReactPointerEvent
}

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

describe('useLongPress', () => {
  it('터치 후 delay 가 지나면 onLongPress 를 호출한다 (happy)', () => {
    const onLongPress = vi.fn()
    const { result } = renderHook(() => useLongPress(onLongPress, { delay: 500 }))

    act(() => result.current.onPointerDown(ptr({ clientX: 10, clientY: 10 })))
    expect(onLongPress).not.toHaveBeenCalled()
    act(() => void vi.advanceTimersByTime(500))
    expect(onLongPress).toHaveBeenCalledTimes(1)
  })

  it('delay 전에 손을 떼면 발화하지 않는다 (edge)', () => {
    const onLongPress = vi.fn()
    const { result } = renderHook(() => useLongPress(onLongPress, { delay: 500 }))

    act(() => result.current.onPointerDown(ptr()))
    act(() => void vi.advanceTimersByTime(300))
    act(() => result.current.onPointerUp())
    act(() => void vi.advanceTimersByTime(500))
    expect(onLongPress).not.toHaveBeenCalled()
  })

  it('threshold 이상 움직이면(스크롤) 취소한다 (edge)', () => {
    const onLongPress = vi.fn()
    const { result } = renderHook(() => useLongPress(onLongPress, { delay: 500, moveThreshold: 10 }))

    act(() => result.current.onPointerDown(ptr({ clientX: 0, clientY: 0 })))
    act(() => result.current.onPointerMove(ptr({ clientX: 0, clientY: 40 })))
    act(() => void vi.advanceTimersByTime(500))
    expect(onLongPress).not.toHaveBeenCalled()
  })

  it('마우스 포인터는 발화하지 않는다 (모바일 전용, edge)', () => {
    const onLongPress = vi.fn()
    const { result } = renderHook(() => useLongPress(onLongPress, { delay: 500 }))

    act(() => result.current.onPointerDown(ptr({ pointerType: 'mouse' })))
    act(() => void vi.advanceTimersByTime(500))
    expect(onLongPress).not.toHaveBeenCalled()
  })

  it('onContextMenu 는 네이티브 메뉴를 막는다 (edge)', () => {
    const { result } = renderHook(() => useLongPress(vi.fn()))
    const preventDefault = vi.fn()
    result.current.onContextMenu({ preventDefault } as unknown as ReactMouseEvent)
    expect(preventDefault).toHaveBeenCalled()
  })

  it('enabled=false 면 핸들러를 붙이지 않는다 (데스크톱, edge)', () => {
    const onLongPress = vi.fn()
    const { result } = renderHook(() => useLongPress(onLongPress, { enabled: false }))
    expect(Object.keys(result.current)).toHaveLength(0)
  })
})
