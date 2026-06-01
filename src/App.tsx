import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import AppLayout from '@/components/layout/AppLayout'
import HomePage from '@/pages/HomePage'
import ChatPage from '@/pages/ChatPage'
import FavoritesPage from '@/pages/FavoritesPage'
import DevPlaygroundPage from '@/pages/DevPlaygroundPage'

const queryClient = new QueryClient()

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
