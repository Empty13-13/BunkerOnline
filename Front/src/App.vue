<script setup>
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


const getId = computed(() => {
  return +router.currentRoute.value.path.split('=')[1]
})
onMounted(async () => {
  let params = getLinkParams()
  if (params['account'] && params['account']==="connected") {
    await authStore.refreshToken()
    if(!localStorage.getItem('userId')) {
      myProfile.id = getId.value
      localStorage.setItem('userId', myProfile.id.toString())
    }
  }

  await myProfile.setMyProfileInfo()
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
