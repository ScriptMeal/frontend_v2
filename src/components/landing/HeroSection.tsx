import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import LandingAura from '@/components/landing/LandingAura'

export default function HeroSection() {
  const navigate = useNavigate()
  return (
    <section className="relative isolate flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 text-center">
      <LandingAura />
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="max-w-2xl"
      >
        <p className="mb-4 text-sm font-medium tracking-widest text-muted-foreground uppercase">
          ScriptMeal
        </p>
        <h1 className="break-keep text-5xl font-light leading-tight tracking-tight text-foreground sm:text-6xl">
          좋아하는 음식 그대로, <br />칼로리는 줄여서
        </h1>
        <p className="mt-6 text-base leading-relaxed text-muted-foreground">
          먹고 싶은 음식을 말하거나, 날씨에 맞는 메뉴를 추천받아 보세요.
          <br className="hidden sm:block" />
          AI가 저칼로리 레시피와
          시판 제품을 함께 찾아드립니다.
        </p>
        <div className="mt-10">
          <Button size="lg" onClick={() => navigate('/home')}>
            지금 시작하기
          </Button>
        </div>
      </motion.div>

      {/* 스크롤 힌트 */}
      <motion.div
        className="absolute bottom-10 left-1/2 -translate-x-1/2"
        animate={{ y: [0, 6, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div className="h-8 w-[1px] bg-border mx-auto" />
      </motion.div>
    </section>
  )
}
