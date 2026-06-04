import { ShoppingCart, CloudSun, MessageCircle, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Intent } from '@/types'

// intent별 라벨·아이콘. 색은 아이콘에만 입힌다(절제) — DESIGN.md §1
const meta: Record<Intent, { label: string; Icon: LucideIcon; iconClass: string }> = {
  SPECIFIC_FOOD: { label: '제품 추천', Icon: ShoppingCart, iconClass: 'text-accent' },
  GENERAL_RECIPE: { label: '날씨 추천', Icon: CloudSun, iconClass: 'text-sky-500' },
  OFF_TOPIC: { label: '대화', Icon: MessageCircle, iconClass: 'text-muted-foreground' },
}

interface Props {
  intent: Intent
}

/** 즐겨찾기 카드 머리말에 붙는 intent 태그 칩. 3개 카드 변형이 공유한다. */
export default function IntentChip({ intent }: Props) {
  const { label, Icon, iconClass } = meta[intent]
  return (
    <span className="inline-flex items-center gap-1 rounded-sm border border-hairline bg-surface-strong px-1.5 py-0.5 text-[11px] font-medium text-body-strong">
      <Icon className={cn('size-3', iconClass)} aria-hidden />
      {label}
    </span>
  )
}
