import { AnimatePresence, motion } from 'framer-motion'
import FavoriteCard from '@/components/favorites/FavoriteCard'
import StateMessage from '@/components/common/StateMessage'
import AuraBackground from '@/components/common/AuraBackground'
import { useAllFavorites, useDeleteFavorite } from '@/hooks/useFavorites'

// DESIGN.md §8 — 카드 stagger 등장(0.06s) + 삭제 시 fade-out
const listMotion = {
  show: { transition: { staggerChildren: 0.06 } },
}
const itemMotion = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' as const } },
}

export default function FavoritesPage() {
  // 보유 세션 인덱스 기반 집계 — 전체 세션의 즐겨찾기를 합산해 보여준다.
  const { data: favorites, isLoading, isError } = useAllFavorites()
  const deleteFavorite = useDeleteFavorite()

  const isEmpty = !isLoading && !isError && favorites?.length === 0

  return (
    <div className="relative isolate h-full overflow-y-auto">
      {isEmpty && <AuraBackground />}
      <div className="mx-auto w-full max-w-2xl px-4 py-8">
        <header className="mb-6">
          <h1 className="text-display-sm text-foreground">즐겨찾기</h1>
          <p className="mt-1 text-sm text-muted-foreground">저장한 레시피를 모아봤어요.</p>
        </header>

        {isLoading && <StateMessage variant="loading">불러오는 중…</StateMessage>}

        {isError && (
          <StateMessage variant="error">즐겨찾기를 불러오지 못했습니다.</StateMessage>
        )}

        {isEmpty && (
          <StateMessage variant="empty">아직 저장한 즐겨찾기가 없습니다.</StateMessage>
        )}

        {!isLoading && !isError && favorites && favorites.length > 0 && (
          <motion.div
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
                  <FavoriteCard
                    favorite={favorite}
                    onDelete={(id) =>
                      deleteFavorite.mutate({ id, session_id: favorite.session_id })
                    }
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  )
}
