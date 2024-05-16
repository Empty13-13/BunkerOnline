<script setup="">
defineProps({
  color: String,
  timer: Number,
})
const model = defineModel()

function closePopup(e) {
  model.value = false
}

</script>

<template>
  <div class="popup" :class="model?'_active':''">
    <div @click="closePopup" class="popup__wrapper"></div>
    <div class="popup__content">
      <div class="popup__block linear-border"
           :class="color || 'white'"
      >
        <div v-if="!timer " @click="closePopup" class="popup__closeBtn"></div>
        <div class="popup__title">
          <slot name="title" />
        </div>
        <div class="popup__body">
          <slot />
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss">
@import "@/assets/scss/base";
@import "@/assets/scss/style";

.popup__closeBtn {
  position: absolute !important;
  right: 10px;
  top: 10px;
  width: 30px;
  height: 30px;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 999 !important;

  &:hover {
    &::after, &::before {
      background: $goldColorHover;
    }
  }

  &::after, &::before {
    content: '';
    background: white;
    width: 20px;
    height: 2px;
    display: flex;
    border-radius: 8px;
    position: absolute;
    transition: background 0.3s ease;
  }

  &::after {
    transform: rotate(-135deg);

  }

  &::before {
    transform: rotate(-45deg);
  }
}

.popup {
  position: fixed;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  max-height: 100%;
  z-index: 999;
  display: flex;
  justify-content: center;
  align-items: center;
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;

  &._active {
    opacity: 1;
    pointer-events: auto;
  }

  &__wrapper {
    width: 100%;
    height: 100%;
    position: absolute;
    background: #00000070;
  }

  &__content {
    transition: transform 0.3s ease 0s;
    padding: 20px;
    width: 100%;
    max-width: 900px;
    border-radius: 20px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    max-height: 80vh;

    @media (max-width: $tablet) {
      padding: 20px 10px;
    }
  }

  &__block {
    padding: 40px 45px;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    position: relative;
    max-width: 800px;
    max-height: 100%;
    overflow-y: auto;
    overflow-x: hidden;

    @media (max-width: $tablet) {
      padding: 40px 40px;
      width: 100%;
    }
  }

  &__title {
    font-size: 20px;
    font-weight: 700;
    margin-bottom: 20px;
  }

  &__body {
    font-size: 14px;
    line-height: em(25, 14);
    overflow-y: auto;
    overflow-x: hidden;
    padding: 1px;
  }

  a {
    @extend %goldTextColor;

    &:hover {
      text-decoration: underline;
    }
  }
}
</style>