import { Outlet, useLocation } from 'react-router-dom'
import { TitleBar } from './TitleBar'

import { StatusBar } from './status-bar'

export function Layout() {
  const { pathname } = useLocation()

  const isMainPage = pathname === '/' || pathname === '/index.html'

  return (
    <div className="flex flex-col h-screen">
      {/* TitleBar - fixed at top */}
      <div>
        <TitleBar />
      </div>

      {/* Outlet - scrollable content area */}
      <div className="flex-1 overflow-auto">
        <Outlet />
      </div>

      {/* StatusBar - fixed at bottom */}
      {isMainPage && (
        <div className="mt-2">
          <StatusBar />
        </div>
      )}
    </div>
  )
}
