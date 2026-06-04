import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import FavoriteCardAccordion from '@/components/favorites/FavoriteCardAccordion'
import FavoriteCardExpanded from '@/components/favorites/FavoriteCardExpanded'
import FavoritesCloud from '@/components/favorites/FavoritesCloud'
import FavoriteCardRich from '@/components/favorites/FavoriteCardRich'
import FavoritesGrid from '@/components/favorites/FavoritesGrid'
import FavoriteHybridCard from '@/components/favorites/FavoriteHybridCard'
import FavoriteDetailModal from '@/components/favorites/FavoriteDetailModal'
import { devFavoritesSeed } from '@/api/mock/devFavoritesSeed'
import { cn } from '@/lib/utils'
import type { FavoriteRecord } from '@/types'

type Variant = 'accordion' | 'cloud' | 'expanded' | 'rich' | 'grid' | 'hybrid'

const variants: { id: Variant; label: string; desc: string }[] = [
  { id: 'accordion', label: 'A · 접이식', desc: '클릭하면 펼쳐지는 아코디언. 목록을 짧게 유지.' },
  { id: 'cloud', label: 'B · 클라우드+모달', desc: '콘텐츠 너비 타일이 떠오르듯 흐름 → 클릭 시 상세 모달.' },
  { id: 'expanded', label: 'C · 항상 펼침', desc: '전체 내용 + 액센트 사이드룰 재설계.' },
  { id: 'rich', label: 'D · 아코디언 강화', desc: 'intent 사이드룰 색상 + 날짜 + 2줄 미리보기로 카드 밀도 향상.' },
  { id: 'grid', label: 'E · 2열 그리드', desc: '2열 카드 + 4줄 미리보기 → 클릭 시 상세 모달.' },
  { id: 'hybrid', label: 'F · 하이브리드', desc: 'B오브 배경 + A레이아웃(칩·별·부제목 제거). 제목 → 구분선 → kcal/구매처.' },
]

// DESIGN.md §8 — 리스트 stagger 등장
const listMotion = { show: { transition: { staggerChildren: 0.06 } } }
const itemMotion = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' as const } },
}

/**
 * DEV 전용 — 즐겨찾기 카드 5안(A~E)을 mock 데이터로 비교하는 페이지.
 * 삭제는 로컬 상태에서 제거해 exit 애니메이션까지 확인한다.
 * 라우트: /dev/favorites
 */
export default function DevFavoritesPage() {
  const [variant, setVariant] = useState<Variant>('rich')
  const [favorites, setFavorites] = useState(devFavoritesSeed)
  const [hybridSelected, setHybridSelected] = useState<FavoriteRecord | null>(null)

  const handleDelete = (id: number) =>
    setFavorites((prev) => prev.filter((f) => f.id !== id))

  const reset = () => setFavorites(devFavoritesSeed)
  const active = variants.find((v) => v.id === variant)!
  const isWide = variant === 'cloud' || variant === 'grid' || variant === 'hybrid'

  return (
    <div className="flex h-full flex-col">
      <header className="shrink-0 border-b border-hairline bg-bg-soft px-4 py-3">
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-foreground">
                즐겨찾기 카드 비교 (mock 데이터)
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
            isWide ? 'max-w-4xl px-2' : 'max-w-2xl px-4',
          )}
        >
          {favorites.length === 0 && (
            <p className="py-12 text-center text-sm text-muted-foreground">
              모두 삭제되었습니다. 목록 초기화 버튼으로 되돌리세요.
            </p>
          )}

          {variant === 'cloud' && (
            <FavoritesCloud favorites={favorites} onDelete={handleDelete} />
          )}

          {variant === 'grid' && (
            <FavoritesGrid favorites={favorites} onDelete={handleDelete} />
          )}

          {variant === 'hybrid' && favorites.length > 0 && (
            <>
              <motion.div
                className="grid grid-cols-1 gap-4 sm:grid-cols-2"
                variants={{ show: { transition: { staggerChildren: 0.05 } } }}
                initial="hidden"
                animate="show"
              >
                <AnimatePresence>
                  {favorites.map((favorite) => (
                    <motion.div
                      key={favorite.id}
                      variants={itemMotion}
                      exit={{ opacity: 0, scale: 0.97 }}
                      transition={{ duration: 0.18, ease: 'easeOut' }}
                      layout
                    >
                      <FavoriteHybridCard
                        favorite={favorite}
                        onOpen={setHybridSelected}
                        onDelete={handleDelete}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
              <AnimatePresence>
                {hybridSelected && (
                  <FavoriteDetailModal
                    favorite={hybridSelected}
                    onClose={() => setHybridSelected(null)}
                    onDelete={handleDelete}
                  />
                )}
              </AnimatePresence>
            </>
          )}

          {(variant === 'accordion' || variant === 'expanded' || variant === 'rich') &&
            favorites.length > 0 && (
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
                      {variant === 'accordion' && (
                        <FavoriteCardAccordion favorite={favorite} onDelete={handleDelete} />
                      )}
                      {variant === 'expanded' && (
                        <FavoriteCardExpanded favorite={favorite} onDelete={handleDelete} />
                      )}
                      {variant === 'rich' && (
                        <FavoriteCardRich favorite={favorite} onDelete={handleDelete} />
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
