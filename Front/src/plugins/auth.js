import { emailTest, slideUp } from "@/plugins/functions.js";

// const forbiddenCharacters = [
//   '&', '=', '+', '<', '>', ',', "'", '"', '`', '..', '--', ':',
//   '{', '}', '$', '#', '@', '!', '%', '^', '*', '(', ')', '?', '/',
//   '\\', '[', ']', ';', '~', '  '
// ]

const forbiddenCharacters = [
  '#', '@', '=', '+', '<', '>', ',', "'", '"', '`', '..', '--', ';', ',', '  '
]

export function validationRegistration({email, nickname, password, passwordRepeat}) {
  let errors = {}
  
  if (!email || !emailTest(email)) {
    errors['email'] = 'Неправильно введен email'
  }
  
  //Проверка на никнейм
  if (!nickname) {
    errors['nickname'] = 'Длина ника должна быть больше 3 символов'
  }
  else {
    if (nickname.length<3) {
      errors['nickname'] = 'Длина ника должна быть больше 3 символов'
    }
    if (!nickname.length>15) {
      errors['nickname'] = 'Длина ника должна быть меньше 15 символов'
    }
    let errorsInput = forbiddenInputNickname(nickname)
    if (errorsInput.forbiddenCharArray.length) {
      errors['nickname'] = `В поле содержатся недопустимые символы\r\n`
      errors['nickname'] += 'Недопустимые символы: ' + forbiddenCharacters.join(' ').replace('   ',' Двойной пробел') + ''
      // errors['nickname'] += ' ( ' + errorsInput.forbiddenCharArray.join(' ') + ' )'
    }
    
    if(errorsInput.lettersLength) {
      if(!(errors['nickname'] && errors['nickname'].length)) {
        errors['nickname'] = ''
      }
      errors['nickname'] += `\r\nВ нике должно содержаться как минимум 3 буквы`
    }
    if(errorsInput.specCharsLength) {
      if(!(errors['nickname'] && errors['nickname'].length)) {
        errors['nickname'] = ''
      }
      errors['nickname'] += `\r\nВ нике не может быть больше 3 спец символов`
    }
  }
  
  //Проверка на пароль
  if (!password) {
    errors['password'] = 'Вы должны ввести пароль'
  }
  else {
    if (password.length<5) {
      errors['password'] = 'Ваш пароль должен быть больше 5 символов'
    }
    
    if (passwordRepeat!==password) {
      errors['password'] = 'Ваши пароли должны совпадать'
      errors['passwordRepeat'] = 'Ваши пароли должны совпадать'
    }
    
    if (!passwordRepeat) {
      errors['passwordRepeat'] = 'Вы должны подтвердить пароль'
    }
  }
  
  return errors
}

export function testNicknameKey(key) {
  // let testResult = /[a-zA-Z]/.test(key) ||
  //   /[а-яА-Я]/.test(key) ||
  //   /[0-9]/.test(key) ||
  //   key==="Backspace" ||
  //   key==="_" ||
  //   key==="." ||
  //   key===" "
  let testResult = forbiddenCharacters.find(char => char===key)
  if (testResult==='  ') {
    testResult = 'Двойной пробел'
  }
  return testResult
}

export function forbiddenInputNickname(value) {
  let specCharsLength = false
  let lettersLength = false
  
  let forbiddenCharArray = forbiddenCharacters.reduce((total, char) => {
    if (value.includes(char)) {
      total.push(char)
    }
    
    return total
  }, [])
  
  const letters = value.match(/[a-zA-Z]|[а-яА-Я]/g)
  
  if (letters.length<3) {
    lettersLength = true
  }
  if (value.length - letters.length>3) {
    specCharsLength = true
  }
  return {forbiddenCharArray,specCharsLength,lettersLength}
}

export function clearError(el) {
  let small = el.parentNode.querySelector('small')
  el.classList.remove('_error')
  
  small.style.opacity = "0"
}

export function clearFormElementsError(form) {
  let inputs = form.querySelectorAll('input')
  inputs.forEach(input => {
    clearError(input)
  })
}