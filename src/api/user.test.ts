import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const mocks = vi.hoisted(() => ({
  post: vi.fn(),
  get: vi.fn(),
  del: vi.fn(),
}))

vi.mock('./client', () => ({
  default: { post: mocks.post, get: mocks.get, delete: mocks.del },
}))

import { saveHistory, saveFavorite, getHistory, deleteFavorite } from './user'

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
    })
    expect(mocks.post).toHaveBeenCalledWith('/api/favorites', expect.objectContaining({
      intent: 'GENERAL_RECIPE',
      recipe_reply: 'y',
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
