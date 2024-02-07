<script setup="">
import { onBeforeUnmount, onMounted, onUnmounted, ref } from "vue";

defineProps(['text', 'coords'])
const mainBlock = ref()
const img = ref()
const block = ref()
let timer = null

onMounted(() => {
  mainBlock.value.addEventListener('mouseover', mouseover)
  mainBlock.value.addEventListener('mouseout', mouseout)
})
onBeforeUnmount(() => {
  mainBlock.value.removeEventListener('mouseover', mouseover)
  mainBlock.value.removeEventListener('mouseout', mouseout)
  console.log('unmounted')
})

function mouseover(e) {
  timer = setTimeout(() => {
    showWindow()
  }, 500)
}

function mouseout() {
  clearTimeout(timer)
  block.value.classList.remove('_active')
}

function showWindow() {
  block.value.classList.add('_active')
}

</script>

<template>
  <div class="smallInfo" ref="mainBlock">
    <div class="smallInfo__img" ref="img">i</div>
    <div class="smallInfo__block linear-border white" ref="block">
      <p>{{ text }}</p>
    </div>
  </div>
</template>

<style lang="scss">
.smallInfo {
  border-radius: 50%;
  width: 20px;
  height: 20px;
  cursor: pointer;
  display: flex;
  margin-left: 5px !important;
  position: relative;

  &__img {
    border-radius: 50%;
    width: 20px;
    height: 20px;
    background: #333333;
    display: flex;
    justify-content: center;
    align-items: center;
    pointer-events: none;
    color: white;
  }

  &__block {
    padding: 13px 16px;
    background: #333333;
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 6px;
    opacity: 0;
    position: absolute !important;
    left: 50%;
    bottom: 50%;
    transform: translate(-50%, -20%);
    width: 205px;
    text-align: center;
    pointer-events: none;

    p {
      width: 100%;
      height: 100%;
    }

    &._active {
      opacity: 1;
    }
  }
}
</style>