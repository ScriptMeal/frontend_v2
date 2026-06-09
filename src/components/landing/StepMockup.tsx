import { useState, useEffect, useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { ShoppingCart, Star } from 'lucide-react'

const RECIPE = `다이어트 떡볶이 레시피입니다.

• 곤약 떡 200g (22kcal)
• 저당 소스 2T (55kcal)

총 칼로리: 약 120kcal`

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-[300px] overflow-hidden rounded-[20px] border border-hairline bg-background shadow-float">
      <div className="flex h-10 shrink-0 items-center bg-foreground px-4">
        <span className="text-xs font-semibold tracking-tight text-white">ScriptMeal</span>
      </div>
      {children}
    </div>
  )
}

function UserBubble({ text }: { text: string }) {
  return (
    <div className="ml-auto max-w-[75%] rounded-2xl rounded-br-sm bg-foreground px-3 py-2">
      <p className="text-xs text-white">{text}</p>
    </div>
  )
}

/** 01 — 입력창에 텍스트 타이핑 + 커서 블링크 */
function InputMockup() {
  const [typed, setTyped] = useState('')
  const full = '떡볶이 레시피 알려줘'
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })

  useEffect(() => {
    if (!inView) return
    let i = 0
    const iv = setInterval(() => {
      i++
      setTyped(full.slice(0, i))
      if (i >= full.length) clearInterval(iv)
    }, 80)
    return () => clearInterval(iv)
  }, [inView])

  return (
    <Shell>
      <div ref={ref} className="flex min-h-[140px] flex-col justify-end p-4">
        <div className="border border-chalk px-3 py-2">
          <p className="text-xs text-foreground">
            {typed}
            <motion.span
              className="ml-0.5 inline-block h-3 w-0.5 bg-foreground align-middle"
              animate={{ opacity: [1, 0, 1] }}
              transition={{ duration: 0.9, repeat: Infinity }}
            />
          </p>
        </div>
      </div>
    </Shell>
  )
}

/** 02 — 유저 버블 + 툴 인디케이터 등장 */
function ToolMockup() {
  return (
    <Shell>
      <div className="flex min-h-[140px] flex-col gap-3 p-4">
        <UserBubble text="떡볶이 레시피 알려줘" />
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.25, delay: 0.25, ease: 'easeOut' as const }}
          className="tool-indicator flex items-center gap-1.5 self-start rounded-sm bg-secondary px-2.5 py-1.5"
        >
          <ShoppingCart className="size-3 text-muted-foreground" strokeWidth={1.5} />
          <span className="text-xs text-muted-foreground">다이어트 제품 검색 중</span>
          <span className="loading-dots text-xs text-muted-foreground">
            <span>.</span><span>.</span><span>.</span>
          </span>
        </motion.div>
      </div>
    </Shell>
  )
}

/** 03 — 어시스턴트 버블에 텍스트 스트리밍 */
function StreamMockup() {
  const [streamed, setStreamed] = useState('')
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })

  useEffect(() => {
    if (!inView) return
    let i = 0
    const iv = setInterval(() => {
      i += 4
      setStreamed(RECIPE.slice(0, i))
      if (i >= RECIPE.length) {
        clearInterval(iv)
        setStreamed(RECIPE)
      }
    }, 25)
    return () => clearInterval(iv)
  }, [inView])

  return (
    <Shell>
      <div ref={ref} className="flex min-h-[140px] flex-col gap-3 p-4">
        <UserBubble text="떡볶이 레시피 알려줘" />
        <div className="rounded-2xl rounded-bl-sm border border-hairline bg-surface px-3 py-2.5">
          <p className="whitespace-pre-line text-xs leading-relaxed text-body">
            {streamed}
            {streamed.length < RECIPE.length && (
              <span className="ml-0.5 inline-block h-3 w-0.5 animate-pulse bg-foreground align-middle" />
            )}
          </p>
        </div>
      </div>
    </Shell>
  )
}

/** 04 — 레시피 완료 + 즐겨찾기 버튼 토글 */
function FavoriteMockup() {
  const [favorited, setFavorited] = useState(false)

  return (
    <Shell>
      <div className="flex min-h-[140px] flex-col gap-3 p-4">
        <UserBubble text="떡볶이 레시피 알려줘" />
        <div className="rounded-2xl rounded-bl-sm border border-hairline bg-surface px-3 py-2.5">
          <p className="line-clamp-3 whitespace-pre-line text-xs leading-relaxed text-body">
            {RECIPE}
          </p>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.25, delay: 0.2, ease: 'easeOut' as const }}
        >
          <button
            type="button"
            onClick={() => setFavorited((f) => !f)}
            className={`flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1 transition-colors ${
              favorited
                ? 'border-accent text-accent'
                : 'border-hairline text-muted-foreground hover:border-accent hover:text-accent'
            }`}
          >
            <motion.span
              animate={{ scale: favorited ? [1, 1.5, 1] : 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 12 }}
            >
              <Star
                className={`size-3 transition-colors ${favorited ? 'fill-accent text-accent' : ''}`}
                strokeWidth={1.5}
              />
            </motion.span>
            <span className="text-xs font-medium">
              {favorited ? '즐겨찾기 저장됨' : '즐겨찾기'}
            </span>
          </button>
        </motion.div>
      </div>
    </Shell>
  )
}

const MOCKUPS = [InputMockup, ToolMockup, StreamMockup, FavoriteMockup]

interface Props {
  step: 0 | 1 | 2 | 3
}

export default function StepMockup({ step }: Props) {
  const Mockup = MOCKUPS[step]
  return <Mockup />
}
