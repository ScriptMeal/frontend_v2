import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import FavoriteTile from '@/components/favorites/FavoriteTile'
import FavoriteDetailModal from '@/components/favorites/FavoriteDetailModal'
import { cn } from '@/lib/utils'
import type { FavoriteRecord } from '@/types'

interface Props {
  favorites: FavoriteRecord[]
  onDelete: (id: number) => void
}

// DESIGN.md §8 — stagger 등장. 떠오름 느낌은 y 오프셋 + spring 으로.
const cloudMotion = { show: { transition: { staggerChildren: 0.05 } } }
const tileMotion = {
  hidden: { opacity: 0, y: 16, scale: 0.9 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring' as const, stiffness: 260, damping: 20 },
  },
}

// id 기반 결정적 변주(매 렌더 동일) — 상하 jitter 로 베이스라인을 흩어 클라우드 느낌을 준다
const jitter = ['mt-0', 'mt-4', 'mt-2', 'mt-6']
// hover 글로우용 히어로 오브 5색(DESIGN.md §2-5)을 타일마다 돌려 배정한다
const glowPalette = ['orb-mint', 'orb-peach', 'orb-lavender', 'orb-sky', 'orb-rose']
const weightOf = (id: number): 0 | 1 | 2 => (id % 3) as 0 | 1 | 2

/**
 * B안 컨테이너(워드 클라우드) — 고정 격자 대신 콘텐츠 너비 타일을 flex-wrap 으로 흘리고,
 * 상하 jitter + spring 으로 떠오르듯 등장시킨다. 타일 클릭 시 상세 모달을 띄운다.
 */
export default function FavoritesCloud({ favorites, onDelete }: Props) {
  const [selected, setSelected] = useState<FavoriteRecord | null>(null)

  return (
    <>
      <motion.div
        className="flex flex-wrap items-start justify-center gap-3"
        variants={cloudMotion}
        initial="hidden"
        animate="show"
      >
        <AnimatePresence>
          {favorites.map((favorite) => (
            <motion.div
              key={favorite.id}
              variants={tileMotion}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              layout
              className={cn(jitter[favorite.id % jitter.length])}
            >
              <FavoriteTile
                favorite={favorite}
                onOpen={setSelected}
                weight={weightOf(favorite.id)}
                glow={glowPalette[favorite.id % glowPalette.length]}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      <AnimatePresence>
        {selected && (
          <FavoriteDetailModal
            favorite={selected}
            onClose={() => setSelected(null)}
            onDelete={onDelete}
          />
        )}
      </AnimatePresence>
    </>
  )
}
