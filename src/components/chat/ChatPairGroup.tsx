interface Props {
  /** user 말풍선 렌더 노드 */
  userBubble: React.ReactNode
  /** assistant 말풍선 렌더 노드 (없으면 스트리밍 직전 상태) */
  assistantBubble?: React.ReactNode
}

/**
 * user+assistant 버블 쌍을 세로로 묶는 래퍼.
 *
 * 삭제·즐겨찾기 등 turn 액션은 assistant 버블 푸터(ChatBubble)에서 처리한다.
 * 이 컴포넌트는 한 turn 을 묶는 그룹 경계(role="group")와 간격만 책임진다.
 */
export default function ChatPairGroup({ userBubble, assistantBubble }: Props) {
  return (
    <div role="group" className="flex flex-col gap-1.5">
      {userBubble}
      {assistantBubble}
    </div>
  )
}
