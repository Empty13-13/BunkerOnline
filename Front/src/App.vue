<script async setup>
import { useAuthStore } from "@/stores/auth.js";
import { usePreloaderStore } from "@/stores/preloader.js";
import { useMyProfileStore } from "@/stores/profile.js";
import { RouterView } from 'vue-router'
import TheHeader from "@/components/TheHeader.vue";
import TheFooter from "@/components/TheFooter.vue";
import AppUpButton from "@/components/AppUpButton.vue";
import { onBeforeMount, onMounted, ref } from "vue";
import AppPreloader from "@/components/AppPreloader.vue";
import { getLinkParams, getLocalData, setLocalData } from "@/plugins/functions.js";
import AppConfirm from "@/components/AppConfirm.vue";
import AppPopup from "@/components/AppPopup.vue";
import { useGlobalPopupStore } from "@/stores/popup.js";
import { useConfirmBlockStore } from "@/stores/confirmBlock.js";
import { useStaticPagesStore } from "@/stores/static.js";
import axiosInstance from "@/api.js";
import { useAuthSocketStore } from "@/stores/socket/authSocket.js";
import { useOtherTextsStore } from "@/stores/otherTexts.js";

const authStore = useAuthStore()
const myProfile = useMyProfileStore()
const globalPopup = useGlobalPopupStore()
const globalPreloader = usePreloaderStore()
const confirmStore = useConfirmBlockStore()
const authSocket = useAuthSocketStore()
const staticPages = useStaticPagesStore()
const otherTexts = useOtherTextsStore()

const checkUser = () => {
  const tokens = authStore.getLocalData('userTokens')
  console.log(tokens)
  if (tokens) {
    myProfile.token = tokens.token
  }

  const userId = authStore.getLocalData('userId')
  if (userId) {
    myProfile.id = userId
  }
}
const showBetaPopup = ref(false)

checkUser()

onBeforeMount(async () => {
  let params = getLinkParams()
  if (!(params['account'] && params['account']==="connected")) {
    console.log("setMyProfileInfo APP", params)
    await myProfile.setMyProfileInfo()
    authSocket.setConnect()
  }

  /**
   * @description Автоматическая отчистка LocalStorage на старые записи в заметках, которые были сделаны 3 дня назад
   */
  for (let i = 0; i<localStorage.length; i++) {
    let key = localStorage.key(i);
    if (key.includes('note:game=')) {
      let data = getLocalData(key)
      if (data && data.date && ((new Date()) - new Date(data.date))>2.592e+8) {
        localStorage.removeItem(key)
      }
    }
    if(key.includes('game:')) {
      let data = getLocalData(key)
      if (data && data.date && ((new Date()) - new Date(data.date))>2.592e+8) {
        localStorage.removeItem(key)
      }
    }
    if(key.includes('betaTestPopup')) {
      let data = getLocalData(key)
      if(data && data.date) {
        if(((new Date()) - new Date(data.date))>1000*60*60*24) {
          localStorage.removeItem(key)
        }
      } else {
        localStorage.removeItem(key)
      }
    }
  }

  await otherTexts.downloadAllTexts()


  // try {
  //   let pageHTMLData = await axiosInstance.get('/staticPage/rules')
  //   console.log('RULES', pageHTMLData)
  //   staticPages.rulesPagesHTML = pageHTMLData.data.html
  // } catch(e) {
  //   console.log(e)
  // }
})

onMounted(() => {
  let betaPopupLocal = getLocalData('betaTestPopup')
  if (!betaPopupLocal) {
    setLocalData('betaTestPopup', {read:true,date: +(new Date())})
    showBetaPopup.value = true
  }

  authSocket.setConnect()
})

</script>

<template>
  <TheHeader tabindex="0"
             @keyup.esc.exact="confirmStore.deactivate"
             @keyup.enter.exact="confirmStore._enterHandler"></TheHeader>
  <AppPreloader :class="globalPreloader.showLoader?'':'_deactivate'" />
  <RouterView tabindex="0"
              @keyup.esc.exact="confirmStore.deactivate"
              @keyup.enter.exact="confirmStore._enterHandler" />
  <TheFooter></TheFooter>
  <AppUpButton />
  <AppConfirm />
  <AppPopup v-model="globalPopup.show" :color="globalPopup.color" :timer="globalPopup.isTimer">
    <template v-slot:title>
      {{ globalPopup.title }}
    </template>
    <div v-html="globalPopup.text" style="text-align: center;"></div>
  </AppPopup>

  <AppPopup v-model="showBetaPopup" color="red">
    <template v-slot:title>
      <p class="redTextColor" style="font-size: 28px;">Внимание!</p>
    </template>
    <p style="text-align: center">
      Сайт находится на стадии бета-тестирования. В случае возникновения ошибок/багов и других событий которые не должны
      были происходить, напишите нам по
      <a target="_blank" href="https://discord.com/channels/725334064751706114/1093869495505928212">ссылке в групповой чат</a> и как можно подробнее опишите проблему с которой
      столкнулись, прикрепляя скриншот
      <br>
      <br>
      <b>Спасибо за ваше участие!</b>
    </p>
  </AppPopup>
</template>

<style lang="scss">
@import "@/assets/scss/style.scss";
</style>
