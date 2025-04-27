import { create } from 'zustand'

interface NavigationState {
  currentScreen: 'main' | 'settings'
  goToMain: () => void
  goToSettings: () => void
}

const useNavigationStore = create<NavigationState>(set => ({
  currentScreen: 'main',
  goToMain: () => set({ currentScreen: 'main' }),
  goToSettings: () => set({ currentScreen: 'settings' }),
}))

export default useNavigationStore
