<script setup="">
import { useConfirmBlockStore } from "@/stores/confirmBlock.js";
import AppButton from "@/components/AppButton.vue";
import AppLoader from "@/components/AppLoader.vue";
import { onMounted, ref, watchEffect } from "vue";
import { isAsync } from "@/plugins/functions.js";
import { RouterView } from "vue-router";

const confirmStore = useConfirmBlockStore()
const confirmBlock = ref(null)


onMounted(() => {
  confirmStore.width = confirmBlock.value.clientWidth
})

// async function yesHandler() {
//   confirmStore.showLoader = true
//   if (isAsync(confirmStore.action)) {
//     await confirmStore.action()
//   }
//   else {
//     confirmStore.action()
//   }
//   confirmStore.deactivate()
//   confirmStore.showLoader = false
// }


</script>

<template>
  <div ref="confirmBlock" :class="{'_active':confirmStore.showBlock}"
       :style="`left:${confirmStore.left}px; top:${confirmStore.top}px; width:${confirmStore.currentWidth?confirmStore.currentWidth:confirmStore.width?confirmStore.width:NaN}px;`"
       class="confirmPopup"
  >
    <div class="confirmPopup__block linear-border white">
      <div class="confirmPopup__body">
        <p class="confirmPopup__text">{{ confirmStore.text }}</p>
        <AppLoader v-if="confirmStore.showLoader" />
        <div v-else class="confirmPopup__buttons">
          <AppButton color="red" title="Escape (Esc)"
                     @click="confirmStore.deactivate">Нет</AppButton>
          <AppButton color="green" title="Enter"
                     @click="confirmStore._yesHandler"
                     @keyup.enter.exact="confirmStore._enterHandler">Да</AppButton>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.confirmPopup {
  position: absolute;
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  z-index: 9999;
  max-width: 80vw;

  &._active {
    opacity: 1;
    visibility: visible;
    pointer-events: auto;
  }

  &__block {
    padding: 15px 22px;
  }

  &__body {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .confirmPopup__text {
    font-size: 12px;
    font-weight: 700;
    margin-right: 30px;
  }

  &__buttons {
    display: flex;
    gap: 15px;

    button {
      width: 44px;
      height: 36px;
      cursor: pointer;
      font-weight: 700;
    }
  }

  .loader {
    margin: 0 !important;
  }
}
</style>