import type { ChatRequest, HistoryRecord, SaveHistoryPayload, StreamEvent } from '@/types'

/**
 * 백엔드(localhost:8000) 없이 채팅 UI 로직을 눈으로 확인하기 위한 mock 스트림.
 * 실제 `streamChat` 과 동일한 시그니처(`AsyncGenerator<StreamEvent>`)이므로
 * `useStream({ streamChat: mockStreamChat })` 로 그대로 주입할 수 있다. (DEV 전용)
 */

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

interface MockScenario {
  id: string
  /** 데모 버튼 라벨 */
  label: string
  /** 버튼/매칭에 쓰는 예시 메시지 */
  message: string
  /** message 가 이 키워드 중 하나를 포함하면 이 시나리오로 응답 */
  keywords: string[]
  tools: string[]
  chunks: string[]
  done: string
  /** true 면 스트림 도중 예외를 던져 에러 UI 를 확인 */
  error?: boolean
}

export const mockScenarios: MockScenario[] = [
  {
    id: 'specific-food',
    label: '특정 음식 (떡볶이)',
    message: '떡볶이 먹고 싶어',
    keywords: ['떡볶이'],
    tools: ['get_diet_products'],
    chunks: [
      '## 다이어트 떡볶이\n\n',
      '### 재료\n- 곤약 떡 200g (22kcal)\n- 저당 떡볶이양념 100g (55kcal)\n- 어묵 50g (40kcal)\n\n',
      '### 조리법\n1. 곤약 떡을 물에 헹군다.\n2. 양념과 물 200ml를 넣고 끓인다.\n3. 어묵을 넣고 5분 더 졸인다.\n\n',
      '### 칼로리\n- 곤약 떡 + 양념 + 어묵 = **총 117kcal**\n',
    ],
    done: '\n\n---\n🛒 사용된 제품 구매 정보\n곤약 떡 22kcal | 약 180g 1개 899원 | 쿠팡\n저당 양념 55kcal | 100g 1,200원 | 마켓컬리',
  },
  {
    id: 'unfamiliar-food',
    label: '생소한 음식 (두바이 초콜릿)',
    message: '두바이 초콜릿 레시피 알려줘',
    keywords: ['두바이', '초콜릿'],
    tools: ['get_diet_products', 'search_recipe'],
    chunks: [
      '## 다이어트 두바이 초콜릿\n\n',
      '### 재료\n- 카다이프 50g (180kcal)\n- 무설탕 다크초콜릿 80g (320kcal)\n- 피스타치오버터 30g\n\n',
      '### 조리법\n1. 카다이프를 팬에 노릇하게 볶는다.\n2. 피스타치오버터와 섞는다.\n3. 녹인 다크초콜릿에 넣어 굳힌다.\n',
    ],
    done: '\n\n---\n🛒 사용된 제품 구매 정보\n무설탕 다크초콜릿 320kcal | 80g 3,900원 | 쿠팡',
  },
  {
    id: 'weather-recipe',
    label: '날씨 기반 추천',
    message: '오늘 날씨에 맞는 메뉴 추천해줘',
    keywords: ['날씨', '추천'],
    tools: ['get_weather_recipe'],
    chunks: [
      '📅 현재 날짜/시간: 2026년 06월 01일 16:02 | 날씨: 맑음 | 기온: 27.4°C\n\n',
      '오늘처럼 따뜻한 날엔 **오이냉국**을 추천드려요.\n\n',
      '### 재료\n- 오이 1개 (14kcal)\n- 식초·국간장 약간\n- 얼음물 300ml\n\n',
      '### 조리법\n1. 오이를 채 썬다.\n2. 식초·국간장으로 간한다.\n3. 얼음물을 붓는다.\n',
    ],
    done: '',
  },
  {
    id: 'off-topic',
    label: '후속/오프토픽 질문',
    message: '스플렌다가 뭐야?',
    keywords: ['스플렌다', '뭐야', '뭐임'],
    tools: [],
    chunks: [
      '스플렌다는 **수크랄로스** 기반의 설탕 대체 감미료예요. ',
      '칼로리가 거의 없어 다이어트 레시피에서 설탕 대신 자주 사용됩니다.',
    ],
    done: '',
  },
  {
    id: 'error',
    label: '에러 (스트림 실패)',
    message: '에러 테스트',
    keywords: ['에러', 'error'],
    tools: [],
    chunks: [],
    done: '',
    error: true,
  },
]

function pickScenario(message: string): MockScenario {
  const found = mockScenarios.find((scenario) =>
    scenario.keywords.some((keyword) => message.includes(keyword)),
  )
  // 매칭 실패 → 오프토픽 시나리오로 폴백
  return found ?? mockScenarios.find((s) => s.id === 'off-topic')!
}

interface MockOptions {
  /** 이벤트 간 지연(ms). UI 데모는 기본값, 테스트는 0 권장 */
  delayMs?: number
}

export async function* mockStreamChat(
  request: ChatRequest,
  options: MockOptions = {},
): AsyncGenerator<StreamEvent> {
  const { delayMs = 60 } = options
  const scenario = pickScenario(request.message)

  await delay(delayMs * 4)

  if (scenario.error) {
    throw new Error('목 스트림 강제 오류 (에러 UI 확인용)')
  }

  for (const tool of scenario.tools) {
    yield { type: 'tool_start', tool }
    await delay(delayMs * 6)
  }

  for (const value of scenario.chunks) {
    yield { type: 'chunk', value }
    await delay(delayMs)
  }

  yield { type: 'done', value: scenario.done }
}

/** 데모용 저장기 — 실제 saveHistory 대신 주입. 생성 레코드(증가 id)를 반환해 history_id 흐름을 재현한다. */
let mockHistoryId = 1000
export async function mockSaveHistory(payload: SaveHistoryPayload): Promise<HistoryRecord> {
  await delay(0)
  return { ...payload, id: mockHistoryId++, created_at: new Date().toISOString() }
}
