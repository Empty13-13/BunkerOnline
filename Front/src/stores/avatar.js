import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export const useGlobalPopupStore = defineStore('globalPopup', () => {
  const showLoader = ref(false)
  
  function activateLoader(title,text) {
    showLoader.value = true
  }
  
  function deactivate() {
    showLoader.value = false
  }
  
  return {
    showLoader,
    activate,
    deactivate
  }
})
