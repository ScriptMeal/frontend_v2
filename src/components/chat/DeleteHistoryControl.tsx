import { useState } from 'react'
import { Loader2, Trash2 } from 'lucide-react'

interface Props {
  /** 이 대화 쌍(user+assistant)을 history_id 로 삭제한다. */
  onDeleteHistory: () => void | Promise<void>
}

/**
 * assistant 버블 푸터에서 즐겨찾기 버튼과 나란히 놓이는 "대화 삭제" 컨트롤.
 *
 * 흐름:
 * - 휴지통 클릭 → 인라인 확인("질문과 답변이 함께 삭제됩니다 · 삭제 · 취소")
 * - 확인 → onDeleteHistory 호출(성공 시 상위가 이 쌍을 제거 → 언마운트)
 * - 실패 시 확인 영역을 유지하고 "다시 시도" 안내(항목이 조용히 남는 것 방지)
 */
export default function DeleteHistoryControl({ onDeleteHistory }: Props) {
  const [showConfirm, setShowConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteFailed, setDeleteFailed] = useState(false)

  const handleConfirm = async () => {
    setIsDeleting(true)
    setDeleteFailed(false)
    try {
      await onDeleteHistory()
      setShowConfirm(false)
    } catch {
      setDeleteFailed(true)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleCancel = () => {
    setShowConfirm(false)
    setDeleteFailed(false)
  }

  if (showConfirm) {
    return (
      <div className="flex items-center gap-2 whitespace-nowrap text-xs">
        <span className={deleteFailed ? 'text-destructive' : 'text-muted-foreground'}>
          {deleteFailed ? '삭제에 실패했어요' : '질문과 답변이 함께 삭제됩니다'}
        </span>
        <span className="text-muted-soft select-none">·</span>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={isDeleting}
          aria-label="삭제 확인"
          className="inline-flex cursor-pointer items-center gap-1 font-medium text-destructive hover:underline focus-visible:outline-none disabled:cursor-default disabled:opacity-60"
        >
          {isDeleting && (
            <Loader2
              data-testid="delete-spinner"
              className="action-spinner size-3 animate-spin"
            />
          )}
          {isDeleting ? '삭제 중…' : deleteFailed ? '다시 시도' : '삭제'}
        </button>
        <span className="text-muted-soft select-none">·</span>
        <button
          type="button"
          onClick={handleCancel}
          disabled={isDeleting}
          aria-label="취소"
          className="cursor-pointer text-muted-foreground hover:text-foreground focus-visible:outline-none disabled:cursor-default disabled:opacity-60"
        >
          취소
        </button>
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={() => setShowConfirm(true)}
      aria-label="대화 삭제"
      className="flex cursor-pointer items-center gap-1 rounded-sm px-1 text-xs text-muted-foreground transition-colors hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
    >
      <Trash2 className="size-3.5" />
      삭제
    </button>
  )
}
