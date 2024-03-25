<script async setup>
import { useAuthStore } from "@/stores/auth.js";
import { usePreloaderStore } from "@/stores/preloader.js";
import { useMyProfileStore } from "@/stores/profile.js";

const authStore = useAuthStore()
const myProfile = useMyProfileStore()

const checkUser = () => {
  const tokens = JSON.parse( localStorage.getItem('userTokens'))
  console.log(tokens)
  if(tokens) {
    myProfile.token = tokens.token
  }

  const userId = JSON.parse(localStorage.getItem('userId'))
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
})

import { RouterLink, RouterView } from 'vue-router'
import TheHeader from "@/components/TheHeader.vue";
import TheFooter from "@/components/TheFooter.vue";
import AppButton from "@/components/AppButton.vue";
import AppUpButton from "@/components/AppUpButton.vue";
import { computed, onBeforeMount, onMounted, onServerPrefetch, onUpdated, ref } from "vue";
import AppLoader from "@/components/AppLoader.vue";
import AppPreloader from "@/components/AppPreloader.vue";
import { getId, getLinkParams } from "@/plugins/functions.js";
import router from "@/router/index.js";
import AppConfirm from "@/components/AppConfirm.vue";
import AppPopup from "@/components/AppPopup.vue";
import TheResetPopup from "@/components/TheResetPopup.vue";
</script>

<template>
  <TheHeader></TheHeader>
  <AppPreloader :class="usePreloaderStore().showLoader?'':'_deactivate'"/>
  <RouterView/>
  <TheFooter></TheFooter>
  <AppUpButton/>
  <AppConfirm/>
</template>

<style lang="scss">
@import "@/assets/scss/style.scss";
</style>
