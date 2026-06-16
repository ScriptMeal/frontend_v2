import { describe, it, expect } from 'vitest'
import { nestOrderedSubBullets } from './nestOrderedSubBullets'

describe('nestOrderedSubBullets', () => {
  it('순서 항목 바로 다음의 컬럼0 불릿을 항목 하위로 들여쓴다 (happy)', () => {
    const input = '1. A\n- x\n\n1. B\n- y'
    // 들여쓰면 OL 이 끊기지 않아 1·2 로 자동 증가한다.
    expect(nestOrderedSubBullets(input)).toBe('1. A\n   - x\n\n1. B\n   - y')
  })

  it('한 항목 아래 연속된 불릿도 모두 들여쓴다 (happy)', () => {
    const input = '1. step\n- sub1\n- sub2'
    expect(nestOrderedSubBullets(input)).toBe('1. step\n   - sub1\n   - sub2')
  })

  it('두 자리 번호는 마커 너비(4)만큼 들여쓴다 (edge)', () => {
    expect(nestOrderedSubBullets('10. step\n- x')).toBe('10. step\n    - x')
  })

  it('빈 줄 뒤의 불릿은 별도 목록으로 보고 건드리지 않는다 (edge, 오중첩 방지)', () => {
    const input = '1. A\n2. B\n\n- note'
    expect(nestOrderedSubBullets(input)).toBe(input)
  })

  it('순서 항목이 선행하지 않는 일반 불릿 목록은 그대로 둔다 (edge)', () => {
    const input = '### 재료\n- 곤약\n- 양념'
    expect(nestOrderedSubBullets(input)).toBe(input)
  })

  it('코드펜스 내부의 1.·- 는 변환하지 않는다 (edge, 코드 보호)', () => {
    const input = '```\n1. A\n- x\n```'
    expect(nestOrderedSubBullets(input)).toBe(input)
  })
})
