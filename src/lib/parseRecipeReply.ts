/** 📅 헤더에서 분리한 날짜/시간·날씨·기온 */
export interface WeatherInfo {
  datetime: string
  weather: string
  temp: string
}

/** 🛒 구매 정보 한 줄(name | detail | store) */
export interface PurchaseItem {
  name: string
  detail: string
  store: string
}

export interface ParsedReply {
  weather: WeatherInfo | null
  /** 날씨 헤더·구매 정보를 떼어낸 순수 마크다운 본문 */
  body: string
  purchase: PurchaseItem[]
}

const WEATHER_PREFIX = '📅'
const PURCHASE_MARKER = '🛒 사용된 제품 구매 정보'

/** `📅 현재 날짜/시간: X | 날씨: Y | 기온: Z` 한 줄을 필드로 분해. datetime 없으면 null */
function parseWeatherLine(line: string): WeatherInfo | null {
  const datetime = line.match(/현재 날짜\/시간:\s*([^|]+?)\s*(?:\||$)/)?.[1]?.trim()
  if (!datetime) return null
  const weather = line.match(/날씨:\s*([^|]+?)\s*(?:\||$)/)?.[1]?.trim() ?? ''
  const temp = line.match(/기온:\s*([^|]+?)\s*(?:\||$)/)?.[1]?.trim() ?? ''
  return { datetime, weather, temp }
}

/** 마커 이후 텍스트를 줄 단위 구매 항목으로 변환 */
function parsePurchaseItems(text: string): PurchaseItem[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [name = '', detail = '', store = ''] = line.split('|').map((s) => s.trim())
      return { name, detail, store }
    })
}

/**
 * 어시스턴트 응답 문자열에서 날씨 헤더(📅)·구매 정보(🛒)를 분리한다.
 * 마커가 없으면 본문 전체를 body 로 두므로 기존 마크다운 렌더와 동일하게 동작한다.
 * intent 없이 콘텐츠 마커만으로 판별 — 스트리밍/과거 조회 양쪽에서 일관되게 쓰인다.
 */
export function parseRecipeReply(content: string): ParsedReply {
  let body = content
  let weather: WeatherInfo | null = null
  let purchase: PurchaseItem[] = []

  // 1. 날씨 헤더 — 첫 줄이 📅 로 시작할 때만
  if (body.trimStart().startsWith(WEATHER_PREFIX)) {
    const newlineIdx = body.indexOf('\n')
    const headerLine = newlineIdx === -1 ? body : body.slice(0, newlineIdx)
    const parsed = parseWeatherLine(headerLine)
    if (parsed) {
      weather = parsed
      body = (newlineIdx === -1 ? '' : body.slice(newlineIdx + 1)).replace(/^\n+/, '')
    }
  }

  // 2. 구매 정보 — 🛒 마커 이후를 카드로, 앞의 --- 구분선은 본문에서 제거
  const markerIdx = body.indexOf(PURCHASE_MARKER)
  if (markerIdx !== -1) {
    const after = body.slice(markerIdx + PURCHASE_MARKER.length)
    body = body
      .slice(0, markerIdx)
      .replace(/\s*-{3,}\s*$/, '')
      .trimEnd()
    purchase = parsePurchaseItems(after)
  }

  return { weather, body, purchase }
}
