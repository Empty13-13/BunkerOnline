<script setup>
import { useAuthStore } from "@/stores/auth.js";
import { usePreloaderStore } from "@/stores/preloader.js";

const authStore = useAuthStore()

const checkUser = () => {
  const tokens = JSON.parse( localStorage.getItem('userTokens'))
  if(tokens) {
    authStore.userInfo.token = tokens.token
  }

  const userId = JSON.parse(localStorage.getItem('userId'))
  if(userId) {
    authStore.userInfo.userId = userId
  }
}

checkUser()


const getId = computed(() => {
  return +router.currentRoute.value.path.split('=')[1]
})
onMounted(async () => {
  let params = getLinkParams()
  if (params['account'] && params['account']==="connected") {
    await authStore.refreshToken()
    authStore.userInfo.userId = getId.value
    console.log(authStore.userInfo.userId)
    localStorage.setItem('userId', authStore.userInfo.userId.toString())
  }

  await authStore.setMyProfileInfo()
})

import { RouterLink, RouterView } from 'vue-router'
import TheHeader from "@/components/TheHeader.vue";
import TheFooter from "@/components/TheFooter.vue";
import AppButton from "@/components/AppButton.vue";
import AppUpButton from "@/components/AppUpButton.vue";
import { computed, onMounted, onUpdated, ref } from "vue";
import AppLoader from "@/components/AppLoader.vue";
import AppPreloader from "@/components/AppPreloader.vue";
import { getLinkParams } from "@/plugins/functions.js";
import router from "@/router/index.js";
</script>

<template>
  <TheHeader></TheHeader>
  <AppPreloader :class="usePreloaderStore().showLoader?'':'_deactivate'"/>
  <RouterView/>
  <TheFooter></TheFooter>
  <AppUpButton/>
</template>

<style lang="scss">
@import "@/assets/scss/style.scss";
</style>
