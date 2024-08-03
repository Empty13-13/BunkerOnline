import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export const useMetaStore = defineStore('metaStore', () => {
  const title = "Бункер Онлайн"
  
  function setTitle(titleStr = null) {
    document.title = titleStr || title.value
  }
  
  return {
    title,
    setTitle
  }
})