import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import FavoriteCardAccordion from '@/components/favorites/FavoriteCardAccordion'
import FavoriteCardExpanded from '@/components/favorites/FavoriteCardExpanded'
import FavoritesCloud from '@/components/favorites/FavoritesCloud'
import { devFavoritesSeed } from '@/api/mock/devFavoritesSeed'
import { cn } from '@/lib/utils'

type Variant = 'accordion' | 'cloud' | 'expanded'

const variants: { id: Variant; label: string; desc: string }[] = [
  { id: 'accordion', label: 'A · 접이식', desc: '클릭하면 펼쳐지는 아코디언. 목록을 짧게 유지.' },
  { id: 'cloud', label: 'B · 클라우드+모달', desc: '콘텐츠 너비 타일이 떠오르듯 흐름 → 클릭 시 상세 모달.' },
  { id: 'expanded', label: 'C · 항상 펼침', desc: '전체 내용 + 액센트 사이드룰 재설계.' },
]

// DESIGN.md §8 — 리스트 stagger 등장
const listMotion = { show: { transition: { staggerChildren: 0.06 } } }
const itemMotion = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' as const } },
}

/**
 * DEV 전용 — 즐겨찾기 카드 3안(A 접이식 / B 그리드+모달 / C 항상펼침)을
 * mock 데이터로 비교하는 페이지. 삭제는 로컬 상태에서 제거해 exit 애니메이션까지 확인한다.
 * 라우트: /dev/favorites
 */
export default function DevFavoritesPage() {
  const [variant, setVariant] = useState<Variant>('accordion')
  const [favorites, setFavorites] = useState(devFavoritesSeed)

  const handleDelete = (id: number) =>
    setFavorites((prev) => prev.filter((f) => f.id !== id))

  const reset = () => setFavorites(devFavoritesSeed)
  const active = variants.find((v) => v.id === variant)!
  // 클라우드는 양옆 여백을 줄이고 폭을 넓혀 타일이 흐를 공간을 준다
  const isCloud = variant === 'cloud'

  return (
    <div className="flex h-full flex-col">
      <header className="shrink-0 border-b border-hairline bg-bg-soft px-4 py-3">
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-foreground">
                ⭐ 즐겨찾기 카드 비교 (mock 데이터)
              </p>
              <p className="text-xs text-muted-foreground">{active.desc}</p>
            </div>
            <Button variant="outline" size="sm" onClick={reset}>
              목록 초기화
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {variants.map((v) => (
              <Button
                key={v.id}
                variant={v.id === variant ? 'secondary' : 'outline'}
                size="sm"
                onClick={() => setVariant(v.id)}
              >
                {v.label}
              </Button>
            ))}
          </div>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div
          className={cn(
            'mx-auto w-full py-8',
            isCloud ? 'max-w-5xl px-2' : 'max-w-2xl px-4',
          )}
        >
          {favorites.length === 0 && (
            <p className="py-12 text-center text-sm text-muted-foreground">
              모두 삭제되었습니다. “목록 초기화”로 되돌리세요.
            </p>
          )}

          {variant === 'cloud' && (
            <FavoritesCloud favorites={favorites} onDelete={handleDelete} />
          )}

          {variant !== 'cloud' && favorites.length > 0 && (
            <motion.div
              key={variant}
              className="flex flex-col gap-4"
              variants={listMotion}
              initial="hidden"
              animate="show"
            >
              <AnimatePresence>
                {favorites.map((favorite) => (
                  <motion.div
                    key={favorite.id}
                    variants={itemMotion}
                    exit={{ opacity: 0, scale: 0.97 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    layout
                  >
                    {variant === 'accordion' ? (
                      <FavoriteCardAccordion favorite={favorite} onDelete={handleDelete} />
                    ) : (
                      <FavoriteCardExpanded favorite={favorite} onDelete={handleDelete} />
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}
