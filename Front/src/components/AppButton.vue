<script setup="">
defineProps([
  'iconName',
  'color',
  'border',
  'disabled'
]);


</script>

<template>
  <button
      class="btn"
      :class="[
          color || 'gray',
          {border},
          {square:!$slots.default && iconName},
          {textIcon:$slots.default && iconName},
      ]"
      :disabled="disabled"
  >

    <!--Если есть и иконка и текст-->
    <span v-if="iconName && $slots.default" class="body">
      <span class="img">
        <img :src="'/img/icons/' + iconName" alt="">
      </span>

      <span class="text">
        <slot />
      </span>
    </span>

    <!--Если есть только иконка-->
    <span v-else-if="iconName" class="img">
      <img :src="'/img/icons/' + iconName" alt="">
    </span>

    <!--Если есть только текст-->
    <span v-else-if="$slots.default" class="text">
      <slot />
    </span>
  </button>
</template>

<style lang="scss">
@import '@/assets/scss/base';

.btn {
  display: flex;
  position: relative;
  z-index: 1;
  background: #1A1A1A;
  border-radius: 6px;
  overflow: hidden;
  padding: 6px;
  transition: background 0.3s;
  flex: 1 1 auto;
  height: 100%;
  min-width: 30px;
  justify-content: center;
  align-items: center;

  &:hover,&._active {
    background: #676767;
  }

  .body {
    z-index: 3;
    position: relative;
    display: inline-flex;
  }

  .img {
    position: relative;
    z-index: 4;
  }

  .text {
    position: relative;
    text-align: center;
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 4;
  }


  //========================================================================================================================================================
  //Цвета
  &.gold {
    background: $goldColor;
    color: $bodyColor;
    transition: box-shadow 0.2s ease;
    box-shadow: 0 5px 30px 0 rgba(217, 102, 19, 0.6);

    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
      height: 100%;
      background: $goldColorHover;
      border-radius: 6px;
      z-index: 1;
      opacity: 0;
      transition: opacity 0.3s;
    }

    &:hover,&._active {
      &::before {
        opacity: 1;
      }
    }

    &.border {
      box-shadow: none;
    }
  }

  &.purple {
    background: $purpleColor;

    &:hover,&._active {
      background: $purpleColorHover;
    }
  }

  &.red {
    background: $redColor;

    &:hover,&._active {
      background: $redColorHover;
    }
  }

  &.green {
    background: $greenColor;

    &:hover,&._active {
      background: $greenColorHover;
    }
  }

  &.whiteGray {

    background: $whiteGrayColor;
    color: black;
    transition: box-shadow 0.2s ease;
    box-shadow: 0px 5px 30px rgba(162, 162, 162, 0.6);


    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
      height: 100%;
      background: $whiteGrayColorHover;
      border-radius: 6px;
      z-index: 1;
      opacity: 0;
      transition: opacity 0.3s;
    }

    &:hover,&._active {
      &::before {
        opacity: 1;
      }
    }

    &.border {
      box-shadow: none;
    }
  }

  &.grayGold {
    background: rgba(255, 255, 255, 0.2);
    color: rgba(255, 255, 255, 0.2);
    transition: box-shadow 0.2s ease;
    box-shadow: 0 5px 30px 0 rgba(217, 102, 19, 0.6);

    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
      height: 100%;
      background: $goldColorHover;
      border-radius: 6px;
      z-index: 1;
      opacity: 0;
      transition: opacity 0.3s;
    }

    &:hover,&._active {
      &::before {
        opacity: 1;
      }
    }

    &.border {
      box-shadow: none;
    }
  }

  &:disabled {
    cursor: default;

    &.gold {
      background: linear-gradient(180deg, #2d2711, #2d1504);
      color: $bodyColor;
      transition: box-shadow 0.2s ease;
      box-shadow: none;

      &:hover,&._active {
        &::before {
          opacity: 0;
        }
      }

      &.border {
        box-shadow: none;
      }
    }

    &.purple {
      background: #171b3f;

      &:hover,&._active {
        background: #171b3f;
      }
    }

    &.red {
      background: #3d0d0d;

      &:hover,&._active {
        background: #3d0d0d;
      }
    }

    &.green {
      background: #102d0c;

      &:hover,&._active {
        background: #102d0c;
      }
    }

    &.whiteGray {
      background: $whiteGrayColor;

      &:hover,&._active {
        background: $whiteGrayColor;
      }
    }
  }
}

.btn.border {
  color: white;

  &::after {
    content: '';
    position: absolute;
    left: calc($buttonBorderWidth / 2);
    top: calc($buttonBorderWidth / 2);
    width: calc(100% - $buttonBorderWidth);
    height: calc(100% - $buttonBorderWidth);
    background: $bodyColor;
    border-radius: 6px;
    z-index: 1;
  }
}

//========================================================================================================================================================
//Квадратная форма
.btn.square {
  display: flex;
  justify-content: center;
  align-items: center;
}

//========================================================================================================================================================
//Иконка+текст
.btn.textIcon {
  display: flex;

  .img {
    margin-right: 10px;
  }
}

</style>