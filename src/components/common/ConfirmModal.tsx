import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'

interface Props {
  /** 본문 질문 문구 */
  message: string
  /** 확인 버튼 라벨 (기본 '예') */
  confirmLabel?: string
  /** 취소 버튼 라벨 (기본 '취소') */
  cancelLabel?: string
  onConfirm: () => void
  onClose: () => void
}

/**
 * 범용 확인 모달 — 되돌릴 수 없는 동작(세션 삭제 등)을 한 번 더 확인받는다.
 * 백드롭 클릭·Esc·취소로 닫고, 확인 시 onConfirm 을 호출한다.
 * 오버레이 idiom 은 FavoriteDetailModal 과 동일(fixed inset-0 + 백드롭/Esc).
 */
export default function ConfirmModal({
  message,
  confirmLabel = '예',
  cancelLabel = '취소',
  onConfirm,
  onClose,
}: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  // 변형(translate/transform)된 조상이 있는 곳(예: 모바일 슬라이드 사이드바)에서도
  // 모달이 뷰포트 전체를 덮도록 body 로 포털한다 — transform 은 fixed 의 컨테이닝 블록을 만든다.
  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <button
        type="button"
        aria-label="배경 닫기"
        data-testid="confirm-modal-backdrop"
        onClick={onClose}
        className="absolute inset-0 h-full w-full cursor-default bg-foreground/40"
      />

      <motion.div
        role="dialog"
        aria-modal="true"
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
        className="relative w-full max-w-sm rounded-xl border border-hairline bg-surface p-5 shadow-float"
      >
        <p className="whitespace-pre-line text-sm leading-relaxed text-body-strong">{message}</p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            {cancelLabel}
          </Button>
          <Button size="sm" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </motion.div>
    </motion.div>,
    document.body,
  )
}
