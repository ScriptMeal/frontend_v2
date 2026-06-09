import client from './client'
import type { HistoryRecord, FavoriteRecord, SaveHistoryPayload, SaveFavoritePayload } from '@/types'

export async function saveHistory(payload: SaveHistoryPayload): Promise<HistoryRecord> {
  // 응답은 생성된 레코드(id 포함). 라이브 세션이 이 id 를 즐겨찾기 history_id 로 쓴다(API_SPEC §3).
  const { data } = await client.post<HistoryRecord>('/api/history', payload)
  return data
}

export async function getHistory(session_id: string): Promise<HistoryRecord[]> {
  const { data } = await client.get<HistoryRecord[]>('/api/history', {
    params: { session_id },
  })
  return data
}

export async function saveFavorite(payload: SaveFavoritePayload): Promise<FavoriteRecord> {
  // 성공 응답은 생성된 레코드(id·created_at 포함) — 토글 삭제에 쓸 id 를 호출부로 돌려준다.
  const { data } = await client.post<FavoriteRecord>('/api/favorites', payload)
  return data
}

export async function getFavorites(session_id: string): Promise<FavoriteRecord[]> {
  const { data } = await client.get<FavoriteRecord[]>('/api/favorites', {
    params: { session_id },
  })
  return data
}

export async function deleteFavorite(id: number) {
  await client.delete(`/api/favorites/${id}`)
}
