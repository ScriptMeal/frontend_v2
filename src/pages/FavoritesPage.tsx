import FavoriteCard from '@/components/favorites/FavoriteCard'
import { useFavorites, useDeleteFavorite } from '@/hooks/useFavorites'
import { useSessionStore } from '@/store/sessionStore'

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
          <div className="flex flex-col gap-4">
            {favorites.map((favorite) => (
              <FavoriteCard
                key={favorite.id}
                favorite={favorite}
                onDelete={(id) => deleteFavorite.mutate(id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
