interface Props {
  tool: string
}

// API_SPEC.md — tool_start 의 tool 값 → 권장 UI 메시지
const TOOL_MESSAGES: Record<string, string> = {
  get_diet_products: '🛒 관련 다이어트 제품 검색 중...',
  search_recipe: '🔍 레시피 웹 검색 중...',
  get_weather_recipe: '☀️ 날씨 정보 조회 중...',
}

export default function ToolIndicator({ tool }: Props) {
  const message = TOOL_MESSAGES[tool] ?? '응답 생성 중...'

  return (
    <div
      role="status"
      className="mr-auto inline-flex animate-pulse items-center rounded-sm bg-surface-strong px-2.5 py-1.5 text-xs text-muted-foreground"
    >
      {message}
    </div>
  )
}
