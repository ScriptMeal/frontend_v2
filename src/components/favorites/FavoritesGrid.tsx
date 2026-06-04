import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import FavoriteHybridCard from '@/components/favorites/FavoriteHybridCard'
import FavoriteDetailModal from '@/components/favorites/FavoriteDetailModal'
import type { FavoriteRecord } from '@/types'

interface Props {
  favorites: FavoriteRecord[]
  onDelete: (id: number) => void
}

// DESIGN.md §8 — stagger 등장
const gridMotion = { show: { transition: { staggerChildren: 0.05 } } }
const cardMotion = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.22, ease: 'easeOut' as const } },
}

/** 2열 그리드 — 카드 클릭 시 FavoriteDetailModal 로 레시피 전체를 보여준다. */
export default function FavoritesGrid({ favorites, onDelete }: Props) {
  const [selected, setSelected] = useState<FavoriteRecord | null>(null)

  return (
    <>
      <motion.div
        className="grid grid-cols-1 gap-4 sm:grid-cols-2"
        variants={gridMotion}
        initial="hidden"
        animate="show"
      >
        <AnimatePresence>
          {favorites.map((favorite) => (
            <motion.div
              key={favorite.id}
              variants={cardMotion}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              layout
            >
              <FavoriteHybridCard
                favorite={favorite}
                onOpen={setSelected}
                onDelete={onDelete}
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
