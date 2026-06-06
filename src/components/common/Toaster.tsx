import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import { X } from 'lucide-react'
import { useToastStore, type Toast, type ToastVariant } from '@/store/toastStore'
import { cn } from '@/lib/utils'

// 변형별 강조 — 본문은 surface, 보더/텍스트만 톤을 달리한다(DESIGN.md 절제 원칙).
const VARIANT_STYLES: Record<ToastVariant, string> = {
  error: 'border-destructive/40 text-destructive',
  info: 'border-hairline text-foreground',
  success: 'border-accent/40 text-accent',
}

function ToastItem({ toast }: { toast: Toast }) {
  const removeToast = useToastStore((s) => s.removeToast)

  // duration 경과 시 자동 dismiss — 스토어 대신 컴포넌트가 토스트별 타이머를 소유한다.
  useEffect(() => {
    const timer = setTimeout(() => removeToast(toast.id), toast.duration)
    return () => clearTimeout(timer)
  }, [toast.id, toast.duration, removeToast])

  return (
    <motion.div
      // 에러는 즉시 읽히도록 alert, 그 외는 polite
      role={toast.variant === 'error' ? 'alert' : 'status'}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={cn(
        'pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-md border bg-surface px-4 py-3 text-sm shadow-lift',
        VARIANT_STYLES[toast.variant],
      )}
    >
      <span className="min-w-0 flex-1 break-keep">{toast.message}</span>
      <button
        type="button"
        aria-label="닫기"
        onClick={() => removeToast(toast.id)}
        className="-mr-1 shrink-0 cursor-pointer rounded-sm p-0.5 text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
      >
        <X className="size-3.5" />
      </button>
    </motion.div>
  )
}

/**
 * 전역 토스트 표시 — App 에 1회 마운트한다. document.body 로 포털 렌더해 레이아웃 영향 없이 떠 있게 한다.
 */
export default function Toaster() {
  const toasts = useToastStore((s) => s.toasts)

  if (typeof document === 'undefined') return null

  return createPortal(
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>,
    document.body,
  )
}
