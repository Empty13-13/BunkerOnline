<script setup>
import { RouterLink, RouterView } from 'vue-router'
import TheHeader from "@/components/TheHeader.vue";
import TheFooter from "@/components/TheFooter.vue";

</script>

<template>
  <TheHeader></TheHeader>
  <RouterView  class="_wrapper"/>
  <TheFooter></TheFooter>
</template>

<style lang="scss">
@import "@/assets/scss/style.scss";
</style>
