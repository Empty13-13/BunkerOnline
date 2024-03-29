import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export const useGlobalPopupStore = defineStore('globalPopup', () => {
  const show = ref(false)
  const title = ref('')
  const text = ref('')
  const color = ref('white')
  
  function activate(title, text, color = 'white') {
    this.title = title
    this.text = text
    this.color = color
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
    color
  }
})
