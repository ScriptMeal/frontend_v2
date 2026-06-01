export interface Message {
  role: 'user' | 'assistant'
  content: string
}

export interface Session {
  id: string
  createdAt: string
  preview?: string
}

export interface HistoryRecord {
  id: number
  session_id: string
  user_message: string
  assistant_reply: string
  created_at: string
}

export interface FavoriteRecord {
  id: number
  session_id: string
  user_message: string
  recipe_reply: string
  created_at: string
}

export interface StreamEvent {
  type: 'tool_start' | 'chunk' | 'done'
  value?: string
  tool?: string
}

export interface ChatRequest {
  message: string
  history: Message[]
  session_id: string
}
