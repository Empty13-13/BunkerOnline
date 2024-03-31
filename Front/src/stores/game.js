import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export const useGlobalPopupStore = defineStore('globalPopup', () => {
  const myGameIds = ref([])
  
  const isHost = computed(() => {
  
  })
  
  return {
    myGameIds
  }
})
