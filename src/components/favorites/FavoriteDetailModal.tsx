import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import RecipeContent from '@/components/chat/RecipeContent'
import type { FavoriteRecord } from '@/types'

interface Props {
  favorite: FavoriteRecord
  onClose: () => void
  onDelete: (id: number) => void
}

/**
 * B안 상세 모달 — 타일 클릭 시 응답 전체를 채팅과 동일한 RecipeContent 로 띄운다.
 * 백드롭 클릭·Esc·닫기 버튼으로 닫고, 삭제 시 닫으며 onDelete 를 호출한다.
 */
export default function FavoriteDetailModal({ favorite, onClose, onDelete }: Props) {
  // Esc 로 닫기 — 모달 표시 동안만 키 핸들러 등록
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4"
      onClick={onClose}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="flex max-h-[80vh] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-hairline bg-surface shadow-float"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-3 border-b border-hairline px-5 py-4">
          <p className="text-sm font-medium text-body-strong">
            {favorite.user_message}
          </p>
          <Button variant="ghost" size="icon-sm" aria-label="닫기" onClick={onClose}>
            <X className="text-muted-foreground" />
          </Button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 text-sm text-foreground">
          <RecipeContent content={favorite.recipe_reply} />
        </div>

        <footer className="flex justify-end border-t border-hairline px-5 py-3">
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              onDelete(favorite.id)
              onClose()
            }}
          >
            <Trash2 />
            삭제
          </Button>
        </footer>
      </motion.div>
    </motion.div>
  )
}
