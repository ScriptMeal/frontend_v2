import type { FavoriteRecord, Intent } from '@/types'
import { mockScenarios } from '@/api/mock/mockChat'

/** 채팅 시나리오의 chunks + done 을 합쳐 실제 recipe_reply 형태(📅 헤더·🛒 구매 포함)로 복원 */
function replyOf(scenarioId: string): string {
  const s = mockScenarios.find((x) => x.id === scenarioId)
  if (!s) return ''
  return s.chunks.join('') + s.done
}

interface Seed {
  id: number
  scenarioId: string
  user_message: string
  intent: Intent
  created_at: string
}

// 워드 클라우드 너비 변주를 보기 위해 질문 길이를 짧게~길게 섞었다.
// scenarioId 로 응답 본문(📅 헤더·🛒 구매·일반)을 재사용한다.
const seedInputs: Omit<Seed, 'id' | 'created_at'>[] = [
  { scenarioId: 'specific-food', user_message: '떡볶이', intent: 'SPECIFIC_FOOD' },
  {
    scenarioId: 'weather-recipe',
    user_message: '오늘 날씨에 어울리는 점심 메뉴 추천해줘',
    intent: 'GENERAL_RECIPE',
  },
  { scenarioId: 'off-topic', user_message: '스플렌다가 뭐야?', intent: 'OFF_TOPIC' },
  {
    scenarioId: 'unfamiliar-food',
    user_message: '두바이 초콜릿 레시피',
    intent: 'SPECIFIC_FOOD',
  },
  { scenarioId: 'specific-food', user_message: '저칼로리 김밥', intent: 'SPECIFIC_FOOD' },
  {
    scenarioId: 'weather-recipe',
    user_message: '비 오는 날 따뜻하게 먹을 만한 다이어트식',
    intent: 'GENERAL_RECIPE',
  },
  { scenarioId: 'specific-food', user_message: '닭가슴살 요리', intent: 'SPECIFIC_FOOD' },
  { scenarioId: 'off-topic', user_message: '곤약은 칼로리 없어?', intent: 'OFF_TOPIC' },
  {
    scenarioId: 'unfamiliar-food',
    user_message: '단백질 브라우니 만드는 법 알려줘',
    intent: 'SPECIFIC_FOOD',
  },
  { scenarioId: 'specific-food', user_message: '저당 떡볶이', intent: 'SPECIFIC_FOOD' },
  {
    scenarioId: 'weather-recipe',
    user_message: '더운데 시원한 거',
    intent: 'GENERAL_RECIPE',
  },
  { scenarioId: 'specific-food', user_message: '두부면 파스타', intent: 'SPECIFIC_FOOD' },
  {
    scenarioId: 'off-topic',
    user_message: '아스파탐이랑 스테비아 차이가 뭐야?',
    intent: 'OFF_TOPIC',
  },
  { scenarioId: 'unfamiliar-food', user_message: '오트밀 쿠키', intent: 'SPECIFIC_FOOD' },
  {
    scenarioId: 'weather-recipe',
    user_message: '환절기에 먹기 좋은 든든한 한 끼 추천',
    intent: 'GENERAL_RECIPE',
  },
]

const seeds: Seed[] = seedInputs.map((input, index) => ({
  ...input,
  id: index + 1,
  // 30분 간격으로 과거로 내려가며 생성 시각 부여(최신순 정렬 확인용)
  created_at: new Date(Date.UTC(2026, 5, 2, 16, 0) - index * 30 * 60_000).toISOString(),
}))

/**
 * DEV 전용 — /dev/favorites 비교 데모용 즐겨찾기 시드.
 * 날씨 헤더(📅)·구매 정보(🛒)·일반 응답을 모두 포함해 RecipeContent 재사용을 검증한다.
 */
export const devFavoritesSeed: FavoriteRecord[] = seeds.map((seed) => ({
  id: seed.id,
  session_id: 'dev-session',
  user_message: seed.user_message,
  recipe_reply: replyOf(seed.scenarioId),
  intent: seed.intent,
  created_at: seed.created_at,
}))
