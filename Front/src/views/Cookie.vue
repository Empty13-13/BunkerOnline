<script setup="">
import { useOtherTextsStore } from "@/stores/otherTexts.js";

const otherTexts = useOtherTextsStore()
</script>

<template>
<div class="cookiePage paddingTop">
  <div class="cookiePage__container">
    <h1 class="cookiePage__title titleH1" v-html="otherTexts.allTexts['cookie:title']"></h1>
    <div class="cookiePage__body">
      <p class="cookiePage__text" v-html="otherTexts.allTexts['cookie:text']"></p>
    </div>
  </div>
</div>
</template>

<style lang="scss">
.cookiePage {
  &__container {
  }

  &__title {
  }

  &__body {
  }

  &__text {
    font-size: 14px;
    line-height: 1.2;

    a {
      text-decoration: underline;

      @media (any-hover: hover){
        &:hover{
          text-decoration: none;
        }
      }
    }
  }
}
</style>