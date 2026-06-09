import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Star, ShoppingCart } from 'lucide-react'

const RECIPE = `다이어트 떡볶이 레시피입니다.

재료 (1인분)
• 곤약 떡 200g (22kcal)
• 저당 떡볶이 소스 2T (55kcal)
• 대파 약간

총 칼로리: 약 120kcal`

type Phase = 'idle' | 'user' | 'tool' | 'streaming' | 'done'

const bubble = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' as const } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
}

export default function ChatMockup() {
  const [phase, setPhase] = useState<Phase>('idle')
  const [streamed, setStreamed] = useState('')
  const [favorited, setFavorited] = useState(false)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  const clear = () => timers.current.forEach(clearTimeout)

  const run = useCallback(() => {
    clear()
    setPhase('idle')
    setStreamed('')
    setFavorited(false)

    const t = (fn: () => void, ms: number) => {
      const id = setTimeout(fn, ms)
      timers.current.push(id)
    }

    t(() => setPhase('user'), 500)
    t(() => setPhase('tool'), 1400)
    t(() => setPhase('streaming'), 2800)
  }, [])

  // 최초 실행
  useEffect(() => {
    run()
    return clear
  }, [run])

  // 스트리밍
  useEffect(() => {
    if (phase !== 'streaming') return
    let i = 0
    const iv = setInterval(() => {
      i += 3
      setStreamed(RECIPE.slice(0, i))
      if (i >= RECIPE.length) {
        clearInterval(iv)
        setStreamed(RECIPE)
        const id = setTimeout(() => setPhase('done'), 500)
        timers.current.push(id)
      }
    }, 28)
    return () => clearInterval(iv)
  }, [phase])

  // done → 루프
  useEffect(() => {
    if (phase !== 'done') return
    const id = setTimeout(run, 3500)
    timers.current.push(id)
  }, [phase, run])

  const showUser = phase !== 'idle'
  const showTool = phase === 'tool'
  const showAssistant = phase === 'streaming' || phase === 'done'
  const showFavorite = phase === 'done'

  return (
    <div className="flex w-[340px] flex-col overflow-hidden rounded-[20px] border border-hairline bg-background shadow-float">
      {/* 헤더 */}
      <div className="flex h-12 shrink-0 items-center px-4 bg-foreground">
        <span className="text-sm font-semibold tracking-tight text-white">ScriptMeal</span>
      </div>

      {/* 채팅 영역 */}
      <div className="flex min-h-[320px] flex-col gap-3 p-4">
        <AnimatePresence mode="wait">
          {showUser && (
            <motion.div
              key="user"
              variants={bubble}
              initial="hidden"
              animate="show"
              exit="exit"
              className="ml-auto max-w-[75%] rounded-2xl rounded-br-sm bg-foreground px-4 py-2.5"
            >
              <p className="text-sm text-white">떡볶이 레시피 알려줘</p>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showTool && (
            <motion.div
              key="tool"
              variants={bubble}
              initial="hidden"
              animate="show"
              exit="exit"
              className="flex items-center gap-1.5 self-start rounded-sm bg-secondary px-2.5 py-1.5"
            >
              <ShoppingCart className="size-3 text-muted-foreground" strokeWidth={1.5} />
              <span className="text-xs text-muted-foreground">다이어트 제품 검색 중</span>
              <span className="loading-dots text-xs text-muted-foreground">
                <span>.</span><span>.</span><span>.</span>
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showAssistant && (
            <motion.div
              key="assistant"
              variants={bubble}
              initial="hidden"
              animate="show"
              className="mr-auto flex max-w-[85%] flex-col gap-2"
            >
              <div className="rounded-2xl rounded-bl-sm border border-hairline bg-surface px-4 py-3">
                <p className="whitespace-pre-line text-xs leading-relaxed text-body">
                  {streamed}
                  {phase === 'streaming' && (
                    <span className="ml-0.5 inline-block h-3 w-0.5 animate-pulse bg-foreground align-middle" />
                  )}
                </p>
              </div>

              <AnimatePresence>
                {showFavorite && (
                  <motion.button
                    key="fav"
                    variants={bubble}
                    initial="hidden"
                    animate="show"
                    type="button"
                    onClick={() => setFavorited((f) => !f)}
                    className="flex cursor-pointer items-center gap-1.5 self-start rounded-full border border-hairline px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-accent hover:text-accent"
                  >
                    <Star
                      className={`size-3 transition-colors ${favorited ? 'fill-accent text-accent' : ''}`}
                      strokeWidth={1.5}
                    />
                    {favorited ? '즐겨찾기 저장됨' : '즐겨찾기'}
                  </motion.button>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 입력창 */}
      <div className="shrink-0 border-t border-hairline px-4 py-3">
        <div className="rounded-none border border-chalk px-3 py-2">
          <p className="text-xs text-muted-foreground">메시지를 입력하세요...</p>
        </div>
      </div>
    </div>
  )
}
