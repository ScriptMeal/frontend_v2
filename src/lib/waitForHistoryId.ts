import { useSessionStore } from '@/store/sessionStore'

/**
 * `saveHistory` 완료 전에 버튼을 누른 경우, historyId 가 스토어에 기록될 때까지
 * 50ms 간격으로 폴링하다가 확정되면 id 를 반환한다.
 *
 * - 즉시 있으면 첫 틱에 바로 resolve (폴링 비용 없음)
 * - saveHistory 실패 등으로 timeoutMs 안에 오지 않으면 null 반환
 */
export async function waitForHistoryId(
  index: number,
  timeoutMs = 10_000,
): Promise<number | null> {
  const start = Date.now()
  return new Promise((resolve) => {
    const tick = () => {
      const id = useSessionStore.getState().historyIds[index]
      if (id != null) return resolve(id)
      if (Date.now() - start >= timeoutMs) return resolve(null)
      setTimeout(tick, 50)
    }
    tick()
  })
}
