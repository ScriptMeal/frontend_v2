import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import type { SuggestedQuestion } from '@/lib/suggestedQuestions'

interface Props {
  questions: SuggestedQuestion[]
  /** 칩 클릭 시 해당 질문 텍스트로 호출 — 홈에서는 입력창 제출과 동일 경로로 연결한다 */
  onSelect: (text: string) => void
}

// DESIGN.md §8 — stagger 등장(0.06s) + 칩 y 오프셋
const containerMotion = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
}
const chipMotion = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' as const } },
}

/**
 * 홈 입력창 하단의 추천 질문 칩 목록(표현 전용 — 선택 로직은 호출 측).
 * Outline Pill(Secondary) 칩을 flex-wrap 으로 흘리고, 긴 문장은 break-keep 으로 줄바꿈한다.
 */
export default function SuggestedQuestions({ questions, onSelect }: Props) {
  if (questions.length === 0) return null

  return (
    <motion.div
      className="mt-4 flex flex-wrap justify-center gap-2"
      variants={containerMotion}
      initial="hidden"
      animate="show"
    >
      {questions.map((question) => (
        <motion.div key={question.text} variants={chipMotion}>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onSelect(question.text)}
            className="h-auto justify-start whitespace-normal break-keep py-1.5 text-left text-muted-foreground"
          >
            {question.text}
          </Button>
        </motion.div>
      ))}
    </motion.div>
  )
}
