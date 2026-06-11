import { describe, it, expect, vi, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useCoarsePointer } from './useCoarsePointer'

/**
 * 제어 가능한 가짜 matchMedia 를 설치한다(jsdom 은 matchMedia 미구현).
 * change 리스너를 보관해 테스트가 `emit(matches)` 로 변경을 흘려보낼 수 있다.
 */
function installMatchMedia(initial: boolean) {
  let matches = initial
  const listeners = new Set<(e: { matches: boolean }) => void>()
  const mql = {
    get matches() {
      return matches
    },
    media: '(pointer: coarse)',
    addEventListener: (_type: string, cb: (e: { matches: boolean }) => void) => listeners.add(cb),
    removeEventListener: (_type: string, cb: (e: { matches: boolean }) => void) =>
      listeners.delete(cb),
  }
  window.matchMedia = vi.fn().mockReturnValue(mql) as unknown as typeof window.matchMedia
  return {
    emit(next: boolean) {
      matches = next
      listeners.forEach((cb) => cb({ matches }))
    },
  }
}

afterEach(() => {
  // @ts-expect-error 테스트 격리 — 다음 테스트가 제 mock 을 설치한다
  delete window.matchMedia
})

describe('useCoarsePointer', () => {
  it('coarse 포인터면 true 를 반환한다 (happy)', () => {
    installMatchMedia(true)
    const { result } = renderHook(() => useCoarsePointer())
    expect(result.current).toBe(true)
  })

  it('fine 포인터면 false 를 반환한다 (happy)', () => {
    installMatchMedia(false)
    const { result } = renderHook(() => useCoarsePointer())
    expect(result.current).toBe(false)
  })

  it('포인터 환경이 바뀌면 change 이벤트로 갱신한다 (edge)', () => {
    const mm = installMatchMedia(false)
    const { result } = renderHook(() => useCoarsePointer())
    expect(result.current).toBe(false)

    act(() => mm.emit(true))
    expect(result.current).toBe(true)
  })

  it('matchMedia 가 없으면 false 로 폴백한다 (edge, 방어)', () => {
    // mock 미설치 상태 — SSR/구형 환경 방어
    const { result } = renderHook(() => useCoarsePointer())
    expect(result.current).toBe(false)
  })
})
