import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import RecipeContent from './RecipeContent'

describe('RecipeContent — 마크다운 렌더 엣지케이스', () => {
  it('순서 항목 사이에 불릿이 끼어도 하나의 순서 리스트로 렌더한다 (번호 1·2·3)', () => {
    // 원본: 각 항목이 1. 이고 컬럼0 불릿이 끼어 OL 이 쪼개지던 케이스
    const content = '1. 로제업떡볶이\n- 떡 양은 줄이고\n\n1. 닭가슴살볼\n- 여름에 잘 맞는\n\n1. 두부면\n- 면은 두부'
    const { container } = render(<RecipeContent content={content} />)

    // 쪼개진 3개 OL → 하나의 연속 OL 로 합쳐진다
    expect(container.querySelectorAll('ol')).toHaveLength(1)
    const ol = container.querySelector('ol')!
    expect(ol.querySelectorAll(':scope > li')).toHaveLength(3)
  })

  it('범위용 단일 물결표(~)에 취소선을 적용하지 않는다', () => {
    const content = '재료를 5~10분 끓인 뒤 2~3분 더 졸입니다.'
    const { container } = render(<RecipeContent content={content} />)

    expect(container.querySelector('del')).toBeNull()
    expect(container.querySelector('s')).toBeNull()
    expect(container.textContent).toContain('5~10분 끓인 뒤 2~3분')
  })
})
