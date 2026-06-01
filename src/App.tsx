import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AnimatePresence, MotionConfig, motion } from 'framer-motion'
import AppLayout from '@/components/layout/AppLayout'
import HomePage from '@/pages/HomePage'
import ChatPage from '@/pages/ChatPage'
import FavoritesPage from '@/pages/FavoritesPage'
import DevPlaygroundPage from '@/pages/DevPlaygroundPage'

const queryClient = new QueryClient()

/** 페이지 전환 — 경로별로 opacity 페이드 (DESIGN.md §8, 0.2s easeOut) */
function AnimatedRoutes() {
  const location = useLocation()
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="h-full"
      >
        {/* location 을 고정해 전환 중 exit 페이지가 이전 라우트를 유지하도록 한다 */}
        <Routes location={location}>
          <Route path="/" element={<HomePage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/favorites" element={<FavoritesPage />} />
          {/* DEV 전용 — mock 데이터로 채팅 UI 확인 (/dev) */}
          <Route path="/dev" element={<DevPlaygroundPage />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <MotionConfig reducedMotion="user">
        <BrowserRouter>
          <AppLayout>
            <AnimatedRoutes />
          </AppLayout>
        </BrowserRouter>
      </MotionConfig>
    </QueryClientProvider>
  )
}
