import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'

export default function CtaBand() {
  const navigate = useNavigate()
  return (
    <section className="bg-bg-deep px-6 py-24">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="mx-auto max-w-2xl text-center"
      >
        <h2 className="break-keep text-3xl font-light leading-tight tracking-tight text-white sm:text-4xl">
          지금 바로 시작해보세요
        </h2>
        <p className="mt-4 text-sm leading-relaxed text-white/60">
          오늘 먹을 다이어트 레시피, 지금 바로 찾아보세요.
        </p>
        <button
          type="button"
          onClick={() => navigate('/home')}
          className="mt-10 inline-flex cursor-pointer items-center rounded-full border border-white/30 px-8 py-3 text-sm font-medium text-white transition-colors hover:bg-white/10"
        >
          레시피 찾기
        </button>
      </motion.div>
    </section>
  )
}
