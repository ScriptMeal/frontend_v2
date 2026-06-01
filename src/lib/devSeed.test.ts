import { describe, it, expect, beforeEach } from 'vitest'
import { QueryClient } from '@tanstack/react-query'
import { seedDevData } from './devSeed'
import {
  mockSessions,
  mockHistoryBySession,
  DEMO_ERROR_SESSION_ID,
} from '@/api/mock/mockHistory'
import { useSessionStore } from '@/store/sessionStore'

beforeEach(() => {
  useSessionStore.setState({ sessions: [] })
})

describe('seedDevData', () => {
  it('mock 세션 3~5개를 사이드바 목록에 시드한다 (happy)', () => {
    seedDevData(new QueryClient())
    const { sessions } = useSessionStore.getState()
    expect(sessions).toEqual(mockSessions)
    expect(sessions.length).toBeGreaterThanOrEqual(3)
    expect(sessions.length).toBeLessThanOrEqual(5)
  })

  it('기록이 있는 세션만 Query 캐시에 시드한다 (happy)', () => {
    const qc = new QueryClient()
    seedDevData(qc)
    for (const id of Object.keys(mockHistoryBySession)) {
      expect(qc.getQueryData(['history', id])).toEqual(mockHistoryBySession[id])
    }
  })

  it('로드 실패 데모 세션은 사이드바엔 있으나 캐시엔 시드하지 않는다 (edge)', () => {
    const qc = new QueryClient()
    seedDevData(qc)
    expect(useSessionStore.getState().sessions.map((s) => s.id)).toContain(
      DEMO_ERROR_SESSION_ID,
    )
    expect(qc.getQueryData(['history', DEMO_ERROR_SESSION_ID])).toBeUndefined()
  })

  it('세션마다 서로 다른 기록을 시드한다 (edge)', () => {
    const qc = new QueryClient()
    seedDevData(qc)
    const first = qc.getQueryData(['history', mockSessions[0].id])
    const second = qc.getQueryData(['history', mockSessions[1].id])
    expect(first).not.toEqual(second)
  })
})
