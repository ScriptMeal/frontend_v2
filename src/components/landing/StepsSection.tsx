import { motion } from 'framer-motion'
import StepMockup from '@/components/landing/StepMockup'

const steps = [
  {
    number: '01',
    title: '메시지 입력',
    description: '"오늘 점심 뭐 먹을까?" 처럼 자유롭게 원하는 메뉴나 상황을 입력하세요.',
  },
  {
    number: '02',
    title: 'AI 분석',
    description: 'AI가 사용자의 질문을 분석해 알맞은 정보를 찾아드립니다.',
  },
  {
    number: '03',
    title: '레시피 제공',
    description: '칼로리·재료·조리법이 담긴 다이어트 레시피를 실시간으로 받아보세요.',
  },
  {
    number: '04',
    title: '즐겨찾기 저장',
    description: '마음에 드는 레시피는 즐겨찾기에 저장해 언제든 다시 확인할 수 있습니다.',
  },
]

export default function StepsSection() {
  return (
    <section className="px-6 py-24">
      <div className="mx-auto max-w-4xl">
        <div className="mb-16 text-center">
          <h2 className="text-2xl font-light tracking-tight text-foreground">
            레시피 탐색, 이렇게 이루어져요
          </h2>
        </div>

        <div className="flex flex-col divide-y divide-hairline">
          {steps.map(({ number, title, description }, i) => (
            <div
              key={number}
              className="grid grid-cols-2 items-center gap-12 py-14 first:pt-0 last:pb-0"
            >
              {/* 좌: 설명 */}
              <motion.div
                initial={{ opacity: 0, x: -16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.3, ease: 'easeOut' as const }}
                className="flex flex-col gap-4"
              >
                <span className="text-5xl font-light tabular-nums text-hairline-strong">
                  {number}
                </span>
                <h3 className="text-base font-semibold text-foreground">{title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
              </motion.div>

              {/* 우: 목업 */}
              <motion.div
                initial={{ opacity: 0, x: 16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.3, ease: 'easeOut' as const, delay: 0.1 }}
                className="flex justify-center"
              >
                <StepMockup step={i as 0 | 1 | 2 | 3} />
              </motion.div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
