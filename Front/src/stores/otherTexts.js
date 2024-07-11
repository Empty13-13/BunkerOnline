import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import axiosInstance from "@/api.js";

export const useOtherTextsStore = defineStore('otherTexts', () => {
  const allTexts = ref({})
  async function downloadAllTexts() {
    try {
      let allTextsData = await axiosInstance.get(`/otherText/all`)
      allTexts.value = allTextsData.data
    } catch(e) {
      console.log('Ошибка при попытке взять все текста')
    }
    

  }
  
  return {
    allTexts,
    downloadAllTexts,
  }
})
