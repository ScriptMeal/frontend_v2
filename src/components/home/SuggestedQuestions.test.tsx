import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SuggestedQuestions from './SuggestedQuestions'
import type { SuggestedQuestion } from '@/lib/suggestedQuestions'

const questions: SuggestedQuestion[] = [
  { text: '다이어트 떡볶이 레시피 알려줘', intent: 'SPECIFIC_FOOD' },
  { text: '오늘 날씨에 어울리는 메뉴 추천해줘', intent: 'GENERAL_RECIPE' },
  { text: '운동 후 먹기 좋은 음식 추천해줘', intent: 'GENERAL_RECIPE' },
]

describe('SuggestedQuestions', () => {
  it('전달한 질문 수만큼 버튼을 렌더한다 (happy)', () => {
    render(<SuggestedQuestions questions={questions} onSelect={() => {}} />)
    expect(screen.getAllByRole('button')).toHaveLength(3)
    expect(screen.getByRole('button', { name: '다이어트 떡볶이 레시피 알려줘' })).toBeInTheDocument()
  })

  it('칩 클릭 시 onSelect 를 해당 질문 텍스트로 호출한다 (happy)', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(<SuggestedQuestions questions={questions} onSelect={onSelect} />)

    await user.click(screen.getByRole('button', { name: '운동 후 먹기 좋은 음식 추천해줘' }))
    expect(onSelect).toHaveBeenCalledExactlyOnceWith('운동 후 먹기 좋은 음식 추천해줘')
  })

  it('질문이 없으면 버튼을 렌더하지 않는다 (edge)', () => {
    render(<SuggestedQuestions questions={[]} onSelect={() => {}} />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})
