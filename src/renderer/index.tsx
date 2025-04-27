import ReactDom from 'react-dom/client'
import React from 'react'
import { HashRouter as Router } from 'react-router-dom'
import { AppRoutes } from './routes'
import './globals.css'

ReactDom.createRoot(document.querySelector('app') as HTMLElement).render(
  <React.StrictMode>
    <Router>
      <AppRoutes />
    </Router>
  </React.StrictMode>
)
