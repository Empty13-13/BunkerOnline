<script setup>

import { RouterLink, RouterView } from 'vue-router'
import TheHeader from "@/components/TheHeader.vue";
import TheFooter from "@/components/TheFooter.vue";
import AppButton from "@/components/AppButton.vue";
import AppUpButton from "@/components/AppUpButton.vue";
import { onMounted, onUpdated, ref } from "vue";
</script>

<template>
  <TheHeader v-show="$route.path.split('/')[1].length"></TheHeader>
  <RouterView/>
  <TheFooter v-if="$route.path.split('/')[1].length"></TheFooter>
  <AppUpButton/>
</template>

<style lang="scss">
@import "@/assets/scss/style.scss";
</style>
