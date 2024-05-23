<script setup="">

import AppBackground from "@/components/AppBackground.vue";
import router from "@/router/index.js";
</script>

<template>
<div class="notFound">
  <AppBackground img-name="mainClear.jpg"></AppBackground>
  <div class="notFound__container">
    <div class="notFound__body">
      <h1 class="notFound__title">404</h1>
      <p class="notFound__text">Страница не найдена</p>
      <div @click="router.go(-1)" class="notFound__homeLink">Вернуться на предыдущую страницу</div>
    </div>
  </div>
</div>
</template>

<style scoped lang="scss">
@import "@/assets/scss/style";
@import "@/assets/scss/base";

.notFound {
  width: 100vw;
  height: 100vh;
  position: relative;
  margin-bottom: 80px;

  .wrapper {
    z-index: 1;
  }

  &__container {
    z-index: 2;
    position: relative;
    height: 100%;
  }

  &__body {
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    text-shadow: 9px 3px 20px #000000;
  }

  &__title {
    font-size: 120px;
    font-weight: 700;
    margin-bottom: 30px;

    @media (max-width: $mobile) {
      font-size: 70px;
    }
  }

  &__text {
    font-size: 20px;
    margin-bottom: 30px;
  }

  &__homeLink {
    color: rgb(201, 118, 57);
    @extend %goldTextColor;
    font-size: 16px;
    cursor: pointer;

    @media (any-hover: hover){
      &:hover{
        text-decoration: underline;
      }
    }
  }
}
</style>