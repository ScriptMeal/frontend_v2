import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import RecipeContent from './RecipeContent'

describe('RecipeContent — 마크다운 렌더 엣지케이스', () => {
  it('순서 항목 사이에 불릿이 끼어도 하나의 순서 리스트로 렌더한다 (1. 마침표형)', () => {
    const content = '1. 로제업떡볶이\n- 떡 양은 줄이고\n\n1. 닭가슴살볼\n- 여름에 잘 맞는\n\n1. 두부면\n- 면은 두부'
    const { container } = render(<RecipeContent content={content} />)

    expect(container.querySelectorAll('ol')).toHaveLength(1)
    const ol = container.querySelector('ol')!
    expect(ol.querySelectorAll(':scope > li')).toHaveLength(3)
  })

  it('순서 항목 사이에 불릿이 끼어도 하나의 순서 리스트로 렌더한다 (1) 괄호형 — LLM 실출력)', () => {
    // LLM 실제 출력이 1) 형식임을 확인 후 추가
    const content = '1) 오이냉국수\n- 시원하게 먹는 여름형 국수\n\n2) 새우살 레몬 샐러드볼\n- 상큼하게 먹는 샐러드\n\n3) 닭가슴살 볶음밥\n- 고단백 한 끼'
    const { container } = render(<RecipeContent content={content} />)

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
