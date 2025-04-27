import ReactDom from 'react-dom/client'
import React from 'react'
import { MainScreen } from './screens/main'
import { Settings } from './screens/settings'
import { Layout } from './components/Layout'
import useNavigationStore from './stores/navigationStore'
import './globals.css'

function App() {
  const { currentScreen } = useNavigationStore()

  return (
    <Layout>
      {currentScreen === 'main' && <MainScreen />}
      {currentScreen === 'settings' && <Settings />}
    </Layout>
  )
}

ReactDom.createRoot(document.querySelector('app') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
