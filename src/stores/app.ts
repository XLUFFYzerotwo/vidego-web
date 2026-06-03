import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAppStore = defineStore('app', () => {
  const sidebarCollapsed = ref(false)
  const searchKeyword = ref('')

  function toggleSidebar() {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }

  function setSearchKeyword(keyword: string) {
    searchKeyword.value = keyword
  }

  return { sidebarCollapsed, searchKeyword, toggleSidebar, setSearchKeyword }
})
