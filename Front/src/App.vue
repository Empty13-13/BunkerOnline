<script setup>
import { useAuthStore } from "@/stores/auth.js";

const authStore = useAuthStore()

const checkUser = () => {
  const tokens = JSON.parse( localStorage.getItem('userTokens'))
  if(tokens) {
    authStore.userInfo.token = tokens.token
  }
}

checkUser()

import { RouterLink, RouterView } from 'vue-router'
import TheHeader from "@/components/TheHeader.vue";
import TheFooter from "@/components/TheFooter.vue";
import AppButton from "@/components/AppButton.vue";
import AppUpButton from "@/components/AppUpButton.vue";
import { onMounted, onUpdated, ref } from "vue";
</script>

<template>
  <TheHeader></TheHeader>
  <RouterView/>
  <TheFooter></TheFooter>
  <AppUpButton/>
</template>

<style lang="scss">
@import "@/assets/scss/style.scss";
</style>
