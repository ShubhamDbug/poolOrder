// src/contexts/ThemeContext.jsx
import React from 'react'
export const ThemeContext = React.createContext({ dark:false, toggle:()=>{} })
export function ThemeProvider({ children }) {
  const [dark, setDark] = React.useState(false)
  const toggle = React.useCallback(()=> setDark(d=>!d), [])
  React.useEffect(()=> {
    if (dark) document.documentElement.classList.add('dark')
    else document.documentElement.classList.remove('dark')
  }, [dark])
  return <ThemeContext.Provider value={{dark, toggle}}>{children}</ThemeContext.Provider>
}
