import type { ReactNode } from 'react'
import { TitleBar } from './TitleBar'
import { StatusBar } from './status-bar'
import useNavigationStore from '../stores/navigationStore'

interface LayoutProps {
  children: ReactNode
}

export function Layout({ children }: LayoutProps) {
  const { currentScreen } = useNavigationStore()

  const isMainPage = currentScreen === 'main'

  return (
    <div className="flex flex-col h-screen">
      {/* TitleBar - fixed at top */}
      <div>
        <TitleBar />
      </div>

      {/* Main content area */}
      <div className="flex-1 overflow-auto">{children}</div>

      {/* StatusBar - fixed at bottom */}
      {isMainPage && (
        <div className="mt-2">
          <StatusBar />
        </div>
      )}
    </div>
  )
}
