<script setup="">
import AppButton from "@/components/AppButton.vue";
import router from "@/router/index.js";
import { useAccessStore } from "@/stores/counter.js";

const access = useAccessStore()

defineProps([
  'gamersNum',
  'isStarted',
  'datetime',
  'link',
  'isHost',
])

function letsGo(isStarted) {
  access.isStarted = !!isStarted;
  router.push('/game=D389N')
}

</script>

<template>
  <div class="roomCreated linear-border boldBorder" :class="isStarted?isHost?'gold':'green':'red'">
    <div class="roomCreated__body">
      <div class="roomCreated__block">
        <div class="roomCreated__column">
          <div class="roomCreated__title">Игроков</div>
          <div class="roomCreated__value">{{ gamersNum }} / 15</div>
        </div>
        <div class="roomCreated__column">
          <div class="roomCreated__title">Статус</div>
          <div class="roomCreated__value">{{ isStarted? 'Игра началась':'Ожидание игроков' }}</div>
        </div>
        <div class="roomCreated__column">
          <div class="roomCreated__title">Время создания</div>
          <div class="roomCreated__value">
            {{ new Intl.DateTimeFormat('nu', {hour: '2-digit', minute: '2-digit'}).format(datetime) }}
            ({{ new Intl.DateTimeFormat('nu', {day: '2-digit', month: '2-digit'}).format(datetime) }})
          </div>
        </div>
      </div>
      <div class="roomCreated__block">
        <AppButton @click="router.push(`/game=${link}`)" class="roomCreated__btn" :color="isStarted?isHost?'gold':'green':'red'">
          {{ isStarted? 'Перейти к игре':'Присоединиться' }}
        </AppButton>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@import "@/assets/scss/base";

.roomCreated {
  border-radius: 6px;
  margin-bottom: 30px;
  position: relative;
  overflow: hidden;


  &__body {
    display: grid;
    grid-template-columns: 1.5fr 1fr;
    padding: 24px 28px;
    position: relative;
    z-index: 3;

    @media (max-width: 690px) {
      grid-template-columns: 1fr;
      grid-template-rows: 1fr 1fr;
      gap: 15px;
      padding: 24px 20px;
    }
  }

  &__block {
    &:first-child {
      display: grid;
      grid-template-columns: 0.8fr 1.5fr 1fr;
      flex: 0 1 55%;
      @media (max-width: 690px) {
        grid-template-columns: 0.8fr 1.2fr 1.2fr;
      }
    }
  }

  &__column {
  }

  &__title {
    opacity: 0.7;
    margin-bottom: 10px;
    font-size: 11px;
    font-weight: 600;
  }

  &__value {
    font-weight: 700;
  }

  &__btn {
    width: 200px;
    height: 36px;
    display: flex;
    justify-content: center;
    align-items: center;
    margin-left: auto;

    @media (max-width: 690px) {
      margin: 0;
      width: 100%;
    }
  }
}
</style>