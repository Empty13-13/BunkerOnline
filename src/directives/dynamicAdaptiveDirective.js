let childEl = null
let parent = null
let bindEl = null
let breakpoint = null
let place = null
let index = null
let matchMedia
export default {
  
  mounted(el, binding) {
    
    childEl = el
    parent = el.parentNode
    bindEl = binding.value[0].trim()
    breakpoint = +binding.value[1] || 767
    place = binding.value[2]
    index = 5
    
    matchMedia = window.matchMedia(mediaQuery(breakpoint));
    
    resizeHandler()
    
    matchMedia.addEventListener('change', resizeHandler);
    
    
  },
  
  
  unmounted(el) {
    matchMedia.removeEventListener('change', resizeHandler);
  },
}

function resizeHandler() {
  const width = document.body.clientWidth;
  if (breakpoint>width && document.querySelector('.' + childEl.classList[0])) {
    // index = indexInParent(parent, childEl)
    moveTo(place, childEl, document.querySelector(bindEl))
  }
  else {
    if (childEl.classList.contains('_dynamic_adapt_')) {
      moveBack(parent, childEl, index)
    }
  }
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
  if (parent.children && parent.children[index]!==undefined) {
    parent.children[index].insertAdjacentElement('beforebegin', element);
  }
  else {
    parent.insertAdjacentElement('beforeend', element);
  }
}

function indexInParent(parent, element) {
  const array = Array.prototype.slice.call(parent.children);
  return Array.prototype.indexOf.call(array, element) + 1;
}

function mediaQuery(breakpoint, type = "max") {
  return '(' + type + "-width: " + breakpoint + "px)," + breakpoint;
}
