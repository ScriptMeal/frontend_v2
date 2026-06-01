import { AnimatePresence, motion } from 'framer-motion'
import FavoriteCard from '@/components/favorites/FavoriteCard'
import { useFavorites, useDeleteFavorite } from '@/hooks/useFavorites'
import { useSessionStore } from '@/store/sessionStore'

// DESIGN.md §8 — 카드 stagger 등장(0.06s) + 삭제 시 fade-out
const listMotion = {
  show: { transition: { staggerChildren: 0.06 } },
}
const itemMotion = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' as const } },
}

export default function FavoritesPage() {
  const sessionId = useSessionStore((s) => s.currentSessionId)
  const { data: favorites, isLoading, isError } = useFavorites(sessionId)
  const deleteFavorite = useDeleteFavorite(sessionId)

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto w-full max-w-2xl px-4 py-8">
        <header className="mb-6">
          <h1 className="text-display-sm text-foreground">즐겨찾기</h1>
          <p className="mt-1 text-sm text-muted-foreground">저장한 레시피를 모아봤어요.</p>
        </header>

        {isLoading && (
          <p className="py-12 text-center text-sm text-muted-foreground">
            불러오는 중…
          </p>
        )}

        {isError && (
          <p role="alert" className="py-12 text-center text-sm text-destructive">
            즐겨찾기를 불러오지 못했습니다.
          </p>
        )}

        {!isLoading && !isError && favorites && favorites.length === 0 && (
          <p className="py-12 text-center text-sm text-muted-foreground">
            아직 저장한 즐겨찾기가 없습니다.
          </p>
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
                    onDelete={(id) => deleteFavorite.mutate(id)}
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
