import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { parseRecipeReply } from '@/lib/parseRecipeReply'
import WeatherHeader from '@/components/chat/WeatherHeader'
import PurchaseInfo from '@/components/chat/PurchaseInfo'

// DESIGN.md 토큰/타이포로 마크다운 엘리먼트 매핑
const markdownComponents: Components = {
  h1: ({ children }) => <h1 className="text-lg font-semibold">{children}</h1>,
  h2: ({ children }) => <h2 className="text-base font-semibold">{children}</h2>,
  h3: ({ children }) => (
    <h3 className="text-sm font-semibold text-body-strong">{children}</h3>
  ),
  p: ({ children }) => <p className="leading-relaxed">{children}</p>,
  ul: ({ children }) => <ul className="list-disc space-y-1 pl-5">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal space-y-1 pl-5">{children}</ol>,
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  hr: () => <hr className="my-1 border-hairline" />,
  strong: ({ children }) => (
    <strong className="font-semibold text-body-strong">{children}</strong>
  ),
  code: ({ children }) => (
    <code className="rounded-sm bg-surface-strong px-1 py-0.5 text-[0.85em]">
      {children}
    </code>
  ),
  a: ({ children, href }) => (
    <a href={href} target="_blank" rel="noreferrer" className="text-signal underline">
      {children}
    </a>
  ),
}

interface Props {
  content: string
}

/**
 * 어시스턴트 응답 본문 — 날씨 헤더(📅) 칩 + 마크다운 본문 + 구매 정보(🛒) 카드.
 * 채팅 버블과 즐겨찾기 카드가 동일한 응답 표현을 공유하도록 분리한 표현 전용 컴포넌트.
 * 바깥 래퍼(버블·카드 chrome)는 호출 측에서 결정한다.
 */
export default function RecipeContent({ content }: Props) {
  // 날씨 헤더(📅)·구매 정보(🛒)를 본문에서 분리 — 마커 없으면 body == content
  const { weather, body, purchase } = parseRecipeReply(content)

  return (
    <div className="flex flex-col gap-2">
      {weather && <WeatherHeader weather={weather} />}
      {body && (
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
          {body}
        </ReactMarkdown>
      )}
      {purchase.length > 0 && <PurchaseInfo items={purchase} />}
    </div>
  )
}
