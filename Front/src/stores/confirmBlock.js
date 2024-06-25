import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { isAsync } from "@/plugins/functions.js";

export const useConfirmBlockStore = defineStore('confirmBlock', () => {
  const top = ref(0)
  const left = ref(0)
  const showBlock = ref(false)
  const width = ref(0)
  const currentWidth = ref(0)
  const action = ref(() => {
  })
  const text = ref('Вы подтверждаете действие?')
  const showLoader = ref(false)
  const timeout = ref(setTimeout(() => {
  }, 5000))
  
  function activate(topX, leftY, actionConfirm, textConfirm = 'Вы подтверждаете действие?', widthConfirm = 0) {
    clearInterval(timeout.value)
    top.value = topX
    left.value = leftY
    action.value = actionConfirm
    text.value = textConfirm
    currentWidth.value = widthConfirm
    showBlock.value = true
    document.querySelector('.confirmPopup').focus()
    
    timeout.value = setTimeout(() => {
      deactivate()
    }, 5000)
  }
  
  function deactivate() {
    currentWidth.value = 0
    showBlock.value = false
    clearInterval(timeout.value)
  }
  
  async function _yesHandler() {
    showLoader.value = true
    if (isAsync(action.value)) {
      try {
        await action.value()
      } catch(e) {
        console.log(e)
      } finally {
        deactivate()
      }
    }
    else {
      action.value()
    }
    deactivate()
    showLoader.value = false
  }
  
  async function _enterHandler() {
    console.log('enterHandler')
    if (showBlock.value) {
      await _yesHandler()
    }
  }
  
  function activateTimer() {
    timeout.value = setTimeout(() => {
      deactivate()
    }, 5000)
  }
  
  function deactivateTimer() {
    clearInterval(timeout.value)
  }
  
  return {
    top,
    left,
    showBlock,
    width,
    action,
    text,
    currentWidth,
    showLoader,
    activate,
    deactivate,
    _yesHandler,
    _enterHandler,
    activateTimer,
    deactivateTimer,
  }
})