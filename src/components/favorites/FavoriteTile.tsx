import { cn } from '@/lib/utils'
import type { FavoriteRecord } from '@/types'

interface Props {
  favorite: FavoriteRecord
  onOpen: (favorite: FavoriteRecord) => void
  /** 워드 클라우드 가중치 — 글자 크기·패딩 변주(0=작게 … 2=크게) */
  weight?: 0 | 1 | 2
  /** hover 글로우에 쓸 히어로 오브 색 클래스(orb-mint 등) */
  glow?: string
}

// 가중치별 패딩·타이포 — 인라인 style 대신 결정적 클래스 매핑(DESIGN.md 절제)
const weightPad: Record<0 | 1 | 2, string> = {
  0: 'px-3 py-2',
  1: 'px-4 py-2.5',
  2: 'px-4 py-3',
}
const weightText: Record<0 | 1 | 2, string> = {
  0: 'text-sm font-medium',
  1: 'text-base font-medium',
  2: 'text-base font-semibold',
}

/**
 * B안 타일(워드 클라우드) — 콘텐츠 너비로 흐르는 압축 칩.
 * 질문 길이만큼 가로폭이 잡히고, 가중치로 크기를 변주한다.
 * hover 시 뒤에서 히어로 오브 색 글로우가 피어오르고 타일이 살짝 떠오른다.
 * (오브는 버튼 fill 이 아니라 뒤쪽 장식 레이어 — DESIGN.md §1 오브=장식 전용 준수)
 * 클릭하면 상세 모달(FavoriteDetailModal)이 응답 전체를 채팅 UI로 띄운다.
 */
export default function FavoriteTile({
  favorite,
  onOpen,
  weight = 0,
  glow = 'orb-mint',
}: Props) {
  return (
    <div className="group relative isolate inline-flex">
      {/* hover 글로우 — 블러 처리한 오브가 뒤에서 번진다(prefers-reduced-motion 시 전환 무력화) */}
      <span
        aria-hidden
        className={cn(
          'pointer-events-none absolute -inset-2 -z-10 scale-90 rounded-full opacity-0 blur-xl transition duration-300 group-hover:scale-110 group-hover:opacity-40',
          glow,
        )}
      />
      <button
        type="button"
        onClick={() => onOpen(favorite)}
        className={cn(
          'inline-flex max-w-56 cursor-pointer items-start rounded-lg border border-hairline bg-surface text-left shadow-lift transition-transform duration-300 hover:-translate-y-1 focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none',
          weightPad[weight],
        )}
      >
        <span className={cn('text-body-strong', weightText[weight])}>
          {favorite.user_message}
        </span>
      </button>
    </div>
  )
}
