import client from './client'
import type { HistoryRecord, FavoriteRecord, SaveRecipePayload } from '@/types'
import { DEMO_ERROR_SESSION_ID } from './mock/mockHistory'
import { mockFavoritesStore } from './mock/mockFavorites'

export async function saveHistory(payload: SaveRecipePayload) {
  await client.post('/api/history', payload)
}

export async function getHistory(session_id: string): Promise<HistoryRecord[]> {
  // DEV 데모 전용 — 로드 실패 UI 확인용. 프로덕션 빌드에선 트리셰이킹된다.
  if (import.meta.env.DEV && session_id === DEMO_ERROR_SESSION_ID) {
    throw new Error('데모: 대화 기록 로드 실패 시뮬레이션')
  }
  const { data } = await client.get<HistoryRecord[]>('/api/history', {
    params: { session_id },
  })
  return data
}

// DEV 데모 전용 — 백엔드 없이 즐겨찾기 흐름을 시연한다(인메모리 mock). 프로덕션 트리셰이킹.
export async function saveFavorite(payload: SaveRecipePayload) {
  if (import.meta.env.DEV) {
    mockFavoritesStore.add(payload)
    return
  }
  await client.post('/api/favorites', payload)
}

export async function getFavorites(session_id: string): Promise<FavoriteRecord[]> {
  if (import.meta.env.DEV) {
    return mockFavoritesStore.list()
  }
  const { data } = await client.get<FavoriteRecord[]>('/api/favorites', {
    params: { session_id },
  })
  return data
}

export async function deleteFavorite(id: number) {
  if (import.meta.env.DEV) {
    mockFavoritesStore.remove(id)
    return
  }
  await client.delete(`/api/favorites/${id}`)
}
