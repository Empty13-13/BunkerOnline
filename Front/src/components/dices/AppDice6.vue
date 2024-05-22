<script setup="">
import { computed, ref } from "vue";
import { useSelectedGameData } from "@/stores/game.js";

const selectedGameData = useSelectedGameData()

const getDiceNum = computed(() => {
  return selectedGameData.diceNum
})

const sidePositions6 = ref([
  [0, 0, 0, 90],
  [-1, 0, 0, 90],
  [0, 1, 0, 90],
  [0, -1, 0, 90],
  [1, 0, 0, 90],
  [1, 0, 0, 180],
])
const numPositions6 = ref({
  1: [0, 0],
  2: [90, 0],
  3: [0, 270],
  4: [0, 90],
  5: [270, 0],
  6: [180, 0],
})

</script>

<template>
  <div class="diceBlock"
       :class="selectedGameData.showDice6 || selectedGameData.showDice20?'_active':''">
    <div class="diceBlock__wrapper"></div>
    <div class="diceBlock__body">
      <div v-if="selectedGameData.showDice6" class="dice6"
           :style="getDiceNum>0&&getDiceNum<7?
       `transform: rotateX(${numPositions6[getDiceNum][0]}deg) rotateY(${numPositions6[getDiceNum][1]}deg);`:
       'transform: rotateX(-864deg) rotateY(-854deg);'"
      >
        <div class="dice6__list">
          <div class="dice6__side"
               v-for="index in 6"
               :key="index"
               :style="`transform: rotate3d(${sidePositions6[index-1][0]}, ${sidePositions6[index-1][1]}, ${sidePositions6[index-1][2]}, ${sidePositions6[index-1][3]}deg) translateZ(48px);`"
               :data-side="index"
          >
            <span v-for="i in index" :key="i*index" class="dot"></span>
          </div>
        </div>
      </div>
      <div v-else-if="selectedGameData.showDice20" class="dice20"
           :style="getDiceNum>0?``:'transform: rotateX(-864deg) rotateY(-854deg) scale(0.5);'"
      >
        <div class="dice20__body">
          <div class="dice20__img"><img src="/img/icons/dice20.png" alt=""></div>
          <p class="dice20__num">{{ getDiceNum }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.diceBlock {
  position: fixed;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9;
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;

  &._active {
    opacity: 1;
    pointer-events: auto;
  }

  &__wrapper {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.75);
  }

  &__body {

  }
}

.dice6 {
  width: 175px;
  height: 165px;
  text-align: center;
  position: relative;
  transform-style: preserve-3d;
  transition: transform 1s ease-out;
  z-index: 99;
  margin-left: auto;
  margin-right: auto;
  display: flex;
  justify-content: center;
  align-items: center;


  &__list {
    display: grid;
    grid-template-columns: 1fr;
    grid-template-rows: 1fr;
    height: 100px;
    width: 100px;
    list-style-type: none;
    transform-style: preserve-3d;
    position: relative;


  }

  &__side {
    background-color: black;
    box-shadow: inset -0.35rem 0.35rem 0.75rem rgba(0, 0, 0, 0.15), inset 0.5rem -0.25rem 0.5rem rgba(0, 0, 0, 0.10);
    display: grid;
    grid-column: 1;
    grid-row: 1;
    border: 1px solid white;
    border-radius: 8px;
    grid-template-areas:
"one   two   three"
"four  five  six  "
"seven eight nine ";
    grid-template-columns: repeat(3, 1fr);
    grid-template-rows: repeat(3, 1fr);
    height: 100%;
    padding: 1rem;
    width: 100%;

    span {
      align-self: center;
      background-color: #fff;
      border-radius: 50%;
      box-shadow: inset -0.15rem 0.15rem 0.25rem rgba(0, 0, 0, 0.5);
      display: block;
      height: 1.25rem;
      justify-self: center;
      width: 1.25rem;
    }

    &[data-side="1"] .dot:nth-of-type(1) {
      grid-area: five;
    }

    &[data-side="2"] .dot:nth-of-type(1) {
      grid-area: one;
    }

    &[data-side="2"] .dot:nth-of-type(2) {
      grid-area: nine;
    }

    &[data-side="3"] .dot:nth-of-type(1) {
      grid-area: one;
    }

    &[data-side="3"] .dot:nth-of-type(2) {
      grid-area: five;
    }

    &[data-side="3"] .dot:nth-of-type(3) {
      grid-area: nine;
    }

    &[data-side="4"] .dot:nth-of-type(1) {
      grid-area: one;
    }

    &[data-side="4"] .dot:nth-of-type(2) {
      grid-area: three;
    }

    &[data-side="4"] .dot:nth-of-type(3) {
      grid-area: seven;
    }

    &[data-side="4"] .dot:nth-of-type(4) {
      grid-area: nine;
    }

    &[data-side="5"] .dot:nth-of-type(1) {
      grid-area: one;
    }

    &[data-side="5"] .dot:nth-of-type(2) {
      grid-area: three;
    }

    &[data-side="5"] .dot:nth-of-type(3) {
      grid-area: five;
    }

    &[data-side="5"] .dot:nth-of-type(4) {
      grid-area: seven;
    }

    &[data-side="5"] .dot:nth-of-type(5) {
      grid-area: nine;
    }

    &[data-side="6"] .dot:nth-of-type(1) {
      grid-area: one;
    }

    &[data-side="6"] .dot:nth-of-type(2) {
      grid-area: three;
    }

    &[data-side="6"] .dot:nth-of-type(3) {
      grid-area: four;
    }

    &[data-side="6"] .dot:nth-of-type(4) {
      grid-area: six;
    }

    &[data-side="6"] .dot:nth-of-type(5) {
      grid-area: seven;
    }

    &[data-side="6"] .dot:nth-of-type(6) {
      grid-area: nine;
    }
  }
}

.dice20 {
  width: 175px;
  height: 165px;
  display: flex;
  justify-content: center;
  transition: transform 1s ease-out;
  align-items: center;

  &__body {
    position: relative;
  }

  &__img {
    img {
      max-width: 100%;
      max-height: 100%;
    }
  }

  &__num {
    font-size: 28px;
    font-weight: 700;
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
  }
}
</style>