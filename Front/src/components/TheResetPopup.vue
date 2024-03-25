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


async function changePasswordHandler(e) {
  e.preventDefault()
  showLoader.value = true
  clearFormElementsError(e.target)
  let errors = validationRegistration({password: passwordInput.value, passwordRepeat: passwordRepeatInput.value})
  if (errors.password) {
    setErrorForInput('passwordChange', errors.password)
  }
  if (errors.passwordRepeat) {
    setErrorForInput('passwordRepeatChange', errors.passwordRepeat)
  }
  if (errors.password || errors.passwordRepeat) {
    showLoader.value=false
    return
  }
  try {
    let params = router.currentRoute.value.query
    await axiosInstance.post('/newPassword', {
      password: passwordInput.value,
      link: params['link'],
      userId: params['userId'],
      idLink: params['linkId']
    })
    showPasswordConfirm.value=true
  } catch(e) {
    setErrorForInput('passwordChange', "Ошибка изменения пароля")
  } finally {
    showLoader.value = false
  }
}

const emailInput = ref(null)
const showEmailConfirm = ref(false)

async function changeEmailHandler(e) {
  e.preventDefault()
  showLoader.value = true
  clearFormElementsError(e.target)
  let errors = validationRegistration({email:emailInput.value})
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
    showEmailConfirm.value=true
  } catch(e) {
    setErrorForInput('emailChange', "Ошибка изменения email")
  } finally {
    showLoader.value = false
  }
}

</script>

<template>
  <AppPopup v-model="showPopup" color="gold">
    <template v-slot:title>{{ isPasswordReset? "Изменение пароля":"Изменение Email" }}</template>
    <form v-if="isPasswordReset && !showPasswordConfirm && !showPasswordConfirm" novalidate @submit="changePasswordHandler"
          class="login-authBlock__form authBlock-form">
      <div class="authBlock-form__input">
        <small hidden="">Какой то текст с ошибкой</small>
        <input @focus="focusInInput" v-model="passwordInput" autocomplete="new-password" placeholder="Введите пароль"
               type="password" name="passwordChange">
      </div>
      <div class="authBlock-form__input">
        <small hidden="">Какой то текст с ошибкой</small>
        <input @focus="focusInInput" v-model="passwordRepeatInput" autocomplete="new-password"
               placeholder="Подтвердите пароль" type="password"
               name="passwordRepeatChange">
      </div>
      <AppLoader v-if="showLoader" />
      <AppButton v-else color="gold">Сменить пароль</AppButton>
    </form>
    <form v-else-if="!showEmailConfirm && !showPasswordConfirm" novalidate @submit="changeEmailHandler" class="login-authBlock__form authBlock-form">
      <div class="authBlock-form__input">
        <small hidden="">Какой то текст с ошибкой</small>
        <input v-model="emailInput" @focus="focusInInput" ref="emailReg" placeholder="Электронная почта" type="email"
               name="emailChange">
      </div>
      <AppLoader v-if="showLoader" />
      <AppButton v-else color="gold">Сменить Email</AppButton>
    </form>
    <p v-if="showEmailConfirm">Ваш email был изменен. Для его использования пожалуйста перейдите на почту, которую указали и подтвердите новый email</p>
    <p v-if="showPasswordConfirm">Ваш пароль был успешно изменен!</p>
  </AppPopup>
</template>

<style scoped lang="scss">

</style>