<script setup="">
defineProps([
  'imgName',
  'catastropheImg'
])
</script>

<template>
  <div class="wrapper">
    <div class="bodyBackground">
      <div class="wrapper__shadows right">
        <img src="/img/backgrounds/right-shadow.svg" alt="">
      </div>
      <div class="wrapper__shadows left">
        <img src="/img/backgrounds/right-shadow.svg" alt="">
      </div>
      <div class="wrapper__shadows up">
        <img src="/img/backgrounds/up-shadow.svg" alt="">
      </div>
    </div>
    <div class="wrapper__shadows down">
      <img src="/img/backgrounds/down-shadow.svg" alt="">
    </div>

    <div class="wrapper__main-image">
      <img v-if="catastropheImg" :src="'/img/catastrophe/' + catastropheImg" alt="">
      <img v-else-if="imgName" :src="'/img/backgrounds/'+imgName" alt="">
      <img v-else src="/img/backgrounds/mainClear.jpg" alt="">
    </div>
  </div>
</template>

<style scoped lang="scss">
@import "@/assets/scss/style";

.wrapper {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 100%;
  height: 100%;
  transform: translate(-50%, -50%);
  z-index: -1;
  max-width: $containerWidth+200px;
  pointer-events: none;

  .bodyBackground {
    overflow: hidden;
    pointer-events: none;
  }

  &__shadows {
    position: absolute;
    pointer-events: none;

    &.right {
      height: 100%;
      right: -12%;
    }

    &.left {
      height: 100%;
      left: -12%;
      transform: rotate(180deg);
    }

    &.up {
      width: 100%;
      top: 0;
    }

    &.down {
      width: 200vw;
      bottom: 0;
      left: -13%;
      transform: translateY(45%);
      pointer-events: none;
    }

    @media (max-width: $containerWidth+px) {
      &.right {
        left: 1066px;
      }

      &.left {
        right: 1066px;
        transform: rotate(180deg);
      }
    }
  }

  &__main-image {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    z-index: -1;

    img {
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
      height: 100%;
      max-width: 100%;
      object-fit: cover;
    }

    &::after {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.42);
    }
  }
}


</style>