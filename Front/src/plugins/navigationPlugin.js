import router from "@/router/index.js";

let navigationTimer = setTimeout(() => {},2000)

export function openNavigation(navBlock) {
  navBlock.classList.add('_active')
  clearTimeout(navigationTimer)
  navigationTimer = setTimeout(() => {
    navBlock.classList.remove('_active')
  }, 2000)
}
export function goToBlock(id) {
  router.replace(`#${id}`)
}

export function showInfoHandler(e){
  const element = e.target
  const info = element.parentNode.querySelector('.navigation__window')
  
  if(element && info) {
    info.classList.add('_active')
    setTimeout(() => info.classList.remove('_active'),500)
  }
}
