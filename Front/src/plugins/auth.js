import { emailTest } from "@/plugins/functions.js";

const forbiddenCharacters = [
  '&', '=', '+', '<', '>', ',', "'", '"', '`', '..', '--', ':'
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
    if (!testInputNickname(nickname)) {
      errors['nickname'] = 'В поле содержатся недопустимые символы'
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
  return /[a-zA-Z]/.test(key) ||
    /[а-яА-Я]/.test(key) ||
    /[0-9]/.test(key) ||
    key==="Backspace" ||
    key==="_"
}

export function testInputNickname(value) {
  for (let i = 0; i<value.length; i++) {
    if (!testNicknameKey(value[i])) {
      return false
    }
  }
  return true
}

export function clearError(el) {
  let small = el.parentNode.querySelector('small').style.opacity = "0"
  el.classList.remove('_error')
}