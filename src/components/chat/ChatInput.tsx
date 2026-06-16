import { useState, type KeyboardEvent } from 'react'
import { ArrowUp } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
  onSubmit: (message: string) => void
  disabled?: boolean
  placeholder?: string
  autoFocus?: boolean
}

export default function ChatInput({
  onSubmit,
  disabled = false,
  placeholder = '메시지를 입력하세요',
  autoFocus = false,
}: Props) {
  const [value, setValue] = useState('')
  const trimmed = value.trim()
  const canSubmit = trimmed.length > 0 && !disabled

  const submit = () => {
    if (!canSubmit) return
    onSubmit(trimmed)
    setValue('')
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== 'Enter' || event.shiftKey) return
    event.preventDefault()
    submit()
  }

  return (
    <div className="flex items-end gap-2 rounded-full border border-hairline-strong bg-surface p-2 pl-4">
      <textarea
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder={placeholder}
        autoFocus={autoFocus}
        rows={1}
        aria-label="메시지 입력"
        className="max-h-40 min-h-9 flex-1 resize-none bg-transparent px-2 py-1.5 text-base text-foreground placeholder:text-muted-foreground focus:outline-none disabled:opacity-50 sm:text-sm"
      />
      <Button size="icon" aria-label="전송" onClick={submit} disabled={!canSubmit}>
        <ArrowUp />
      </Button>
    </div>
  )
}
