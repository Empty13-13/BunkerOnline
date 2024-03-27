import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export const useGlobalPopupStore = defineStore('globalPopup', () => {
  const show = ref(false)
  const title = ref('')
  const text = ref('')
  
  function activate(title,text) {
    this.title = title
    this.text = text
    show.value = true
  }
  
  function deactivate() {
    show.value = false
  }
  
  return {
    show,
    title,
    text,
    activate,
    deactivate,
  }
})
