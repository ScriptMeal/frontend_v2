import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import AppLayout from '@/components/layout/AppLayout'
import HomePage from '@/pages/HomePage'
import ChatPage from '@/pages/ChatPage'
import FavoritesPage from '@/pages/FavoritesPage'
import DevPlaygroundPage from '@/pages/DevPlaygroundPage'
import { seedDevData } from '@/lib/devSeed'

const queryClient = new QueryClient()

// DEV 전용 — 백엔드 없이 과거 세션 조회 흐름을 시연하기 위한 mock 데이터 시드.
// 프로덕션 빌드에서는 이 블록이 트리셰이킹된다.
if (import.meta.env.DEV) {
  seedDevData(queryClient)
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppLayout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/favorites" element={<FavoritesPage />} />
            {/* DEV 전용 — mock 데이터로 채팅 UI 확인 (/dev) */}
            <Route path="/dev" element={<DevPlaygroundPage />} />
          </Routes>
        </AppLayout>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
