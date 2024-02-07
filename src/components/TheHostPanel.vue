<script setup="">
import TheSpoiler from "@/components/TheSpoiler.vue";

function activateTimer() {

}

import AppButton from "@/components/AppButton.vue";
</script>

<template>
  <div class="hostPanel">
    <div class="hostPanel__block">
      <h3 class="hostPanel__title">Панель ведущего</h3>
      <div class="hostPanel__body">
        <div class="hostPanel__timers timers-hostPanel">
          <div class="timers-hostPanel__num">
            <AppButton @click="activateTimer" class="timers-hostPanel__btn">15</AppButton>
            <AppButton @click="activateTimer" class="timers-hostPanel__btn">30</AppButton>
            <AppButton @click="activateTimer" class="timers-hostPanel__btn">60</AppButton>
          </div>
          <div class="timers-hostPanel__nav">
            <AppButton color="gold" border="true" iconName="pause.png"/>
            <AppButton color="gold" border="true" iconName="stop.png"/>
          </div>
        </div>
        <div class="hostPanel__buttons buttons-hostPanel">
          <button class="buttons-hostPanel">Изменить катаклизм</button>
          <button class="buttons-hostPanel">Изменить бункер</button>
          <button class="buttons-hostPanel">Начать голосование</button>
          <button class="buttons-hostPanel">Аннулировать всем специальность</button>
          <button class="buttons-hostPanel">Специальности по часовой стрелке</button>
        </div>
        <div class="hostPanel__space space-hostPanel">
          <div class="space-hostPanel__title">Мест в бункере</div>
          <div class="space-hostPanel__buttons">
            <AppButton color="red" class="space-hostPanel__btn">-</AppButton>
            <AppButton color="green" class="space-hostPanel__btn">+</AppButton>
          </div>
        </div>
        <div class="hostPanel__settings settings-hostPanel">
          <TheSpoiler title="Изменить характеристику">

          </TheSpoiler>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.hostPanel {
  position: fixed;
  right: 0;
  top: 0;
  z-index: 999;
}
</style>