<script async setup>
import { useAuthStore } from "@/stores/auth.js";
import { usePreloaderStore } from "@/stores/preloader.js";
import { useMyProfileStore } from "@/stores/profile.js";

const authStore = useAuthStore()
const myProfile = useMyProfileStore()
const globalPopup = useGlobalPopupStore()
const globalPreloader = usePreloaderStore()

const checkUser = () => {
  const tokens = authStore.getLocalData('userTokens')
  console.log(tokens)
  if(tokens) {
    myProfile.token = tokens.token
  }

  const userId = authStore.getLocalData('userId')
  if(userId) {
    myProfile.id = userId
  }
}

checkUser()

onBeforeMount(async () => {
  let params = getLinkParams()
  if (!(params['account'] && params['account']==="connected")) {
    console.log("setMyProfileInfo APP",params)
    await myProfile.setMyProfileInfo()
  }

  /**
   * @description Автоматическая отчистка LocalStorage на старые записи в заметках, которые были сделаны 3 дня назад
   */
  for(let i=0; i<localStorage.length; i++) {
    let key = localStorage.key(i);
    if(key.includes('note:game=')) {
      let data = getLocalData(key)
      if(data && data.date && ((new Date()) - new Date(data.date))>2.592e+8) {
        localStorage.removeItem(key)
      }
    }
  }
})


import { RouterLink, RouterView } from 'vue-router'
import TheHeader from "@/components/TheHeader.vue";
import TheFooter from "@/components/TheFooter.vue";
import AppButton from "@/components/AppButton.vue";
import AppUpButton from "@/components/AppUpButton.vue";
import { computed, onBeforeMount, onMounted, onServerPrefetch, onUpdated, ref } from "vue";
import AppPreloader from "@/components/AppPreloader.vue";
import { getId, getLinkParams, getLocalData } from "@/plugins/functions.js";
import router from "@/router/index.js";
import AppConfirm from "@/components/AppConfirm.vue";
import AppPopup from "@/components/AppPopup.vue";
import TheResetPopup from "@/components/TheResetPopup.vue";
import { useGlobalPopupStore } from "@/stores/popup.js";
</script>

<template>
  <TheHeader></TheHeader>
  <AppPreloader :class="globalPreloader.showLoader?'':'_deactivate'"/>
  <RouterView/>
  <TheFooter></TheFooter>
  <AppUpButton/>
  <AppConfirm/>
  <AppPopup v-model="globalPopup.show" :color="globalPopup.color">
    <template v-slot:title>
      {{globalPopup.title}}
    </template>
    <div v-html="globalPopup.text" style="text-align: center;"></div>
  </AppPopup>
</template>

<style lang="scss">
@import "@/assets/scss/style.scss";
</style>
