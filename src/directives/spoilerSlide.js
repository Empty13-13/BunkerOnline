import {slideToggle} from "@/plugins/functions.js";

function slide(el) {
  return function(el) {
    slideToggle(el.target.parentNode.querySelector('[slideBody]'))
  }
}

export default {
  
  mounted(el, binding) {
    el.addEventListener('click',slide(el))
    el.removeEventListener('click',slide(el))
  },
  
  beforeUnmount(el) {
    console.log('unmount')
    el.removeEventListener('click',slideToggle.bind(null,el.parentNode.querySelector('[slideBody]'),500))
    el.removeEventListener('click',slide(el))
  }
}