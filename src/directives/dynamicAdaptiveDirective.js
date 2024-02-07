let interval
let defaultColor

export default {
  mounted(el, binding) {
    const breakpoint = +binding.value[1]
    const place = binding.value[2]
    let index = indexInParent(el.parentNode, el)
    
    resizeHandler()
    
    window.addEventListener('resize', resizeHandler);
    
    function resizeHandler() {
      const width = document.body.clientWidth;
      if (breakpoint>width && document.querySelector('.'+el.classList[0])) {
        moveTo(place, el, document.querySelector(binding.value[0].trim()))
      }
      else {
        if (el.classList.contains('_dynamic_adapt_')) {
          moveBack(el.parentNode, el, index)
        }
      }
    }
  },
  
  
  unmounted(el) {
  },
}

function moveTo(place, element, destination) {
  element.classList.add('_dynamic_adapt_');
  if (place==='last' || place>=destination.children.length) {
    destination.insertAdjacentElement('beforeend', element);
    return;
  }
  if (place==='first') {
    destination.insertAdjacentElement('afterbegin', element);
    return;
  }
  destination.children[place].insertAdjacentElement('beforebegin', element);
  
}

function moveBack(parent, element, index) {
  element.classList.remove('_dynamic_adapt_');
  if (parent.children[index]!==undefined) {
    parent.children[index].insertAdjacentElement('beforebegin', element);
  }
  else {
    parent.insertAdjacentElement('beforeend', element);
  }
}

function indexInParent(parent, element) {
  const array = Array.prototype.slice.call(parent.children);
  return Array.prototype.indexOf.call(array, element)+1;
}

