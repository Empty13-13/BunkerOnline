<script setup="">
import { useAuthStore } from "@/stores/auth.js";
import { validationRegistration, testNicknameKey, clearError } from '@/plugins/auth.js'
import { useMyProfileStore } from "@/stores/profile.js";
import AppBackground from "@/components/AppBackground.vue";
import AppButton from "@/components/AppButton.vue";
import { ref } from "vue";
import { objIsEmpty, slideDown, slideToggle, slideUp } from "@/plugins/functions.js";
import router from "@/router/index.js";
import AppLoader from "@/components/AppLoader.vue";
import AppPopup from "@/components/AppPopup.vue";
import axiosInstance from "@/api.js";



const myProfile = useMyProfileStore()
const apiLink = import.meta.env.VITE_SERVER_API_LINK
const showPopup = ref(false)

const nicknameReg = ref()
const emailReg = ref()
const passwordReg = ref()
const passwordRepeatReg = ref()

async function registrationHandler(e) {
  e.preventDefault()
  clearError(nicknameReg.value)
  clearError(emailReg.value)
  clearError(passwordReg.value)
  clearError(passwordRepeatReg.value)

  let data = {
    email: emailReg.value.value.trim(),
    nickname: nicknameReg.value.value.trim(),
    password: passwordReg.value.value,
    passwordRepeat: passwordRepeatReg.value.value
  }
  let errors = validationRegistration(data)

  for (let key in errors) {
    setErrorForInput(key + 'Reg', errors[key])
  }

  if (objIsEmpty(errors)) {
    let message = await useAuthStore().auth(data, 'signUp')
    if (useAuthStore().errors.message) {
      setErrorForInput((useAuthStore().errors.input + 'Reg'), useAuthStore().errors.message)
    }
    else {
      showPopup.value = true
      // await router.push(`/profile=${useAuthStore().userInfo.userId}`)
    }
  }
}

const loginInput = ref()
const password = ref()
const isForgetPassword = ref(false)

async function loginHandler(e) {
  e.preventDefault()
  if(isForgetPassword.value) {
    clearError(loginInput.value)
    let errors = validationRegistration({email:loginInput.value.value})
    if(errors.email) {
      setErrorForInput('nickname',errors.email)
      return
    }

    await useAuthStore().resetPassword(loginInput.value.value)
    if (useAuthStore().errors.message) {
      setErrorForInput('nickname', useAuthStore().errors.message)
    }
    else {
      await router.push(`/profile=${myProfile.id}`)
    }
  }
  else {
    clearError(loginInput.value)
    clearError(password.value)

    let data = {
      login: loginInput.value.value.trim(),
      password: password.value.value,
    }
    let errors = {}

    for (let key in data) {
      if (!data[key]) {
        errors[key] = 'Поле не должно быть пустым'

        if (key==='login') {
          setErrorForInput("nickname", 'Поле не должно быть пустым')
        }
        else {
          setErrorForInput(key, 'Поле не должно быть пустым')
        }
      }
    }

    if (objIsEmpty(errors)) {
      await useAuthStore().auth(data, 'login')

      if (useAuthStore().errors.message) {
        if (!useAuthStore().errors.input) {
          useAuthStore().errors.input = 'nickname'
        }
        setErrorForInput(useAuthStore().errors.input, useAuthStore().errors.message)
      }
      else {
        await router.push(`/profile=${myProfile.id}`)
      }
    }
  }
}

function keyDownNickname(e) {
  if (!testNicknameKey(e.key) && myProfile.isAdmin) {
    e.preventDefault()
  }
}

function focusInInput(e) {
  clearError(e.target)
  slideUp(e.target.parentNode.querySelector('small'), 200)
}


function linkTo(href, isState = false) {
  let resultHref = href
  if (isState) {
    const randomString = Math.random().toString();
    localStorage.setItem('oauth-state', randomString);

    resultHref += '?&state=' + btoa(randomString)
  }

  window.location.href = resultHref
}

//========================================================================================================================================================
function setErrorForInput(inputName, textSmall) {
  let input = document.querySelector(`[name=${inputName}]`)
  let small = input.parentNode.querySelector('small')

  input.classList.add('_error')
  small.textContent = textSmall
  small.style.opacity = "1"
  slideDown(small, 200)
}

</script>

