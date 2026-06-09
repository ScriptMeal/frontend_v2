import HeroSection from '@/components/landing/HeroSection'
import FeaturesSection from '@/components/landing/FeaturesSection'
import StepsSection from '@/components/landing/StepsSection'
import CtaBand from '@/components/landing/CtaBand'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <main>
        <HeroSection />
        <FeaturesSection />
        <StepsSection />
        <CtaBand />
      </main>
    </div>
  )
}
