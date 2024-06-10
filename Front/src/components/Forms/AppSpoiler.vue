<script setup="">
import { ref } from "vue";
import { slideUp, slideDown } from "@/plugins/functions.js";

defineProps(['title'])

const isActive = ref(false)
const body = ref()

function toggleSpoiler() {
  if (isActive.value) {
    slideUp(body.value, 300)
  }
  else {
    console.log('sliddown')
    slideDown(body.value, 300)
  }
  isActive.value = !isActive.value
}

</script>

<template>
  <div class="spoiler">
    <div :class="isActive?'_active':''" class="spoiler__title" @click="toggleSpoiler">{{ title }}</div>
    <form ref="body" hidden>
      <div class="spoiler__body">
        <slot />
      </div>
    </form>
  </div>
</template>

<style scoped lang="scss">
.spoiler {
  &__title {
    font-weight: 700;
    cursor: pointer;
    padding: 10px 0;
    position: relative;

    &:hover {
      background: linear-gradient(90deg, rgb(249, 211, 91), rgb(217, 102, 19) 100%);
      background-clip: border-box;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;

      &::before, &::after {
        background: linear-gradient(90deg, rgb(249, 211, 91), rgb(217, 102, 19) 100%);
      }
    }

    &::before,
    &::after {
      content: "";
      position: absolute;
      right: 10px;
      top: 50%;
      background: white;
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
    display: flex;
    flex-direction: column;
  }
}
</style>