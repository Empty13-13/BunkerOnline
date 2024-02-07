<script setup="">
defineProps(['title'])
</script>

<template>
  <div class="spoiler">
    <div class="spoiler__title">{{ title }}</div>
    <div class="spoiler__body">
      <slot />
    </div>
  </div>
</template>

<style scoped lang="scss">
.spoiler {
  &__title {
    font-weight: 700;
    cursor: pointer;
    padding: 10px 0;

    &::before,
    &::after {
      content: "";
      position: absolute;
      right: 10px;
      top: 50%;
      background-color: #000;
      height: 2px;
      width: 15px;
      transition: transform 0.5s ease 0s;
    }
    &::before {
      transform: translate(-75%, -50%) rotate(40deg);
    }
    &::after {
      transform: translate(0, -50%) rotate(-40deg);
    }
    &._active {
      &::before {
        transform: translateX(-75%) rotate(-40deg);
      }
      &::after {
        transform: rotate(40deg);
      }
    }
  }
  &__body {

  }
}
</style>