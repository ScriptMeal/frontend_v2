import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { parseRecipeReply } from '@/lib/parseRecipeReply'
import { recipePreview } from '@/lib/recipePreview'
import type { FavoriteRecord } from '@/types'

interface Props {
  favorite: FavoriteRecord
  onOpen: (favorite: FavoriteRecord) => void
  onDelete: (id: number) => void
}

// DESIGN.md §2-5 대기 그라디언트 오브 (장식 전용, opacity 0.4 이하)
const ORB_VARIANTS = [
  'from-[#a7f3d0] to-[#6ee7b7]',
  'from-[#fed7aa] to-[#fca5a5]',
  'from-[#ddd6fe] to-[#c4b5fd]',
  'from-[#bae6fd] to-[#93c5fd]',
  'from-[#fecdd3] to-[#fda4af]',
]

function trunc(str: string, max: number): string {
  return str.length > max ? `${str.slice(0, max)}…` : str
}

// 재료 목록을 20자 이내 문자열로 만든다.
// 마지막 재료부터 하나씩 제외하고, 제외된 수는 "외 N개 재료"로 표기.
// 첫 번째 재료만 남았을 때도 20자를 초과하면 길이 제한 없이 그대로 표시한다.
function buildIngredientLabel(ingredients: string[]): string {
  if (ingredients.length === 0) return ''
  const total = ingredients.length
  for (let shown = total; shown >= 1; shown--) {
    const excluded = total - shown
    const label =
      excluded > 0
        ? `${ingredients.slice(0, shown).join(' · ')} 외 ${excluded}개 재료`
        : ingredients.join(' · ')
    if (label.length <= 20) return label
  }
  // 첫 번째 재료조차 20자 초과 → 제외 없이 그대로 표시
  return total > 1 ? `${ingredients[0]} 외 ${total - 1}개 재료` : ingredients[0]
}

function parseCardData(fav: FavoriteRecord) {
  const { body, purchase } = parseRecipeReply(fav.recipe_reply)

  // 요리명: ## 헤딩 → 첫 볼드(GENERAL_RECIPE) → null
  const titleFromHeading = body.match(/^##\s+(.+)/m)?.[1]?.trim() ?? null
  const titleFromBold =
    !titleFromHeading && fav.intent !== 'OFF_TOPIC'
      ? (body.match(/\*\*([^*]+)\*\*/)?.[1]?.trim() ?? null)
      : null
  const recipeTitle = titleFromHeading ?? titleFromBold
  // 요리명이 있으면 제목, user_message는 부제목. 없으면(OFF_TOPIC) user_message가 제목.
  const displayTitle = recipeTitle ?? fav.user_message
  const subtitle = recipeTitle ? fav.user_message : null

  // 총 칼로리: 명시적 합계 우선 → 없으면 재료 (Nkcal) 합산
  const explicitKcal =
    body.match(/총\s*\*{0,2}([\d,]+)\s*kcal/i)?.[1]?.replace(',', '') ?? null
  let kcal: string | null = explicitKcal
  if (!kcal) {
    const sum = (body.match(/\((\d+)kcal\)/g) ?? [])
      .map((m) => parseInt(m.replace(/\D/g, ''), 10))
      .reduce((a, b) => a + b, 0)
    if (sum > 0) kcal = String(sum)
  }

  // 재료 이름 추출: 수량(숫자 포함 토큰) 이전까지. 표시 길이는 buildIngredientLabel에서 제어.
  const ingredientSection = body.match(/###\s*재료\n([\s\S]*?)(?=\n###|\n##|$)/)?.[1] ?? ''
  const ingredients = ingredientSection
    .split('\n')
    .filter((line) => /^[-*]/.test(line))
    .map((line) => {
      const parts = line.replace(/^[-*]\s*/, '').split(' ')
      const quantityIdx = parts.findIndex((p) => /\d/.test(p))
      return (quantityIdx === -1 ? parts : parts.slice(0, quantityIdx)).join(' ').trim()
    })
    .filter(Boolean)

  return {
    displayTitle,
    subtitle,
    kcal,
    ingredients,
    firstPurchase: purchase[0] ?? null,
  }
}

export default function FavoriteHybridCard({ favorite, onOpen, onDelete }: Props) {
  const { displayTitle, subtitle, kcal, ingredients } = parseCardData(favorite)
  const preview = recipePreview(favorite.recipe_reply, 500)

  return (
    <article
      className="relative h-[200px] cursor-pointer overflow-hidden rounded-lg border border-hairline bg-surface shadow-lift transition-shadow hover:shadow-float"
      onClick={() => onOpen(favorite)}
    >
      {/* B안 오브 */}
      <span
        aria-hidden
        className={cn(
          'pointer-events-none absolute -right-6 -top-6 size-28 rounded-full bg-gradient-to-br opacity-35 blur-2xl',
          ORB_VARIANTS[favorite.id % ORB_VARIANTS.length],
        )}
      />

      <div className="relative flex h-full flex-col p-4">
        {/* 헤더: 요리명(제목) + 질문(부제목) + 삭제 */}
        <div className="flex items-start gap-2">
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <p className="line-clamp-2 text-[17px] font-semibold leading-snug text-body-strong">
              {displayTitle}
            </p>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{trunc(subtitle, 30)}</p>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label="즐겨찾기 삭제"
            onClick={(e) => {
              e.stopPropagation()
              onDelete(favorite.id)
            }}
          >
            <Trash2 className="text-muted-foreground" />
          </Button>
        </div>

        {/* 구분선 — 제목 바로 아래 */}
        <hr className="mt-3 border-hairline" />

        {/* 스페이서 */}
        <div className="flex-1" />

        {/* 하단 영역
            SPECIFIC_FOOD: kcal+재료 → 재료만 → preview with quote
            GENERAL_RECIPE / OFF_TOPIC: 항상 preview with quote */}
        <div>
          {favorite.intent === 'SPECIFIC_FOOD' && kcal ? (
            // kcal 좌측 + 재료 우측
            <div className="flex items-end justify-between gap-6">
              <span className="shrink-0 leading-none">
                <span className="text-3xl font-light tabular-nums text-body-strong">{kcal}</span>
                <span className="ml-0.5 text-xs text-muted-foreground">kcal</span>
              </span>
              {ingredients.length > 0 && (
                <p className="min-w-0 text-right text-xs text-muted-foreground">
                  {buildIngredientLabel(ingredients)}
                </p>
              )}
            </div>
          ) : favorite.intent === 'SPECIFIC_FOOD' && ingredients.length > 0 ? (
            // kcal 파싱 실패 예외: 재료만
            <p className="text-xs text-muted-foreground">
              {buildIngredientLabel(ingredients)}
            </p>
          ) : (
            // GENERAL_RECIPE · OFF_TOPIC · 파싱 완전 실패: 큰따옴표 + 미리보기
            <div>
              <p className="select-none text-3xl leading-none text-muted-soft" aria-hidden>
                ❝
              </p>
              <p className="mt-1 line-clamp-1 text-xs leading-relaxed text-muted-foreground">
                {preview}
              </p>
            </div>
          )}
        </div>
      </div>
    </article>
  )
}
