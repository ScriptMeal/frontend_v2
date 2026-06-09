import { motion } from 'framer-motion'
import ChatMockup from '@/components/landing/ChatMockup'

export default function DemoSection() {
  return (
    <section className="bg-bg-soft px-6 py-24">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-14">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="text-center"
        >
          <h2 className="text-2xl font-light tracking-tight text-foreground">
            이렇게 동작합니다
          </h2>
          <p className="mt-3 text-sm text-muted-foreground">
            메시지를 보내면 AI가 실시간으로 레시피를 생성합니다
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.35, ease: 'easeOut', delay: 0.1 }}
        >
          <ChatMockup />
        </motion.div>
      </div>
    </section>
  )
}
