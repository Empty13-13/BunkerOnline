import { useConfirmBlockStore } from "@/stores/confirmBlock.js";
import { resolveUnref, set } from "@vueuse/core";

/**
 *
 * @param target
 * @param {function} agreeFunction
 * @param {string} [text='Вы подтверждаете действие?']
 * @param {string} [position = 'left']
 */
export function showConfirmBlock(target, agreeFunction, text = 'Вы подтверждаете действие?', position = 'left') {
  if (!text) {
    text = 'Вы подтверждаете действие?'
  }
  let confirmStore = useConfirmBlockStore()
  if (target.parentNode.tagName.toString().toLowerCase()==='button') {
    target = target.parentNode
  }
  confirmStore.text = text
  let gap = 10
  let targetX = target.getBoundingClientRect().left + window.pageXOffset
  let targetY = target.getBoundingClientRect().top + window.pageYOffset
  let offsetX = targetX - confirmStore.width - gap
  let offsetY = targetY - gap
  let resultWidth = confirmStore.width
  let resultData = {
    offsetX,
    offsetY,
    resultWidth
  }
  
  if (position==='right') {
    resultData = getRightPosition(target, gap)
  }
  else {
    resultData = getLeftPosition(targetX, targetY, offsetX, offsetY, gap, resultWidth)
  }
  
  //Если окно получилось слишком маленьким
  if (resultData.resultWidth<confirmStore.width / 5 * 4) {
    resultData = setUp(target, gap,position)
  }
  
  offsetX = resultData.offsetX
  offsetY = resultData.offsetY
  resultWidth = resultData.resultWidth
  
  
  confirmStore.activate(offsetY, offsetX, agreeFunction, text, resultWidth)
}

/**
 *
 * @param targetX
 * @param targetY
 * @param offsetX
 * @param offsetY
 * @param gap
 * @param resultWidth
 * @returns {{offsetX: number, offsetY: number, resultWidth: number}}
 */
function getLeftPosition(targetX, targetY, offsetX, offsetY, gap, resultWidth) {
  let confirmStore = useConfirmBlockStore()
  
  if (offsetX<15) {
    if (offsetX<=0) {
      resultWidth = resultWidth - 15 + offsetX
    }
    else {
      resultWidth = resultWidth - offsetX
    }
    offsetX = 15
  }
  if (offsetY<100) {
    offsetY = 110
  }
  
  return {offsetX, offsetY, resultWidth}
  
}

/**
 *
 * @param target
 * @param {number} gap
 * @returns {{offsetX: number, offsetY: number, resultWidth: number}}
 */
function getRightPosition(target, gap) {
  let confirmStore = useConfirmBlockStore()
  const targetInfo = getTargetInfo(target)
  let offsetX = targetInfo.x + targetInfo.width + gap
  let offsetY = targetInfo.y - gap
  let resultWidth = confirmStore.width
  
  if (offsetX + resultWidth + gap>window.innerWidth) {
    if (offsetX + resultWidth>window.innerWidth - gap) {
      resultWidth = resultWidth - (offsetX + resultWidth - window.innerWidth + gap) - gap
    }
    else {
      resultWidth = resultWidth - gap
    }
  }
  if (offsetY<100) {
    offsetY = 110
  }
  
  return {offsetX, offsetY, resultWidth}
  
}

function setUp(target,gap, position) {
  let confirmStore = useConfirmBlockStore()
  const targetInfo = getTargetInfo(target)
  let offsetX = 15
  if(position==='right') {
    offsetX = window.innerWidth - gap - confirmStore.width
  }
  let offsetY = targetInfo.y - 70 - gap
  let resultWidth = confirmStore.width
  
  return {offsetX, offsetY, resultWidth}
}

/**
 * @param target
 * @returns {{x: number, width: number, y: number}}
 */
function getTargetInfo(target) {
  let targetX = target.getBoundingClientRect().left + window.pageXOffset
  let targetY = target.getBoundingClientRect().top + window.pageYOffset
  let targetWidth = target.offsetWidth
  
  return {x: targetX, y: targetY, width: targetWidth}
}