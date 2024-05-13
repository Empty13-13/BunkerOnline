<script setup="">

import AppLoader from "@/components/AppLoader.vue";
</script>

<template>
  <div class="preloader">
    <div class="preloader__body">
      <div class="preloader__img">
        <img src="/img/preloader.png" alt="">
      </div>
      <div class="preloader__animation">
        <AppLoader/>
      </div>
    </div>
  </div>
</template>

<style lang="scss">
  .preloader {
    position: fixed;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    z-index: 99999999;
    background: black;
    visibility: visible;
    opacity: 1;

    &._deactivate {
      transition: visibility 1s ease, opacity 1s ease;
      opacity: 0;
      visibility: hidden;
      pointer-events: none;
    }

    &__body {
      width: 100%;
      height: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
      flex-direction: column;
    }

    &__img {
      height: 35%;
      display: flex;
      justify-content: center;
      align-items: center;
      margin-bottom: 30px;

      img {
        height: 100%;
        max-width: 340px;
        max-height: 307px;
      }
    }

    &__animation {
      max-height: 10%;

      .loader {
        height: 100%;
        width: 100%;
      }
    }


  }
</style>