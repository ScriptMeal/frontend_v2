import type { FavoriteRecord, SaveRecipePayload } from '@/types'

/**
 * DEV 전용 — 백엔드(localhost:8000) 없이 즐겨찾기 저장→조회→삭제 흐름을 시연하기 위한
 * 인메모리 스토어. 단일 유저 데모이므로 session_id 와 무관하게 전역 리스트 하나를 쓴다.
 * `api/user.ts` 가 `import.meta.env.DEV` 에서 이 스토어로 분기한다(프로덕션 트리셰이킹).
 */

let nextId = 100

const seed: FavoriteRecord[] = [
  {
    id: 1,
    session_id: 'demo',
    user_message: '떡볶이 먹고 싶어',
    recipe_reply:
      '## 다이어트 떡볶이\n\n### 재료\n- 곤약 떡 200g (22kcal)\n- 저당 떡볶이양념 100g (55kcal)\n\n### 칼로리\n- 총 **117kcal**',
    intent: 'SPECIFIC_FOOD',
    created_at: '2026-06-01T16:00:00.000Z',
  },
  {
    id: 2,
    session_id: 'demo',
    user_message: '오늘 날씨에 맞는 메뉴 추천해줘',
    recipe_reply:
      '오늘처럼 따뜻한 날엔 **오이냉국**을 추천드려요.\n\n### 재료\n- 오이 1개 (14kcal)\n- 얼음물 300ml',
    intent: 'GENERAL_RECIPE',
    created_at: '2026-06-01T15:20:00.000Z',
  },
]

let favorites: FavoriteRecord[] = [...seed]

export const mockFavoritesStore = {
  /** 최신순 반환(API 와 동일) */
  list(): FavoriteRecord[] {
    return [...favorites].sort(
      (a, b) => Date.parse(b.created_at) - Date.parse(a.created_at),
    )
  },
  add(payload: SaveRecipePayload): FavoriteRecord {
    const record: FavoriteRecord = {
      ...payload,
      id: nextId++,
      created_at: new Date().toISOString(),
    }
    favorites = [record, ...favorites]
    return record
  },
  remove(id: number): void {
    favorites = favorites.filter((f) => f.id !== id)
  },
}
