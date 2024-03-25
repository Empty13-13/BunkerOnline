import { slideDown, slideUp } from "@/plugins/functions.js";
import { clearError } from "@/plugins/auth.js";

export function setErrorForInput(inputName, textSmall) {
  let input = document.querySelector(`[name=${inputName}]`)
  let small = input.parentNode.querySelector('small')
  
  input.classList.add('_error')
  small.textContent = textSmall
  small.style.opacity = "1"
  slideDown(small,200)
}
export function focusInInput(e) {
  console.log(e)
  clearError(e.target)
  slideUp(e.target.parentNode.querySelector('small'),200)
}