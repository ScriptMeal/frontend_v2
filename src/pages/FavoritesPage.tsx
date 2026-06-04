import StateMessage from '@/components/common/StateMessage'
import AuraBackground from '@/components/common/AuraBackground'
import FavoritesCloud from '@/components/favorites/FavoritesCloud'
import { useAllFavorites, useDeleteFavorite } from '@/hooks/useFavorites'

export default function FavoritesPage() {
  // 보유 세션 인덱스 기반 집계 — 전체 세션의 즐겨찾기를 합산해 보여준다.
  const { data: favorites, isLoading, isError } = useAllFavorites()
  const deleteFavorite = useDeleteFavorite()

  const isEmpty = !isLoading && !isError && favorites?.length === 0

  // 삭제는 모달에서 id 로 들어오므로, 로드된 목록에서 session_id 를 찾아 함께 전달한다.
  const handleDelete = (id: number) => {
    const target = favorites?.find((f) => f.id === id)
    if (target) deleteFavorite.mutate({ id, session_id: target.session_id })
  }

  return (
    <div className="relative isolate h-full overflow-y-auto">
      {isEmpty && <AuraBackground />}
      <div className="mx-auto w-full max-w-5xl px-2 py-8">
        <header className="mb-6 px-2">
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
          <FavoritesCloud favorites={favorites} onDelete={handleDelete} />
        )}
      </div>
    </div>
  )
}
