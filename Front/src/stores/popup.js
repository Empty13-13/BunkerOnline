import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export const useGlobalPopupStore = defineStore('globalPopup', () => {
  const show = ref(false)
  const title = ref('')
  const text = ref('')
  const color = ref('white')
  const isTimer = ref(false)
  let showSeconds = 3
  let timer = setTimeout(() =>{},0)
  
  function activate(title, text, color = 'white', showInTimer = false) {
    if(showInTimer) {
      clearTimeout(timer)
      isTimer.value = true
      timer = setTimeout(() => {
        deactivate()
      },showSeconds*1000)
    } else {
      isTimer.value = false
    }
    this.title = title
    this.text = text
    this.color = color
    show.value = true
  }
  
  function deactivate() {
    clearTimeout(timer)
    show.value = false
  }
  
  return {
    show,
    title,
    text,
    activate,
    deactivate,
    color,
    isTimer
  }
})
