<script setup="">
import { onUnmounted } from "vue";

function scrollHandler() {
  if (scrollY>400) {
    document.querySelector('.upButton').classList.add('_active')
  }
  else {
    document.querySelector('.upButton').classList.remove('_active')
  }
}

onUnmounted(() => {
  scrollHandler()
})

window.addEventListener('scroll', scrollHandler);

function setUpScroll() {
  let scroll = new SmoothScroll()
  scroll.animateScroll(0)
}

import AppButton from "@/components/AppButton.vue";
</script>

<template>
  <AppButton @click="setUpScroll" class="upButton" color="gold" border="true" icon-name="upButton.png"></AppButton>
</template>

<style scoped lang="scss">
.upButton {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 15;
  width: 40px;
  height: 40px;
  padding: 12px;

  transform: translate(300%, 0);
  transition: transform 0.3s ease;

  &._active {
    transform: translate(0, 0);
  }
}
</style>