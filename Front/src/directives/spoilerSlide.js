import {slideToggle} from "@/plugins/functions.js";

function slide(el) {
  return function(el) {
  
  }
}

let sliderFunc = (el) => f => {
  console.log(el)
  console.log(el.parentNode,el.parentNode.querySelector('[slideBody]'))
  slideToggle(el.parentNode.querySelector('[slideBody]'))
}

export default {
  
  mounted(el, binding) {
    el.addEventListener('click',sliderFunc(el))
    el.removeEventListener('click',slide(el))
  },
  
  beforeUnmount(el) {
    console.log('unmount')
    el.removeEventListener('click',slideToggle.bind(null,el.parentNode.querySelector('[slideBody]'),500))
    el.removeEventListener('click',slide(el))
  }
}