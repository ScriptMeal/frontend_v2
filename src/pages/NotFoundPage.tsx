import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import AuraBackground from '@/components/common/AuraBackground'

/**
 * 404 — 매칭되는 라우트가 없을 때 보여주는 페이지.
 * vercel.json 의 SPA fallback(rewrite → index.html) 덕분에 서버가 직접 404 를
 * 반환하지 않으므로, 알 수 없는 경로는 catch-all 라우트(App.tsx `path="*"`)가 이 페이지로 처리한다.
 */
export default function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <div className="relative isolate flex h-full flex-col items-center justify-center overflow-hidden px-4 text-center">
      <AuraBackground />
      <p className="text-6xl font-light tracking-tight text-foreground sm:text-7xl">404</p>
      <h1 className="mt-4 text-xl font-light tracking-tight text-foreground sm:text-2xl">
        페이지를 찾을 수 없어요
      </h1>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        주소가 바뀌었거나 삭제된 페이지일 수 있어요. 홈에서 새 레시피를 찾아보세요.
      </p>
      <Button className="mt-8" onClick={() => navigate('/')}>
        홈으로 돌아가기
      </Button>
    </div>
  )
}
