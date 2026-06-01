import client from './client'
import type { HistoryRecord, FavoriteRecord } from '@/types'

export async function saveHistory(params: {
  session_id: string
  user_message: string
  assistant_reply: string
}) {
  await client.post('/api/history', params)
}

export async function getHistory(session_id: string): Promise<HistoryRecord[]> {
  const { data } = await client.get<HistoryRecord[]>('/api/history', {
    params: { session_id },
  })
  return data
}

export async function saveFavorite(params: {
  session_id: string
  user_message: string
  recipe_reply: string
}) {
  await client.post('/api/favorites', params)
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
