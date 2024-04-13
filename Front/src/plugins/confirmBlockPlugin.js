import { useConfirmBlockStore } from "@/stores/confirmBlock.js";

/**
 *
 * @param {Node} target
 * @param {function} agreeFunction
 * @param {string} [text='Вы подтверждаете действие?']
 */
export function showConfirmBlock(target, agreeFunction, text = 'Вы подтверждаете действие?') {
  let confirmStore = useConfirmBlockStore()
  console.log(target.parentNode,target.parentNode.tagName,target.parentNode.tagName === 'button')
  if(target.parentNode.tagName.toString().toLowerCase() === 'button'){
    target = target.parentNode
  }
  confirmStore.text = text
  let gap = 10
  
  
  let targetX = target.getBoundingClientRect().left + window.pageXOffset
  let targetY = target.getBoundingClientRect().top + window.pageYOffset
  let offsetX = targetX - confirmStore.width - gap
  let offsetY = targetY - gap
  let resultWidth = confirmStore.width
  if (offsetX<15) {
    if(offsetX<=0) {
      resultWidth = resultWidth - 15 + offsetX
    } else {
      resultWidth = resultWidth - offsetX
    }
    offsetX = 15
  }
  if(offsetY<100){
    offsetY = 110
  }
  
  if(resultWidth<confirmStore.width/3*2) {
    offsetX = 15
    offsetY = targetY - 70 - gap
    resultWidth = confirmStore.width
  }
  
  confirmStore.activate(offsetY,offsetX,agreeFunction,text,resultWidth)
}