<template>
  <main class="authBlock">
    <AppBackground class="backgroundAuth" img-name="profile.jpg" />
    <div class="authBlock__container">
      <h1  class="authBlock__title">Вход и регистрация</h1>
      <div class="authBlock__body">
        <div class="authBlock__login login-authBlock linear-border gold">
          <div class="login-authBlock__body">
            <h2 class="login-authBlock__title">{{ isForgetPassword?'Забыли пароль?':'Вход' }}</h2>
            <form novalidate @submit="loginHandler" class="login-authBlock__form authBlock-form">
              <div class="authBlock-form__input">
                <small hidden="">Какой то текст с ошибкой</small>
                <input autofocus @focus="focusInInput" ref="loginInput" :placeholder="isForgetPassword?'Введите email аккаунта':'Ваш ник или email'" type="text"
                       name="nickname">
              </div>
              <div v-if="!isForgetPassword" class="authBlock-form__input">
                <small hidden="">Какой то текст с ошибкой</small>
                <input @focus="focusInInput" placeholder="Пароль" ref="password" type="password" name="password">
              </div>
              <div v-if="!isForgetPassword">
                <p>Войти с помощью</p>
                <span>
                  <span @click="linkTo(`${apiLink}/loginDiscord`)"
                        class="authBlock-form__connectBtn btn purple">
                    <span class="img"><img src="/img/icons/discord.png" alt=""></span>
                  </span>

                </span>
              </div>
              <div @click="isForgetPassword=!isForgetPassword" class="authBlock-form__forgetPassword"><span>{{ isForgetPassword?'Вход':'Забыли пароль?' }}</span></div>
              <AppLoader v-if="useAuthStore().isLoader" />
              <AppButton v-else color="gold">{{ isForgetPassword?'Отправить':'Войти' }}</AppButton>
            </form>
          </div>
        </div>
        <div v-if="!isForgetPassword" class="authBlock__reg login-authBlock linear-border gold">
          <div class="login-authBlock__body">
            <h2 class="login-authBlock__title">Регистрация</h2>
            <form novalidate @submit="registrationHandler" class="login-authBlock__form authBlock-form">
              <div class="authBlock-form__input">
                <small hidden="">Какой то текст с ошибкой</small>
                <input @focus="focusInInput" @keydown="keyDownNickname" ref="nicknameReg" placeholder="Ваш ник"
                       type="text"
                       name="nicknameReg"
                       maxlength="15">
              </div>
              <div class="authBlock-form__input">
                <small hidden="">Какой то текст с ошибкой</small>
                <input @focus="focusInInput" ref="emailReg" placeholder="Электронная почта" type="email"
                       name="emailReg">
              </div>
              <div class="authBlock-form__input">
                <small hidden="">Какой то текст с ошибкой</small>
                <input @focus="focusInInput" ref="passwordReg" placeholder="Пароль" type="password" name="passwordReg">
              </div>
              <div class="authBlock-form__input">
                <small hidden="">Какой то текст с ошибкой</small>
                <input @focus="focusInInput" ref="passwordRepeatReg" placeholder="Подтвердите пароль" type="password"
                       name="passwordRepeatReg">
              </div>

              <div>
                <p>Зарегистрироваться с помощью</p>
                <span>
                  <span @click="linkTo(`${apiLink}/loginDiscord`)"
                        class="authBlock-form__connectBtn btn purple">
                    <span class="img"><img src="/img/icons/discord.png" alt=""></span>
                  </span>

                </span>
              </div>
              <AppLoader v-if="useAuthStore().isLoader" />
              <AppButton v-else color="gold">Регистрация</AppButton>
            </form>
          </div>
        </div>
      </div>
    </div>
    <AppPopup v-model="showPopup" color="green">
      <template v-slot:title>Вы успешно зарегистрировались!</template>
      Чтобы войти в аккаунт - подтвердите свой профиль через email, который указали
    </AppPopup>
  </main>
</template>

<style lang="scss">
@import "@/assets/scss/style";

.authBlock + footer {
  .footer__wrapper {
    img {
      height: 750px !important;
    }
  }
}

.authBlock {
  margin-top: 130px;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 100px;

  @media (max-width: $tablet) {
    margin-top: 80px;
  }

  &__container {
    width: 100%;
  }

  &__title {
    font-weight: 700;
    font-size: 30px;
    margin-bottom: 50px;
    text-align: center;
    background: linear-gradient(90deg, #F9D35B, #D96613);
    background-clip: border-box;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;

    @media (max-width: $pc) {
      font-size: 27px;
      margin-bottom: 45px;
    }
    @media (max-width: $tablet) {
      font-size: 25px;
      margin-bottom: 40px;
    }
    @media (max-width: $mobile) {
      font-size: 22px;
      margin-bottom: 35px;
    }
    @media (max-width: $mobileSmall) {
      font-size: 20px;
      margin-bottom: 30px;
    }
  }

  &__body {
    display: flex;
    align-items: flex-start;
    justify-content: space-around;
    gap: 30px;
    width: 100%;

    @media (max-width: $tablet) {
      flex-direction: column;
      align-items: center;
    }
  }
}

.login-authBlock {
  padding: 35px 80px;
  max-width: 511px;
  flex: 0 1 50%;

  @media (max-width: $pc) {
    padding: 35px 60px;
  }
  @media (max-width: $tablet) {
    padding: 35px 50px;
  }
  @media (max-width: $mobile) {
    padding: 35px 30px;
  }
  @media (max-width: $mobileSmall) {
    padding: 35px 20px;
  }

  &__body {
  }

  &__title {
    text-align: center;
    font-size: 20px;
    font-weight: 700;
    margin-bottom: 30px;

    @media (max-width: $mobile) {
      margin-bottom: 20px;
    }
  }
}

.authBlock-form {
  &__input {
    position: relative;
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: flex-start !important;

    & > small {
      margin-bottom: 10px;
      opacity: 0;
      transition: opacity 0.1s ease, height 0.1s ease;
      font-size: 12px;
    }
  }

  &__forgetPassword {

    span {
      cursor: pointer;

      &:hover {
        text-decoration: underline;
      }
    }
  }

  input {
    padding: 14px 15px;
    background: #60606065;
    color: $fontColor;
    border-radius: 5px;
    margin-bottom: 15px;
    width: 100%;
    border: 1px solid transparent;
    transition: border-color 0.3s ease;
    height: 42px;

    &._error {
      border: 1px solid red;
    }
  }

  & > div {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin: 20px 0;

    & > span {
      display: flex;
      gap: 15px;

      & > span {
        padding: 6px;
        width: 35px;
        height: 35px;
        justify-content: center;
        align-items: center;
        gap: 0;
        background: #0077FF;
        cursor: pointer;

        &:hover {
          background: #519df6;
        }

        img {
          max-width: 100%;
          max-height: 100%;
          display: flex;
          justify-content: center;
          align-items: center;
        }
      }
    }
  }

  & > .btn {
    width: 100%;
    font-size: 11px;
    font-weight: 600;
    padding: 14px;
  }
}

.loader {
  width: 42px;
  height: 42px;
  margin: 20px auto !important;
}
</style>