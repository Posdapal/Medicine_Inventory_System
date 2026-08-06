import React, { createContext, useEffect, useState } from 'react'
export const ThemeCotext = createContext()

const ThemeContextProvider = ({children}) => {
    const [theme, setTheme] = useState(() => {
        const savedTheme = localStorage.getItem("medicine-inventory-theme")
        if (savedTheme === "light" || savedTheme === "dark") return savedTheme
        return window.matchMedia?.("(prefers-color-scheme: light)").matches ? "light" : "dark"
    })

    useEffect(() => {
        document.documentElement.classList.toggle("dark", theme === "dark")
        document.documentElement.style.colorScheme = theme
        localStorage.setItem("medicine-inventory-theme", theme)
    }, [theme])

    const toggleTheme = () => {
        setTheme((currentTheme) => currentTheme === "light" ? "dark" : "light")
    }
  return (
    <ThemeCotext.Provider value={{theme, setTheme, toggleTheme}}>
        {children}
    </ThemeCotext.Provider>
  )
}

export default ThemeContextProvider
