// Вспомогательные модули плавного раскрытия и закрытия объекта ======================================================================================================================================================================
import { computed } from "vue";
import router from "@/router/index.js";

export let slideDown = (target, duration = 500, showmore = 0) => {
  if (!target.classList.contains('_slide') && target.hidden) {
    target.classList.add('_slide');
    target.hidden = target.hidden? false:null;
    showmore? target.style.removeProperty('height'):null;
    let height = target.offsetHeight;
    target.style.overflow = 'hidden';
    target.style.height = showmore? `${showmore}px`:`0px`;
    target.style.paddingTop = 0;
    target.style.paddingBottom = 0;
    target.style.marginTop = 0;
    target.style.marginBottom = 0;
    target.offsetHeight;
    target.style.transitionProperty = "height, margin, padding";
    target.style.transitionDuration = duration + 'ms';
    target.style.height = height + 'px';
    target.style.removeProperty('padding-top');
    target.style.removeProperty('padding-bottom');
    target.style.removeProperty('margin-top');
    target.style.removeProperty('margin-bottom');
    window.setTimeout(() => {
      target.style.removeProperty('height');
      target.style.removeProperty('overflow');
      target.style.removeProperty('transition-duration');
      target.style.removeProperty('transition-property');
      target.classList.remove('_slide');
      // Создаем событие
      document.dispatchEvent(new CustomEvent("slideDownDone", {
        detail: {
          target: target
        }
      }));
    }, duration);
  }
}
export let slideUp = (target, duration = 500, showmore = 0) => {
  if (!target.classList.contains('_slide')) {
    target.classList.add('_slide');
    target.style.transitionProperty = 'height, margin, padding';
    target.style.transitionDuration = duration + 'ms';
    target.style.height = `${target.offsetHeight}px`;
    target.offsetHeight;
    target.style.overflow = 'hidden';
    target.style.height = showmore? `${showmore}px`:`0px`;
    target.style.paddingTop = 0;
    target.style.paddingBottom = 0;
    target.style.marginTop = 0;
    target.style.marginBottom = 0;
    window.setTimeout(() => {
      target.hidden = !showmore? true:false;
      !showmore? target.style.removeProperty('height'):null;
      target.style.removeProperty('padding-top');
      target.style.removeProperty('padding-bottom');
      target.style.removeProperty('margin-top');
      target.style.removeProperty('margin-bottom');
      !showmore? target.style.removeProperty('overflow'):null;
      target.style.removeProperty('transition-duration');
      target.style.removeProperty('transition-property');
      target.classList.remove('_slide');
      // Создаем событие
      document.dispatchEvent(new CustomEvent("slideUpDone", {
        detail: {
          target: target
        }
      }));
    }, duration);
  }
}
export let slideToggle = (target, duration = 500) => {
  if (target.hidden) {
    return slideDown(target, duration);
  }
  else {
    return slideUp(target, duration);
  }
}


//Функция взятия нужного цвета для определенного уровня доступа
export function getClassForAccess(access) {
  access = access.toLowerCase()
  switch(access) {
    case 'noreg':
      return 'noreg';
    case 'default':
      return 'default';
    case 'mvp':
      return 'goldTextColor';
    case 'vip':
      return 'silverTextColor';
    case 'admin':
      return 'redTextColor';
    case 'banned':
      return 'default'
  }
}

export function getDisplayNameForAccess(access) {
  switch(access) {
    case 'default':
      return 'Пользователь';
    case 'mvp':
      return 'MVP';
    case 'vip':
      return 'VIP';
    case 'admin':
      return 'Админ';
    case 'banned':
      return 'Заблокирован'
  }
}

export function getInsideNameForAccess(access = null) {

}

export function emailTest(value) {
  return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,8})+$/.test(value);
}

export function objIsEmpty(obj) {
  for (let key in obj) {
    return false;
  }
  return true;
}

export function getLinkParams() {
  return window
    .location
    .search
    .replace('?', '')
    .split('&')
    .reduce(
      function(p, e) {
        var a = e.split('=');
        p[decodeURIComponent(a[0])] = decodeURIComponent(a[1]);
        return p;
      },
      {}
    );
  
}

export const getId = computed(() => {
  return router.currentRoute.value.path.split('=')[1]
})

export function isAsync(func) {
  const string = func.toString().trim();
  
  return !!(
    // native
    string.match(/^async /) ||
    // babel (this may change, but hey...)
    string.match(/return _ref[^\.]*\.apply/)
    // insert your other dirty transpiler check
    
    // there are other more complex situations that maybe require you to check the return line for a *promise*
  );
}

export async function copyLinkToBuffer() {
  let result = null
  await navigator.clipboard.writeText(window.location.href)
                 .then(() => result = true)
                 .catch(() => result = false)
  return result
}

export function getLocalData(nameData) {
  try {
    let data = localStorage.getItem(nameData)
    if (data) {
      let json = JSON.parse(data)
      if (json) {
        return json
      }
    }
  } catch(e) {
    console.log(e.message)
  }
  
  return null
}

export function setLocalData(nameData, data) {
  try {
    localStorage.setItem(nameData, JSON.stringify(data))
  } catch(e) {
    console.log(e.message)
  }
}

export function getCountObject(object) {
  console.log(object, object['<target>'])
  if (object.target) {
    object = object.target
  }
  let count = 0
  for (let i of object) {
    count++
  }
  return count
}

export function getPercentForVote(vote, allVoteNum) {
  return ((vote.whoVote.length / allVoteNum) * 100).toFixed(2)
}

export function getRandomInt(min, max) {
  max += 1
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min) + min); // Максимум не включается, минимум включается
}

export function recaptchaMaker(goodFunction, errorFunction = new Function()) {
  grecaptcha.ready(function() {
    grecaptcha.execute('6Lc4kvwpAAAAAKr3ovVCTa7S2aL_4nk8_mV4P1bV', {action: 'submit'})
              .then(async (token) => {
                await goodFunction(token)
              })
              .catch(errorFunction)
  });
}

export function monthsNameForNum(num) {
  let lastNum = num
  
  if(lastNum>10 && lastNum<19) {
    return 'месяцев'
  }
  if (!num % 10<1) {
    lastNum = num % 10
  }
  console.log(lastNum)
  if (lastNum===1) {
    return 'месяц'
  }
  else if (lastNum>1 && lastNum<5) {
    return 'месяца'
  }
  else {
    return 'месяцев'
  }
}

export function openWindow(link) {
  window.open(link)
}