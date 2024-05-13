import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export const usePreloaderStore = defineStore('preloader', () => {
  const showLoader = ref(false)
  
  function activate() {
    showLoader.value = true
  }
  
  function deactivate() {
    showLoader.value = false
  }
  
  return {showLoader,activate,deactivate}
})
