import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const mocks = vi.hoisted(() => ({
  post: vi.fn(),
  get: vi.fn(),
  del: vi.fn(),
}))

vi.mock('./client', () => ({
  default: { post: mocks.post, get: mocks.get, delete: mocks.del },
}))

import { saveHistory, saveFavorite, getHistory, getFavorites, deleteFavorite } from './user'

beforeEach(() => {
  // favorites 는 DEV 에서 인메모리 mock 으로 분기하므로, 실제 client 계약 검증은 비-DEV 로 고정
  vi.stubEnv('DEV', false)
  mocks.post.mockReset().mockResolvedValue({ data: {} })
  mocks.get.mockReset().mockResolvedValue({ data: [] })
  mocks.del.mockReset().mockResolvedValue({ data: {} })
})

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('saveHistory', () => {
  it('recipe_reply + intent 필드로 저장한다 (happy)', async () => {
    await saveHistory({
      session_id: 's1',
      user_message: '떡볶이 먹고 싶어',
      recipe_reply: '## 다이어트 떡볶이',
      intent: 'SPECIFIC_FOOD',
    })

    expect(mocks.post).toHaveBeenCalledWith('/api/history', {
      session_id: 's1',
      user_message: '떡볶이 먹고 싶어',
      recipe_reply: '## 다이어트 떡볶이',
      intent: 'SPECIFIC_FOOD',
    })
  })

  it('레거시 필드 assistant_reply 를 전송하지 않는다 (edge)', async () => {
    await saveHistory({
      session_id: 's1',
      user_message: 'x',
      recipe_reply: 'y',
      intent: 'OFF_TOPIC',
    })

    const payload = mocks.post.mock.calls[0][1]
    expect(payload).not.toHaveProperty('assistant_reply')
  })
})

describe('saveFavorite', () => {
  it('history 와 동일한 구조로 저장한다', async () => {
    await saveFavorite({
      session_id: 's1',
      user_message: 'x',
      recipe_reply: 'y',
      intent: 'GENERAL_RECIPE',
      history_id: 5,
    })
    expect(mocks.post).toHaveBeenCalledWith('/api/favorites', expect.objectContaining({
      intent: 'GENERAL_RECIPE',
      recipe_reply: 'y',
      history_id: 5,
    }))
  })
})

describe('getHistory', () => {
  it('session_id 쿼리로 조회한다 (happy)', async () => {
    await getHistory('s1')
    expect(mocks.get).toHaveBeenCalledWith('/api/history', {
      params: { session_id: 's1' },
    })
  })

  it('서버 오류를 전파한다 (error)', async () => {
    mocks.get.mockRejectedValueOnce(new Error('500'))
    await expect(getHistory('s1')).rejects.toThrow('500')
  })
})

describe('deleteFavorite', () => {
  it('id 경로로 삭제 요청한다', async () => {
    await deleteFavorite(7)
    expect(mocks.del).toHaveBeenCalledWith('/api/favorites/7')
  })
})

// DEV 환경에서도 mock 으로 분기하지 않고 항상 실제 백엔드(client)를 호출해야 한다.
// (테스트용 mock 로직은 /dev 페이지로 일원화 — 실페이지 API 는 실제 서버만 호출)
describe('DEV 환경에서도 실제 client 를 호출한다', () => {
  beforeEach(() => {
    vi.stubEnv('DEV', true)
  })

  it('getFavorites 는 session_id 쿼리로 실제 GET 한다', async () => {
    await getFavorites('s1')
    expect(mocks.get).toHaveBeenCalledWith('/api/favorites', {
      params: { session_id: 's1' },
    })
  })

  it('saveFavorite 는 실제 POST 한다', async () => {
    await saveFavorite({
      session_id: 's1',
      user_message: 'x',
      recipe_reply: 'y',
      intent: 'OFF_TOPIC',
      history_id: 5,
    })
    expect(mocks.post).toHaveBeenCalledWith('/api/favorites', expect.any(Object))
  })

  it('deleteFavorite 는 실제 DELETE 한다', async () => {
    await deleteFavorite(7)
    expect(mocks.del).toHaveBeenCalledWith('/api/favorites/7')
  })

  it('getHistory 는 demo-error 세션이어도 실제 GET 한다(시뮬레이션 throw 없음)', async () => {
    await getHistory('demo-error')
    expect(mocks.get).toHaveBeenCalledWith('/api/history', {
      params: { session_id: 'demo-error' },
    })
  })
})
