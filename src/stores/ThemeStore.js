import { defineStore } from 'pinia'

export const useThemeStore = defineStore('themeStore', {
  state: () => ({
    isDark: false,
  }),
  actions: {
    toggleTheme() {
      this.isDark = !this.isDark
      this.applyTheme()
    },
    setTheme(dark) {
      this.isDark = dark
      this.applyTheme()
    },
    applyTheme() {
      const html = document.documentElement
      html.classList.toggle('dark', this.isDark)
      localStorage.setItem('themeStore', this.isDark ? 'dark' : 'light')
    },
    loadTheme() {
      const saved = localStorage.getItem('themeStore')
      this.isDark = saved === 'dark'
      this.applyTheme()
    }
  }
})
