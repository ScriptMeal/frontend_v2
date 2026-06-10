import type { Intent } from '@/types'

/** 추천 질문 1건 — 봇 능력 노출용 intent 태그 포함(SPECIFIC_FOOD·GENERAL_RECIPE만). */
export interface SuggestedQuestion {
  text: string
  intent: Extract<Intent, 'SPECIFIC_FOOD' | 'GENERAL_RECIPE'>
}

/** 카테고리별 질문 풀 — 균형 추첨(pickSuggestions) 입력 구조. */
export interface SuggestionPool {
  /** 특정 음식 레시피 요청 (SPECIFIC_FOOD) */
  specificFood: string[]
  /** 날씨·조건 기반 추천 (GENERAL_RECIPE) */
  generalRecipe: string[]
}

/**
 * 홈 추천 질문 하드코딩 풀(백엔드 추천 API 도입 전 임시 데이터 소스).
 * 매 진입 시 specific 2 : general 1 고정 비율로 추첨(pickSuggestions)해 노출한다.
 * generalRecipe 의 중복("뭐 먹지?…" 등)은 의도된 것 — 노출 빈도를 높이기 위함.
 * 관련: .claude/decisions/20260604-home-suggested-questions.md
 */
export const suggestedQuestions: SuggestionPool = {
  specificFood: [
    '쿼터파운드치즈버거',
    '로제엽기떡볶이',
    '두바이쫀득쿠키',
    '뿌링클 다이어트 레시피 알려줘',
    '망고사고(Mango Sago, 양즈깐루) 레시피 알려줘',
    '감자칩 프링글스를 활용한 초코블럭프링글스 레시피 알려줘',
    '소금빵 다이어트 레시피 알려줘',
    '마라탕 다이어트 레시피 알려줘',
    '성심당 망고시루 다이어트 버전은 뭐야?',
    '성심당 딸기시루 다이어트 버전은 뭐야?',
    '김치찌개 다이어트 레시피 알려줘',
    '떡볶이 다이어트 레시피 알려줘',
    '짜장면 다이어트 레시피 알려줘',
    '순두부찌개 다이어트 레시피 알려줘',
    '갈비찜',
    '해물탕',
  ],
  // 중복은 의도된 빈도 가중 — 제거하지 말 것.
  generalRecipe: [
    '뭐 먹지? 추천해줘.',
    '뭐 먹지? 추천해줘.',
    '뭐 먹을까? 추천해줘.',
    '뭐 먹을까? 추천해줘.',
    '하루에 뭘 어떻게 먹어야 해?',
    '아침 점심 저녁 뭐 먹으면 좋아?',
    '살 안 찌는 메뉴 추천해줘.',
    '점심 메뉴 추천해줘',
    '저녁 메뉴 추천해줘',
    '살 빠지는 메뉴 추천해줘.',
  ],
}
