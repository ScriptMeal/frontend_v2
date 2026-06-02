import { CalendarDays, CloudSun, Thermometer } from 'lucide-react'
import type { WeatherInfo } from '@/lib/parseRecipeReply'

interface Props {
  weather: WeatherInfo
}

// 흰 배경 + 헤어라인 테두리 + 잉크 텍스트. 색은 아이콘에서만(절제) — DESIGN.md §1
const chip =
  'inline-flex items-center gap-1 rounded-md border border-hairline bg-surface px-2 py-1 text-xs text-body-strong'

/**
 * GENERAL_RECIPE 응답 맨 앞의 📅 날짜/시간·날씨·기온 헤더를 칩으로 표시한다.
 * 칩별 아이콘에만 의미색을 입힌다(날짜=muted, 날씨=sky, 기온=amber).
 * 스트리밍 부분 수신으로 일부 필드가 비면 해당 칩은 생략한다.
 */
export default function WeatherHeader({ weather }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className={chip}>
        <CalendarDays className="size-3.5 text-muted-foreground" aria-hidden />
        {weather.datetime}
      </span>
      {weather.weather && (
        <span className={chip}>
          <CloudSun className="size-3.5 text-sky-500" aria-hidden />
          {weather.weather}
        </span>
      )}
      {weather.temp && (
        <span className={chip}>
          <Thermometer className="size-3.5 text-amber-500" aria-hidden />
          {weather.temp}
        </span>
      )}
    </div>
  )
}
