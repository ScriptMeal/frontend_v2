import { Loader2 } from 'lucide-react'

interface Props {
  /** 실행 중인 툴명. null/미지정이면 send 직후 기본 "응답 생성 중"을 표시한다. */
  tool?: string | null
}

// API_SPEC.md — tool_start 의 tool 값 → 권장 UI 메시지 (스피너·점 애니메이션이 앞뒤를 담당)
const TOOL_MESSAGES: Record<string, string> = {
  get_diet_products: '관련 다이어트 제품 검색 중',
  search_recipe: '레시피 웹 검색 중',
  get_weather_recipe: '날씨 정보 조회 중',
}

export default function ToolIndicator({ tool }: Props) {
  const message = (tool && TOOL_MESSAGES[tool]) || '응답 생성 중'

  return (
    <div
      role="status"
      className="tool-indicator mr-auto inline-flex items-center gap-1.5 text-xs text-muted-foreground"
    >
      <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
      <span>
        {message}
        {/* 점이 하나씩 누적됐다 한 번에 사라지는 루프 (장식 — 스크린리더는 메시지만 읽음) */}
        <span className="loading-dots" aria-hidden="true">
          <span>.</span>
          <span>.</span>
          <span>.</span>
        </span>
      </span>
    </div>
  )
}
