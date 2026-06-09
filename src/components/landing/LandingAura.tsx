import { motion } from 'framer-motion'

const orbs = [
  {
    className: 'orb-mint',
    blur: 'blur-[120px]',
    style: { width: 560, height: 560, top: '-5%', left: '-5%' },
    animate: { x: [0, 120, -60, 80, 0], y: [0, 80, 140, -40, 0], scale: [1, 1.08, 0.95, 1.05, 1] },
    duration: 12,
  },
  {
    className: 'orb-peach',
    blur: 'blur-[100px]',
    style: { width: 480, height: 480, bottom: '-5%', right: '-5%' },
    animate: { x: [0, -100, 60, -80, 0], y: [0, -120, -60, 40, 0], scale: [1, 0.95, 1.1, 0.98, 1] },
    duration: 14,
  },
  {
    className: 'orb-lavender',
    blur: 'blur-[90px]',
    style: { width: 400, height: 400, top: '20%', right: '5%' },
    animate: { x: [0, -80, 40, -60, 0], y: [0, 100, -80, 60, 0], scale: [1, 1.06, 0.92, 1.04, 1] },
    duration: 10,
  },
  {
    className: 'orb-sky',
    blur: 'blur-[80px]',
    style: { width: 340, height: 340, bottom: '15%', left: '8%' },
    animate: { x: [0, 90, -50, 70, 0], y: [0, -90, 60, -50, 0], scale: [1, 0.94, 1.08, 0.97, 1] },
    duration: 11,
  },
]

export default function LandingAura() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
    >
      {orbs.map(({ className, blur, style, animate, duration }, i) => (
        <motion.div
          key={i}
          className={`${className} opacity-[0.35] ${blur} absolute rounded-full`}
          style={style}
          animate={animate}
          transition={{
            duration,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: i * 2,
          }}
        />
      ))}
    </div>
  )
}
