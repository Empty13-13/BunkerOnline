<script setup="">
import AppButton from "@/components/AppButton.vue";
import { useSelectedGameData } from "@/stores/game.js";
import AppSelect from "@/components/Forms/AppSelect.vue";
import { ref } from "vue";

const selectedGameData = useSelectedGameData()

const funcData = ref({
  sendMessage: {
    select: {},
    title: '',
    text: '',
  }
})
const showPanel = ref(false)


//========================================================================================================================================================

function toggleShow() {
  showPanel.value = !showPanel.value
}

function sendMessage(e) {
  e.preventDefault()
  console.log(funcData.value.sendMessage)

}

</script>

<template>
  <AppButton @click="toggleShow" border="true" class="activateButton"
             color="gold">Админ панель
  </AppButton>
  <div class="adminPanel" :class="showPanel?'_active':''">
    <div @click="toggleShow" class="adminPanel__wrapper"></div>
    <div class="adminPanel__body">
      <div class="adminPanel__title">Панель администратора</div>
      <div class="adminPanel__block block-adminPanel">
        <div v-slide class="block-adminPanel__title">Отправить сообщение игроку</div>
        <div slidebody class="block-adminPanel__body" hidden="hidden">
          <form @submit="sendMessage" class="block-adminPanel__form">
            <AppSelect v-model="funcData.sendMessage.select" :options="selectedGameData.getPlayerForSelectAndAll" />
            <input v-model="funcData.sendMessage.title" type="text" placeholder="Заголовок сообщения">
            <input v-model="funcData.sendMessage.text" type="text" placeholder="Текст сообщения">
            <AppButton border="true" class="adminPanel__actionBtn"
                       color="gold">Отправить сообщение
            </AppButton>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@import "@/assets/scss/style";

.activateButton {
  position: fixed;
  left: 20px;
  bottom: 70px;
  height: 40px;
  width: 140px;
  z-index: 22;
}

.adminPanel {
  position: fixed;
  right: 0;
  top: 0;
  height: 100%;
  width: 100%;
  z-index: 21;
  opacity: 0;
  transition: opacity 0.3s;
  pointer-events: none;

  &__title {
    font-size: 20px;
    font-weight: 700;
    text-align: center;
    margin-bottom: 20px;
  }

  &__wrapper {
    background: rgba(0, 0, 0, 0.65);
    pointer-events: none;
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
  }

  &__body {
    background: #00000080;
    padding: 40px 23px;
    position: fixed;
    right: -10%;
    top: 0;
    height: 100%;
    z-index: 999;
    overflow-y: auto;
    max-width: 370px;
    width: 100%;
    transition: right 0.3s;
    backdrop-filter: blur(25px);
    background: rgba(255, 255, 255, 0.02);
    display: flex;
    flex-direction: column;
    pointer-events: none;
  }

  &__block {
  }

  &__actionBtn {
  }

  &._active {
    opacity: 1;

    .adminPanel__wrapper {
      pointer-events: auto;
    }

    .adminPanel__body {
      right: 0;
      opacity: 1;
      pointer-events: auto;
    }
  }
}

.block-adminPanel {

  &__title {
    cursor: pointer;
    margin-bottom: 15px;
    line-height: 1.2;
    background: linear-gradient(180deg, #ffffff, #ffffff);
    background-clip: border-box;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    transition: background 0.3s ease;
    font-weight: 700;
    position: relative;

    @media (any-hover: hover) {
      &:hover {
        background: linear-gradient(180deg, #F9D35B, #D96613);
        background-clip: border-box;
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;

        &::before, &::after {
          background: linear-gradient(90deg, rgb(249, 211, 91), rgb(217, 102, 19) 100%);
        }
      }
    }

    &::before, &::after {
      content: "";
      position: absolute;
      right: 10px;
      top: 50%;
      background: white;
      height: 2px;
      width: 15px;
      transition: transform 0.5s ease 0s;
    }

    &::before {
      transform: translate(-75%, -50%) rotate(40deg);
    }

    &::after {
      transform: translate(0, -50%) rotate(-40deg);
    }

    &._slide-active-title {
      &::before {
        transform: translateX(-75%) rotate(-40deg);
      }

      &::after {
        transform: rotate(40deg);
      }
    }
  }

  &__body {
    &[hidden] ~ .block-adminPanel__title {
      color: red;
    }
  }

  &__form {
    display: flex;
    flex-direction: column;
    width: 100%;
    gap: 10px;

    button {
      height: 40px;
    }
  }
}
</style>