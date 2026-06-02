import { ShoppingCart } from 'lucide-react'
import type { PurchaseItem } from '@/lib/parseRecipeReply'

interface Props {
  items: PurchaseItem[]
}

/**
 * SPECIFIC_FOOD 응답 말미의 🛒 구매 정보를 제품별 카드로 표시한다. (DESIGN.md §7 카드)
 * 구매처는 액센트 태그로 — 액센트는 태그 용도에만 사용(DESIGN.md §2-4).
 */
export default function PurchaseInfo({ items }: Props) {
  if (items.length === 0) return null

  return (
    <section className="flex flex-col gap-2 border-t border-hairline-soft pt-3">
      <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <ShoppingCart className="size-3.5" aria-hidden />
        사용된 제품 구매 정보
      </p>
      <ul className="flex flex-col gap-2">
        {items.map((item, index) => (
          <li
            key={index}
            className="flex flex-col gap-1 rounded-md border border-hairline bg-bg-soft px-3 py-2"
          >
            <div className="flex items-start justify-between gap-2">
              <span className="text-sm font-medium text-body-strong">{item.name}</span>
              {item.store && (
                <span className="shrink-0 rounded-sm bg-accent-light px-1.5 py-0.5 text-xs font-medium text-accent">
                  {item.store}
                </span>
              )}
            </div>
            {item.detail && (
              <span className="text-xs text-muted-foreground">{item.detail}</span>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}
