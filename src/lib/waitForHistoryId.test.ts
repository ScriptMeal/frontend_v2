import { describe, it, expect, vi, afterEach } from 'vitest'
import { useSessionStore } from '@/store/sessionStore'

afterEach(() => {
  vi.useRealTimers()
  useSessionStore.setState({ historyIds: {} })
})

// waitForHistoryId 를 afterEach 이후에 import 하면 fake timer 간섭이 줄어든다.
// dynamic import 대신 vitest 의 importActual 을 사용해 모듈 캐시를 그대로 쓴다.
// (훅이 실제 Zustand store 를 직접 읽으므로 mock 없이 setState 로 상태를 제어한다.)
const { waitForHistoryId } = await import('./waitForHistoryId')

describe('waitForHistoryId', () => {
  it('historyId 가 이미 있으면 폴링 없이 즉시 반환한다 (happy)', async () => {
    useSessionStore.setState({ historyIds: { 3: 42 } })
    const result = await waitForHistoryId(3)
    expect(result).toBe(42)
  })

  it('historyId 가 지연돼 도착해도 폴링으로 기다린 뒤 반환한다 (happy)', async () => {
    vi.useFakeTimers()
    useSessionStore.setState({ historyIds: {} })

    const promise = waitForHistoryId(1, 5_000)

    // 첫 틱·두 번째 틱: historyId 없음
    await vi.advanceTimersByTimeAsync(100)
    // historyId 도착 → 다음 틱에서 resolve
    useSessionStore.setState({ historyIds: { 1: 99 } })
    await vi.advanceTimersByTimeAsync(60)

    const result = await promise
    expect(result).toBe(99)
  })

  it('타임아웃 내에 historyId 가 오지 않으면 null 을 반환한다 (error)', async () => {
    vi.useFakeTimers()
    useSessionStore.setState({ historyIds: {} })

    const promise = waitForHistoryId(1, 100)
    await vi.advanceTimersByTimeAsync(300)

    const result = await promise
    expect(result).toBeNull()
  })
})
