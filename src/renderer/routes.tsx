import React from 'react'
import { Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { MainScreen } from './screens/main'
import { Settings } from './screens/settings'

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<MainScreen />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  )
}
