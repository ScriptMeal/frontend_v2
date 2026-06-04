import { parseRecipeReply } from './parseRecipeReply'

/**
 * 즐겨찾기 접이식/타일 카드의 한 줄 미리보기 텍스트를 만든다.
 * 날씨 헤더(📅)·구매 정보(🛒)를 떼어낸 본문에서 첫 비어있지 않은 줄을 골라
 * 마크다운 마커(헤딩·리스트·굵게)를 제거하고 maxLength 로 자른다.
 */
export function recipePreview(reply: string, maxLength = 60): string {
  const { body } = parseRecipeReply(reply)

  const firstLine = body
    .split('\n')
    .map((line) => line.trim())
    .find(Boolean)
  if (!firstLine) return ''

  const plain = firstLine
    .replace(/^#{1,6}\s*/, '') // 헤딩 마커
    .replace(/^[-*]\s*/, '') // 리스트 마커
    .replace(/\*\*/g, '') // 굵게
    .trim()

  if (plain.length <= maxLength) return plain
  return `${plain.slice(0, maxLength)}…`
}
