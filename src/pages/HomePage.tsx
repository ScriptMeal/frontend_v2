import { useNavigate } from 'react-router-dom'
import ChatInput from '@/components/chat/ChatInput'
import { useSessionStore } from '@/store/sessionStore'

export default function HomePage() {
  const navigate = useNavigate()
  const setPendingMessage = useSessionStore((s) => s.setPendingMessage)

  const handleSubmit = (message: string) => {
    // 핸드오프: history 적재는 ChatPage 의 useStream 이 전담한다.
    // 홈에서는 보낼 메시지만 넘기고 채팅으로 이동한다.
    setPendingMessage(message)
    navigate('/chat')
  }

  return (
    <div className="mx-auto flex h-full max-w-2xl flex-col items-center justify-center px-4">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-light tracking-tight text-foreground sm:text-3xl">
          오늘은 어떤 다이어트 레시피를 원하세요?
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          음식 이름을 알려주거나, 날씨에 맞는 메뉴를 추천받아 보세요.
        </p>
      </div>
      <div className="w-full">
        <ChatInput onSubmit={handleSubmit} autoFocus />
      </div>
    </div>
  )
}
