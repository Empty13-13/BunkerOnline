import {slideToggle} from "@/plugins/functions.js";

function slide(el) {
  return function(el) {
  
  }
}

let sliderFunc = (el) => f => {
  slideToggle(el.parentNode.querySelector('[slideBody]'))
  el.classList.toggle('_slide-active-title')
}

export default {
  
  mounted(el, binding) {
    el.addEventListener('click',sliderFunc(el))
    el.removeEventListener('click',slide(el))
  },
  
  beforeUnmount(el) {
    el.removeEventListener('click',slideToggle.bind(null,el.parentNode.querySelector('[slideBody]'),500))
    el.removeEventListener('click',slide(el))
  }
}