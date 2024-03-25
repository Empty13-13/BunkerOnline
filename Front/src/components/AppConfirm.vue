<script setup="">
import { useConfirmBlockStore } from "@/stores/confirmBlock.js";
import AppButton from "@/components/AppButton.vue";
import AppLoader from "@/components/AppLoader.vue";
import { onMounted, ref, watchEffect } from "vue";
import { isAsync } from "@/plugins/functions.js";

const confirmStore = useConfirmBlockStore()
const confirmBlock = ref(null)


onMounted(() => {
  console.log(confirmBlock.value)
  confirmStore.width = confirmBlock.value.clientWidth
})

async function yesHandler() {
  confirmStore.showLoader = true
  if (isAsync(confirmStore.action)) {
    await confirmStore.action()
  }
  else {
    confirmStore.action()
  }
  confirmStore.deactivate()
  confirmStore.showLoader = false
}

</script>

<template>
  <div ref="confirmBlock" class="confirmPopup"
       :class="{'_active':confirmStore.showBlock}"
       :style="`left:${confirmStore.left}px; top:${confirmStore.top}px; width:${confirmStore.currentWidth?confirmStore.currentWidth:confirmStore.width?confirmStore.width:NaN}px;`"
  >
    <div class="confirmPopup__block linear-border white">
      <div class="confirmPopup__body">
        <p class="confirmPopup__text">{{ confirmStore.text }}</p>
        <AppLoader v-if="confirmStore.showLoader" />
        <div v-else class="confirmPopup__buttons">
          <AppButton @click="confirmStore.deactivate()" color="red">Нет</AppButton>
          <AppButton @click="yesHandler" color="green">Да</AppButton>
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