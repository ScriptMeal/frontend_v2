import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export default function LandingNav() {
  const navigate = useNavigate()
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-border bg-background/90 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
        <span className="text-base font-semibold tracking-tight text-foreground">ScriptMeal</span>
        <Button onClick={() => navigate('/home')}>시작하기</Button>
      </div>
    </header>
  )
}
