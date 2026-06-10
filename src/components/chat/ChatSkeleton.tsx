import { Skeleton } from '@/components/ui/skeleton'

/** 버블 한 줄의 자리표시 — 정렬/모서리는 실제 ChatBubble 을 모사한다. */
interface RowProps {
  side: 'assistant' | 'user'
  widths: string[]
}

function BubbleRow({ side, widths }: RowProps) {
  const isAssistant = side === 'assistant'
  return (
    <div
      data-testid="chat-skeleton-bubble"
      className={
        isAssistant
          ? 'mr-auto flex max-w-[78%] flex-col gap-2 rounded-lg rounded-bl-none border border-hairline bg-surface px-4 py-3'
          : 'ml-auto flex max-w-[60%] flex-col gap-2 rounded-lg rounded-br-none bg-surface-strong px-4 py-3'
      }
    >
      {widths.map((w, i) => (
        <Skeleton key={i} className={`h-3.5 ${w} ${isAssistant ? '' : 'bg-hairline'}`} />
      ))}
    </div>
  )
}

/**
 * 읽기 전용 채팅(GET /api/history) 로딩 자리표시.
 * 좌(assistant)/우(user) 교차 버블로 채팅 프레임을 유지해 빈 화면 플래시를 없앤다.
 * role=status + sr-only 라벨로 기존 StateMessage(loading) 와 동일한 접근성을 보장한다.
 */
export default function ChatSkeleton() {
  return (
    <div
      role="status"
      aria-busy="true"
      className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-4 py-6"
    >
      <span className="sr-only">대화 기록을 불러오는 중…</span>
      <BubbleRow side="assistant" widths={['w-1/2', 'w-4/5']} />
      <BubbleRow side="user" widths={['w-3/4']} />
      <BubbleRow side="assistant" widths={['w-2/3', 'w-full', 'w-2/5']} />
      <BubbleRow side="user" widths={['w-1/2']} />
    </div>
  )
}
