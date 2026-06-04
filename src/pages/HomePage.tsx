import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ChatInput from '@/components/chat/ChatInput'
import SuggestedQuestions from '@/components/home/SuggestedQuestions'
import AuraBackground from '@/components/common/AuraBackground'
import { pickSuggestions } from '@/lib/pickSuggestions'
import { suggestedQuestions } from '@/lib/suggestedQuestions'
import { useSessionStore } from '@/store/sessionStore'

export default function HomePage() {
  const navigate = useNavigate()
  const setPendingMessage = useSessionStore((s) => s.setPendingMessage)
  // 마운트당 1회만 추첨해 고정 — 매 렌더 재추첨 방지(결정 20260604-home-suggested-questions)
  const [suggestions] = useState(() => pickSuggestions(suggestedQuestions, 3))

  const handleSubmit = (message: string) => {
    setPendingMessage(message)
    navigate('/chat')
  }

  return (
    <div className="relative isolate h-full overflow-hidden">
      <AuraBackground animated />
      <div className="mx-auto flex h-full max-w-2xl flex-col items-center justify-center px-4">
        <div className="mb-8 text-center">
          <h1 className="break-keep text-2xl font-light tracking-tight text-foreground sm:text-3xl">
            오늘은 어떤 다이어트 레시피를 원하세요?
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            음식 이름을 알려주거나, 날씨에 맞는 메뉴를 추천받아 보세요.
          </p>
        </div>
        <div className="w-full">
          <ChatInput onSubmit={handleSubmit} autoFocus />
          <SuggestedQuestions questions={suggestions} onSelect={handleSubmit} />
        </div>
      </div>
    </div>
  )
}
