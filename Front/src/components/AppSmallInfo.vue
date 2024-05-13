<script setup="">
import { onBeforeUnmount, onMounted, onUnmounted, ref } from "vue";

defineProps({
  text: String,
  isDown: {
    type: Boolean,
    required: false,
    default: false,
  },
  html: {
    type: String,
    required:false,
    default:false
  }
})

const mainBlock = ref()
const img = ref()
const block = ref()
let timer = null

onMounted(() => {
  mainBlock.value.addEventListener('mouseover', mouseover)
  mainBlock.value.addEventListener('mouseout', mouseout)
})
onBeforeUnmount(() => {
  if(mainBlock && mainBlock.value) {
    mainBlock.value.removeEventListener('mouseover', mouseover)
    mainBlock.value.removeEventListener('mouseout', mouseout)
  }
})

function mouseover(e) {
  showWindow(e)
}

function mouseout() {
  clearTimeout(timer)
  block.value.style.cssText += "opacity:0;"
  block.value.style.cssText += "left:auto;"
  block.value.style.cssText += "right:auto;"
}

function showWindow(e) {
  console.log((document.documentElement.offsetWidth - (e.x + img.value.offsetWidth)) - block.value.offsetWidth / 2)

  let left = e.x - block.value.offsetWidth / 2
  let right = (document.documentElement.offsetWidth - (e.x + img.value.offsetWidth)) - block.value.offsetWidth / 2
  let top = img.value.getBoundingClientRect().top - block.value.offsetHeight
  let fivePercent = document.documentElement.offsetWidth / 100 * 5
  let positionX = ""

  if (left<right) {
    positionX = 'left:'
    positionX += (left<fivePercent? fivePercent:left) + "px;"
  }
  else {
    positionX = 'right:'
    positionX += (right<fivePercent? fivePercent:right) + "px;"
  }

  if (top<document.querySelector('header').offsetHeight + 10) {
    top = document.querySelector('header').offsetHeight + 15
  }

  block.value.style.cssText += `
  position:fixed;
  ${positionX}
  top:${top}px;
  opacity: 1;
  `
}

</script>

<template>
  <div class="smallInfo" ref="mainBlock">
    <div class="smallInfo__img" ref="img">i</div>
    <div class="smallInfo__block linear-border white"
         ref="block"
         :class="{isDown}"
    >
      <p v-if="html" v-html="html"></p>
      <p v-else>{{text}}</p>
    </div>
  </div>
</template>

<style lang="scss">
@import "@/assets/scss/style";

.smallInfo {
  border-radius: 50%;
  width: 20px;
  height: 20px;
  cursor: pointer;
  display: inline-block;
  margin-left: 5px !important;
  position: relative;
  z-index: 5;

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
    z-index: -1;
  }

  &__block {
    background: #333333;
    display: inline-block;
    justify-content: center;
    align-items: center;
    border-radius: 6px;
    opacity: 0;
    position: fixed;
    text-align: center;
    pointer-events: none;
    font-size: 11px;
    font-weight: 600;
    color: white;
    z-index: 999;
    max-width: 330px;
    width: max-content;

    @media (max-width: $mobileSmall) {
      max-width: 90vw;
    }

    p {
      width: 100%;
      display: flex;
      padding: 13px 16px;
    }

    &._active {
      opacity: 1;
    }

    //&.isDown {
    //  bottom: -100%;
    //  transform: translate(-50%, 60%);
    //
    //  p {
    //    //height: auto;
    //  }
    //}
  }
}
</style>