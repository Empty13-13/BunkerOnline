import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export const useConfirmBlockStore = defineStore('confirmBlock', () => {
  const top = ref(0)
  const left = ref(0)
  const showBlock = ref(false)
  const width = ref(0)
  const currentWidth = ref(0)
  const action = ref(() => {})
  const text = ref('Вы подтверждаете действие?')
  const showLoader = ref(false)
  
  function activate(topX,leftY,actionConfirm,textConfirm = 'Вы подтверждаете действие?',widthConfirm=0) {
    top.value = topX
    left.value = leftY
    action.value = actionConfirm
    text.value = textConfirm
    currentWidth.value = widthConfirm
    showBlock.value = true
  }
  
  function deactivate() {
    currentWidth.value = 0
    showBlock.value = false
  }
  
  return {
    top,
    left,
    showBlock,
    width,
    activate,
    deactivate,
    action,
    text,
    currentWidth,
    showLoader
  }
})