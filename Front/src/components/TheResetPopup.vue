<script setup="">
import AppPopup from "@/components/AppPopup.vue";
import { focusInInput, setErrorForInput } from "@/plugins/inputActions.js";
import AppButton from "@/components/AppButton.vue";
import { useAuthStore } from "@/stores/auth.js";
import AppLoader from "@/components/AppLoader.vue";
import { onBeforeMount, ref } from "vue";
import router from "@/router/index.js";
import { clearFormElementsError, validationRegistration } from "@/plugins/auth.js";
import axiosInstance from "@/api.js";
import { showConfirmBlock } from "@/plugins/confirmBlockPlugin.js";

const showPopup = ref(false)
const isPasswordReset = ref(false)

onBeforeMount(() => {
  let params = router.currentRoute.value.query
  if (params['connected']) {
    showPopup.value = true
    if (params['connected']==='resetPassword') {
      isPasswordReset.value = true
    }
  }
})

const passwordInput = ref(null)
const passwordRepeatInput = ref(null)
const showLoader = ref(false)
const showPasswordConfirm = ref(false)
const color = ref('gold')
const showPass = ref(false)
function toggleVisibilityPass() {
  showPass.value = !showPass.value
}

async function changePasswordHandler(e) {
  e.preventDefault()
  clearFormElementsError(e.target)
  let errors = validationRegistration({password: passwordInput.value, passwordRepeat: passwordRepeatInput.value})
  if (errors.password) {
    setErrorForInput('passwordChange', errors.password)
  }
  if (errors.passwordRepeat) {
    setErrorForInput('passwordRepeatChange', errors.passwordRepeat)
  }
  if (errors.password || errors.passwordRepeat) {
    showLoader.value = false
    return
  }

  showConfirmBlock(document.querySelector('#passChangeBtn'),async () => {
    showLoader.value = true
    try {
      let params = router.currentRoute.value.query
      await axiosInstance.post('/newPassword', {
        password: passwordInput.value,
        link: params['link'],
        userId: params['userId'],
        idLink: params['linkId']
      })
      showPasswordConfirm.value = true
      color.value = 'green'
      await router.replace('/')
    } catch(e) {
      setErrorForInput('passwordChange', "Ошибка изменения пароля")
    } finally {
      showLoader.value = false
    }
  },'Вы уверены что хотите изменить пароль?')

}

const emailInput = ref(null)
const showEmailConfirm = ref(false)

async function changeEmailHandler(e) {
  e.preventDefault()
  showLoader.value = true
  clearFormElementsError(e.target)
  let errors = validationRegistration({email: emailInput.value})
  if (errors.email) {
    setErrorForInput('emailChange', errors.email)
    showLoader.value = false
    return
  }

  try {
    let params = router.currentRoute.value.query
    await axiosInstance.post('/newEmail', {
      email: emailInput.value,
      link: params['link'],
      userId: params['userId'],
      idLink: params['linkId']
    })
    showEmailConfirm.value = true
    color.value = 'green'
    await router.replace('/')
  } catch(e) {
    setErrorForInput('emailChange', "Ошибка изменения email")
  } finally {
    showLoader.value = false
  }
}

</script>

