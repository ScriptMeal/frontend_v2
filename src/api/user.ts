import client from './client'
import type { HistoryRecord, FavoriteRecord, SaveRecipePayload } from '@/types'

export async function saveHistory(payload: SaveRecipePayload) {
  await client.post('/api/history', payload)
}

export async function getHistory(session_id: string): Promise<HistoryRecord[]> {
  const { data } = await client.get<HistoryRecord[]>('/api/history', {
    params: { session_id },
  })
  return data
}

export async function saveFavorite(payload: SaveRecipePayload) {
  await client.post('/api/favorites', payload)
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
