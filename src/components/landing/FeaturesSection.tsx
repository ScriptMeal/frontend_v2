import { motion, type Variants } from 'framer-motion'
import { MessageSquare, RefreshCw, ShoppingCart } from 'lucide-react'

const features = [
  {
    icon: MessageSquare,
    title: '자연어로 요청하는 메뉴·레시피 추천',
    description:
      '식사 고민을 말하면 AI가 다이어트 메뉴와 레시피를 추천합니다. 메뉴 결정 피로와 선택 시간을 줄여드립니다.',
  },
  {
    icon: RefreshCw,
    title: '같은 음식을 다이어트 친화 레시피로 재구성',
    description:
      '즐겨 먹는 고칼로리 음식도 저칼로리 재료와 시판 다이어트 제품을 활용해 다이어트 레시피로 재구성합니다.',
  },
  {
    icon: ShoppingCart,
    title: '시판 제품 활용 및 구매 연결',
    description:
      '레시피에 맞는 다이어트 식품을 추천하고, 칼로리·가격·구매처 정보를 함께 제공합니다.',
  },
]

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
}

const item: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' as const } },
}

export default function FeaturesSection() {
  return (
    <section className="bg-bg-soft px-6 py-24">
      <div className="mx-auto max-w-5xl">
        <div className="mb-14 text-center">
          <h2 className="text-2xl font-light tracking-tight text-foreground">
            더 똑똑한 다이어트를 위한 기능
          </h2>
        </div>
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          className="grid gap-6 sm:grid-cols-3"
        >
          {features.map(({ icon: Icon, title, description }) => (
            <motion.div
              key={title}
              variants={item}
              className="rounded-[16px] border border-hairline bg-surface p-6 shadow-lift"
            >
              <div className="mb-4 inline-flex rounded-md bg-surface-strong p-2.5">
                <Icon className="size-5 text-foreground" strokeWidth={1.5} />
              </div>
              <h3 className="mb-2 text-sm font-semibold text-foreground">{title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