<template>
  <AppPopup v-model="showPopup" :color="color">
    <template v-slot:title>{{ isPasswordReset? "Изменение пароля":"Изменение Email" }}</template>
    <form v-if="isPasswordReset && !showPasswordConfirm && !showPasswordConfirm" novalidate
          @submit="changePasswordHandler"
          class="login-authBlock__form authBlock-form">
      <div class="authBlock-form__input _reset">
        <small hidden="">Какой то текст с ошибкой</small>
        <input @focus="focusInInput" v-model="passwordInput" autocomplete="new-password"
               placeholder="Введите новый пароль"
               :type="showPass?'text1':'password'" name="passwordChange">
      </div>
      <div class="authBlock-form__input _reset">
        <small hidden="">Какой то текст с ошибкой</small>
        <input @focus="focusInInput" v-model="passwordRepeatInput" autocomplete="new-password"
               placeholder="Подтвердите новый пароль"
               :type="showPass?'text1':'password'"
               name="passwordRepeatChange">
      </div>
      <AppLoader v-if="showLoader" />
      <div v-if="!showLoader" class="authBlock-form__showPassBtn"
              @click="toggleVisibilityPass">
        <svg :class="showPass?'':'_hide'" height="86.800003" viewBox="0 0 128 86.800003" width="128" xml:space="preserve" id="svg1"
             xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape"
             xmlns:sodipodi="http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd" xmlns="http://www.w3.org/2000/svg">
    <sodipodi:namedview id="namedview1" pagecolor="#ffffff" bordercolor="#000000" borderopacity="0.25"
                        inkscape:showpageshadow="2" inkscape:pageopacity="0.0" inkscape:pagecheckerboard="true"
                        inkscape:deskcolor="#d1d1d1" showguides="true" inkscape:lockguides="false" labelstyle="default"
                        inkscape:clip-to-page="false" inkscape:zoom="4.9149717" inkscape:cx="61.343181"
                        inkscape:cy="39.471234" inkscape:window-width="1920" inkscape:window-height="1052"
                        inkscape:window-x="1680" inkscape:window-y="0" inkscape:window-maximized="1"
                        inkscape:current-layer="svg1"/>
          <path fill="#ffffff"
                d="M 63.94972,86.8 C 34.589157,86.8 11.161036,69.5 0,43.4 11.261586,17.3 34.689707,0 63.94972,0 93.209733,0 116.73841,17.3 128,43.4 116.73841,69.5 93.209733,86.8 63.94972,86.8 Z m 0,-10.4 c 23.227021,0 43.23646,-13.5 52.58759,-33 -9.35113,-19.5 -29.360569,-33 -52.58759,-33 -23.126471,0 -43.135896,13.5 -52.487034,33 9.250588,19.5 29.260013,33 52.487034,33 z m -24.33307,-33 c 0,-13.4 10.859387,-24.2 24.23252,-24.2 13.473683,0 24.33307,10.9 24.33307,24.2 0,13.4 -10.959937,24.2 -24.33307,24.2 -13.373133,0 -24.23252,-10.9 -24.23252,-24.2 z m 25.740768,-6.1 c 0,4.2 3.318146,7.6 7.641791,7.6 4.122545,0 7.54124,-3.4 7.54124,-7.6 0,-4.1 -3.318146,-7.5 -7.54124,-7.5 -4.223095,0 -7.641791,3.3 -7.641791,7.5 z"/>
</svg>
        {{ showPass? 'Скрыть пароль':'Показать пароль' }}
      </div>
      <AppButton id="passChangeBtn" v-if="!showLoader" color="gold">Сменить пароль</AppButton>
    </form>
    <form v-else-if="!showEmailConfirm && !showPasswordConfirm" novalidate @submit="changeEmailHandler"
          class="login-authBlock__form authBlock-form">
      <div class="authBlock-form__input">
        <small hidden="">Какой то текст с ошибкой</small>
        <input v-model="emailInput" @focus="focusInInput" autocomplete="off" ref="emailReg"
               placeholder="Новая электронная почта" type="email"
               name="emailChange">
      </div>
      <AppLoader v-if="showLoader" />
      <AppButton v-else color="gold">Сменить Email</AppButton>
    </form>
    <p v-if="showEmailConfirm">Ваш email был изменен. Для его использования пожалуйста перейдите на почту, которую
                               указали и подтвердите новый email</p>
    <p v-if="showPasswordConfirm">Ваш пароль был успешно изменен!</p>
  </AppPopup>
</template>

<style scoped lang="scss">
.authBlock-form {
  &__showPassBtn {
    margin-top: 0;
    margin-bottom: 25px;
    display: flex;
    justify-content: flex-start;
    cursor: pointer;
    user-select: none;

    svg {
      width: 34px;
      height: 34px;
      max-width: 100%;
      max-height: 100%;
      margin-right: 10px;

      &._hide {
        opacity: 0.3;
        transition: 0.2s opacity;
      }
    }

    @media (any-hover: hover){
      &:hover{
        svg {
          opacity: 1;
        }
      }
    }
  }

  &__input {
    &._reset {
      margin: 0 0 15px 0;

      &:last-child{
        margin: 0 0 10px 0;
      }

      input {
        margin-bottom: 10px;
      }
    }
  }

  button.gold {
    font-size: 12px;
    font-weight: 700;
  }
}
</style>