/**
 * LLM 응답에서 "순서 항목(`1.`) 바로 다음 줄에 들여쓰기 없이 붙은 불릿(`-`)"을
 * 그 순서 항목 하위로 들여써, 끊기지 않는 하나의 순서 리스트로 만든다.
 *
 * 배경: CommonMark 는 컬럼 0 의 다른 마커(`- `)가 순서 리스트를 중단시켜 OL 을 쪼갠다.
 * 쪼개진 단일 항목 OL 은 각각 start=1 로 렌더돼 화면에 `1. 1. 1.` 로 반복된다.
 * 불릿을 항목 하위로 중첩하면 OL 이 끊기지 않아 `1·2·3` 자동 증가로 표시되고,
 * 설명 불릿은 단계 하위 항목으로 위계가 잡힌다.
 * (.claude/debugging/20260616-markdown-list-numbering-and-tilde-strikethrough.md)
 *
 * 안전장치:
 * - "바로 윗줄"이 순서 항목이거나 직전에 중첩한 불릿일 때만 들여쓴다.
 *   빈 줄 뒤에 오는 불릿(별도로 의도된 목록)은 건드리지 않는다.
 * - 코드펜스(``` / ~~~) 내부는 변환하지 않는다.
 * - 들여쓰기 폭은 순서 마커 너비(`1. `=3, `10. `=4)에 맞춘다.
 */
export function nestOrderedSubBullets(markdown: string): string {
  const orderedRe = /^(\d+[.)][ \t]+)/
  const bulletRe = /^[-*+][ \t]+/
  const fenceRe = /^(```|~~~)/

  let indent = ''
  let prev: 'ordered' | 'nested' | 'other' = 'other'
  let inFence = false

  return markdown
    .split('\n')
    .map((line) => {
      if (fenceRe.test(line)) {
        inFence = !inFence
        prev = 'other'
        return line
      }
      if (inFence) return line

      const ordered = line.match(orderedRe)
      if (ordered) {
        indent = ' '.repeat(ordered[1].length)
        prev = 'ordered'
        return line
      }

      if (bulletRe.test(line) && (prev === 'ordered' || prev === 'nested')) {
        prev = 'nested'
        return indent + line
      }

      prev = 'other'
      return line
    })
    .join('\n')
}
