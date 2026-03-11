'use client'

import { createContext, useContext, useState, type ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

type Theme = 'dark' | 'light'

const ThemeContext = createContext<{
  theme: Theme
  setTheme: (t: Theme) => void
}>({
  theme: 'light',
  setTheme: () => {},
})

export const useMarketingTheme = () => useContext(ThemeContext)

export function MarketingThemeProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const [theme, setTheme] = useState<Theme>('light')
  const dark = theme === 'dark'

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      <div
        className={`min-h-screen transition-colors duration-700 ease-in-out custom-cursor-active ${
          dark ? 'bg-[#0A0A0A] text-white' : 'bg-[#FAFAF8] text-[#0B1220]'
        }`}
      >
        {children}
      </div>
    </ThemeContext.Provider>
  )
}
