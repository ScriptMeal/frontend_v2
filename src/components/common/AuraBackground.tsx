import { motion } from 'framer-motion'

interface Props {
  animated?: boolean
}

// DESIGN.md §2-5 — 대기 그라디언트 오브 (blur + opacity ≤ 0.4, 순수 장식)
// animated=true: 홈 히어로용 느린 float 루프 (MotionConfig reducedMotion="user" 로 접근성 처리됨)
// animated=false: 빈 상태용 정적 오브
export default function AuraBackground({ animated = false }: Props) {
  const orb1 =
    'orb-mint pointer-events-none absolute h-[480px] w-[480px] -left-24 -top-24 rounded-full opacity-[0.32] blur-[120px]'
  const orb2 =
    'orb-peach pointer-events-none absolute h-[400px] w-[400px] -bottom-24 -right-24 rounded-full opacity-[0.28] blur-[100px]'

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      {animated ? (
        <>
          <motion.div
            className={orb1}
            animate={{ y: [0, 28, 0] }}
            transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className={orb2}
            animate={{ y: [0, -28, 0] }}
            transition={{ duration: 26, repeat: Infinity, ease: 'easeInOut', delay: 5 }}
          />
        </>
      ) : (
        <>
          <div className={orb1} />
          <div className={orb2} />
        </>
      )}
    </div>
  )
}
