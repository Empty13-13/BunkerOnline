<script setup="">
import AppSpoiler from "@/components/Forms/AppSpoiler.vue";

const charPerson = ref(null)
const charItem = ref(null)
const charInput = ref(null)
const isOpen = ref(false)

function activateTimer() {

}

onMounted(() => {
  fieldsInit()
})
onBeforeUnmount(() => {
  destroyAll()
})

function charClick(e) {
  console.log(charPerson, charItem, charInput)
}

//========================================================================================================================================================
function closeRoom(e) {
  showConfirmBlock(e.target, async () => {
    hostSocket.emit('closeRoom')
  }, 'Вы уверены, что хотите закрыть комнату?')
}

import AppButton from "@/components/AppButton.vue";
import { onBeforeUnmount, onMounted, ref } from "vue";
import AppSelect from "@/components/Forms/AppSelect.vue";
import { destroyAll, fieldsInit } from "@/plugins/select.js";
import { showConfirmBlock } from "@/plugins/confirmBlockPlugin.js";
import { hostSocket } from "@/socket/sockets.js";
</script>

<template>
  <div class="hostPanel" :class="isOpen?'_active':''">
    <span @click.left="isOpen=false"></span>
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
            <AppButton color="gold" class="timers-hostPanel__btn" border="true" iconName="pause.png" />
            <AppButton color="gold" class="timers-hostPanel__btn" border="true" iconName="stop.png" />
          </div>
        </div>
        <div class="hostPanel__buttons buttons-hostPanel">
          <AppButton class="buttons-hostPanel__btn" color="grayGold" border="true">Изменить катаклизм</AppButton>
          <AppButton class="buttons-hostPanel__btn" color="grayGold" border="true">Изменить бункер</AppButton>
          <AppButton class="buttons-hostPanel__btn" color="grayGold" border="true">Начать голосование</AppButton>
          <AppButton class="buttons-hostPanel__btn" color="grayGold" border="true">Аннулировать всем специальность</AppButton>
          <AppButton class="buttons-hostPanel__btn" color="grayGold" border="true">Специальности по часовой стрелке</AppButton>
        </div>
        <div class="hostPanel__space space-hostPanel">
          <div class="space-hostPanel__title">Мест в бункере</div>
          <div class="space-hostPanel__buttons">
            <AppButton color="red" class="space-hostPanel__btn">-</AppButton>
            <AppButton color="green" class="space-hostPanel__btn">+</AppButton>
          </div>
        </div>
        <div class="hostPanel__settings settings-hostPanel">
          <AppSpoiler title="Изменить характеристику">
            <select id="city" v-model="charPerson">
              <option value="all">Для всех</option>
              <option value="321">Empty</option>
              <option value="11">NoName</option>
              <option selected value="33">Nick233</option>
            </select>
            <select id="city" v-model="charItem">
              <option value="all">Для всех</option>
              <option value="321">Empty</option>
              <option value="11">NoName</option>
              <option selected value="33">Nick233</option>
            </select>
            <input type="text" v-model="charInput" placeholder="Ваша характеристика">
            <button class="hostButton btn grayGold border" @click.prevent="charClick">
              <span class="text">Изменить характеристику</span>
            </button>
          </AppSpoiler>
          <AppSpoiler title="Изменить стаж специальности">
            <select id="city" v-model="charPerson">
              <option value="all">Для всех</option>
              <option value="321">Empty</option>
              <option value="11">NoName</option>
              <option selected value="33">Nick233</option>
            </select>
            <select id="city" v-model="charItem">
              <option value="all">Для всех</option>
              <option value="321">Empty</option>
              <option value="11">NoName</option>
              <option selected value="33">Nick233</option>
            </select>
            <button class="hostButton btn grayGold border" @click.prevent="charClick">
              <span class="text">Изменить стаж профессии</span>
            </button>
          </AppSpoiler>
          <AppSpoiler title="Изменить степень болезни">
            <select id="city" v-model="charPerson">
              <option value="all">Для всех</option>
              <option value="321">Empty</option>
              <option value="11">NoName</option>
              <option selected value="33">Nick233</option>
            </select>
            <select id="city" v-model="charItem">
              <option value="all">Для всех</option>
              <option value="321">Empty</option>
              <option value="11">NoName</option>
              <option selected value="33">Nick233</option>
            </select>
            <button class="hostButton btn grayGold border" @click.prevent="charClick">
              <span class="text">Изменить степень болезни</span>
            </button>
          </AppSpoiler>
          <AppSpoiler title="Изменить пол на противоположный">
            <select id="city" v-model="charPerson">
              <option value="all">Для всех</option>
              <option value="321">Empty</option>
              <option value="11">NoName</option>
              <option selected value="33">Nick233</option>
            </select>
            <select id="city" v-model="charItem">
              <option value="all">Для всех</option>
              <option value="321">Empty</option>
              <option value="11">NoName</option>
              <option selected value="33">Nick233</option>
            </select>
            <button class="hostButton btn grayGold border" @click.prevent="charClick">
              <span class="text">Изменить пол</span>
            </button>
          </AppSpoiler>
          <AppSpoiler title="Изменить по/против/аннулировать">
            <select id="city" v-model="charPerson">
              <option value="all">Для всех</option>
              <option value="321">Empty</option>
              <option value="11">NoName</option>
              <option selected value="33">Nick233</option>
            </select>
            <select id="city" v-model="charItem">
              <option value="all">Для всех</option>
              <option value="321">Empty</option>
              <option value="11">NoName</option>
              <option selected value="33">Nick233</option>
            </select>
            <button class="hostButton btn grayGold border" @click.prevent="charClick">
              <span class="text">Применить</span>
            </button>
          </AppSpoiler>
          <AppSpoiler title="Изменить бункер">
            <select id="city" v-model="charPerson">
              <option value="all">Для всех</option>
              <option value="321">Empty</option>
              <option value="11">NoName</option>
              <option selected value="33">Nick233</option>
            </select>
            <select id="city" v-model="charItem">
              <option value="all">Для всех</option>
              <option value="321">Empty</option>
              <option value="11">NoName</option>
              <option selected value="33">Nick233</option>
            </select>
            <button class="hostButton btn grayGold border" @click.prevent="charClick">
              <span class="text">Применить</span>
            </button>
          </AppSpoiler>
          <AppSpoiler title="Обменять характеристики">
            <select id="city" v-model="charPerson">
              <option value="all">Для всех</option>
              <option value="321">Empty</option>
              <option value="11">NoName</option>
              <option selected value="33">Nick233</option>
            </select>
            <select id="city" v-model="charItem">
              <option value="all">Для всех</option>
              <option value="321">Empty</option>
              <option value="11">NoName</option>
              <option selected value="33">Nick233</option>
            </select>
            <button class="hostButton btn grayGold border" @click.prevent="charClick">
              <span class="text">Обменять</span>
            </button>
          </AppSpoiler>
          <AppSpoiler title="Украсть характеристику">
            <select id="city" v-model="charPerson">
              <option value="all">Для всех</option>
              <option value="321">Empty</option>
              <option value="11">NoName</option>
              <option selected value="33">Nick233</option>
            </select>
            <select id="city" v-model="charItem">
              <option value="all">Для всех</option>
              <option value="321">Empty</option>
              <option value="11">NoName</option>
              <option selected value="33">Nick233</option>
            </select>
            <button class="hostButton btn grayGold border" @click.prevent="charClick">
              <span class="text">Украсть</span>
            </button>
          </AppSpoiler>
          <AppSpoiler title="Вылечить/Сделать">
            <select id="city" v-model="charPerson">
              <option value="all">Для всех</option>
              <option value="321">Empty</option>
              <option value="11">NoName</option>
              <option selected value="33">Nick233</option>
            </select>
            <select id="city" v-model="charItem">
              <option value="all">Для всех</option>
              <option value="321">Empty</option>
              <option value="11">NoName</option>
              <option selected value="33">Nick233</option>
            </select>
            <button class="hostButton btn grayGold border" @click.prevent="charClick">
              <span class="text">Применить</span>
            </button>
          </AppSpoiler>
          <AppSpoiler title="Добавить доп. характеристику">
            <select id="city" v-model="charPerson">
              <option value="all">Для всех</option>
              <option value="321">Empty</option>
              <option value="11">NoName</option>
              <option selected value="33">Nick233</option>
            </select>
            <select id="city" v-model="charItem">
              <option value="all">Для всех</option>
              <option value="321">Empty</option>
              <option value="11">NoName</option>
              <option selected value="33">Nick233</option>
            </select>
            <button class="hostButton btn grayGold border" @click.prevent="charClick">
              <span class="text">Добавить</span>
            </button>
          </AppSpoiler>
          <AppSpoiler title="Удалить/перенести инвентарь">
            <select id="city" v-model="charPerson">
              <option value="all">Для всех</option>
              <option value="321">Empty</option>
              <option value="11">NoName</option>
              <option selected value="33">Nick233</option>
            </select>
            <select id="city" v-model="charItem">
              <option value="all">Для всех</option>
              <option value="321">Empty</option>
              <option value="11">NoName</option>
              <option selected value="33">Nick233</option>
            </select>
            <button class="hostButton btn grayGold border" @click.prevent="charClick">
              <span class="text">Применить</span>
            </button>
          </AppSpoiler>

          <div class="settings-hostPanel__dice dice-settings">
            <div class="dice-settings__title">Бросить кубик</div>
            <div class="dice-settings__body">
              <button class="hostButton btn grayGold border">
                <span class="text">С 6 гранями</span></button>
              <button class="hostButton btn grayGold border">
                <span class="text">С 20 гранями</span>
              </button>
            </div>
          </div>

          <AppSpoiler title="Сменить ведущего">
            <select id="city" v-model="charPerson">
              <option value="all">Для всех</option>
              <option value="321">Empty</option>
              <option value="11">NoName</option>
              <option selected value="33">Nick233</option>
            </select>
            <select id="city" v-model="charItem">
              <option value="all">Для всех</option>
              <option value="321">Empty</option>
              <option value="11">NoName</option>
              <option selected value="33">Nick233</option>
            </select>
            <button class="hostButton btn grayGold border" @click.prevent="charClick">
              <span class="text">Сменить ведущего</span>
            </button>
          </AppSpoiler>
        </div>
        <div class="hostPanel__mainButton mainButton-hostPanel">
          <AppButton color="green">Начать игру заново</AppButton>
          <AppButton @click="closeRoom" color="red">Закрыть комнату</AppButton>
        </div>
      </div>
    </div>
  </div>
  <button @click.left="isOpen=!isOpen" class="hostActivateButton btn gold border" :class="isOpen?'_active':''">
    <span class="hostActivateButton__icon">
      <span class=""></span>
      <span class=""></span>
      <span class=""></span>
    </span>
    <span>
      Панель ведущего
    </span>
  </button>
</template>

<style scoped lang="scss">
@import "@/assets/scss/style";

.hostActivateButton {
  position: fixed;
  left: 20px;
  bottom: 20px;
  z-index: 21;
  padding: 12px 15px;
  height: 40px;
  display: flex;
  justify-content: center;
  align-items: center;

  span {
    position: relative;
    z-index: 2;
  }

  &._active {
    .hostActivateButton__icon {
      transform: rotate(135deg);

      span {
        &:nth-child(1) {
          height: 2px;
          transform: translateX(3px) translateY(6px);

          &::before {
            width: 2px;
            height: 4px;
            transform: translateX(-3px) translateY(-7px);
          }
          &::after {
            width: 2px;
            transform: translateX(-9px) translateY(-3px);
          }
        }

        &:nth-child(2) {
          width: 4px;
          height: 2px;
          transform: translateX(-1px);

          &::before {width: 2px;
            height: 2px;
            transform: translateX(1px);
          }
          &::after {
            width: 4px;
            height: 2px;
            transform: translateX(-4px);
          }
        }

        &:nth-child(3) {
          width: 2px;
          transform: translateX(6px) translateY(-4px);

          &::before {
            width: 2px;
            height: 4px;
            transform: translateX(-6px) translateY(3px);
          }
          &::after {
            height: 2px;
            transform: translateX(-6px) translateY(-2px);
          }
        }
      }
    }
  }

  &__icon {
    width: 15px;
    height: 17px;
    transition: .3s transform;
    display: inline-block;
    position: relative;
    margin-right: 12px;

    span {
      position: absolute;
      display: block;
      top: 50%;
      width: 3px;
      height: 3px;
      margin-top: -7.5px;
      background-color: #fff;
      border-radius: 1.5px;
      transition: .3s width, .3s opacity, .3s transform;

      &::before,&::after {
        content: '';
        position: absolute;
        display: block;
        left: 6px;
        width: 3px;
        height: 3px;
        background-color: #fff;
        border-radius: 1.5px;
        transition: .3s transform, .3s width, .3s height, .3s border-radius;
      }
      &::after {
        left: 400%;
      }

      &:nth-child(2) {
        margin-top: -1.5px;
      }
      &:nth-child(3) {
        margin-top: 4.5px;
      }
    }
  }

}

.hostPanel {
  position: fixed;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  z-index: 20;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.2s ease;

  &._active {
    pointer-events: auto;
    opacity: 1;

    .hostPanel__block {
      right: 0;
    }
  }

  & > span {
    content: '';
    position: fixed;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.65);
  }

  &__block {
    padding: 40px 23px;
    position: fixed;
    right: -10%;
    top: 0;
    height: 100%;
    z-index: 999;
    backdrop-filter: blur(25px);
    background: rgba(255, 255, 255, 0.02);
    overflow-y: auto;
    max-width: 370px;
    width: 100%;
    transition: right 0.3s;
  }

  &__title {
    font-size: 20px;
    font-weight: 700;
    margin-bottom: 30px;
    text-align: center;
  }

  &__body {
  }
}

.timers-hostPanel {
  display: flex;
  justify-content: space-between;
  margin-bottom: 30px;

  &__num {
    display: flex;
    gap: 6px;
  }

  &__btn {
    width: 45px;
    height: 45px;
  }

  &__nav {
    display: flex;
    gap: 10px;
  }
}

.buttons-hostPanel {
  width: 100%;
  margin-bottom: 20px;

  &__btn {
    margin-bottom: 13px;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 12px 10px;


    //background: transparent;
    width: 100%;
    //gap: 10px;
    ////border: 1px solid rgba(255, 255, 255, 0.2);
    //border-radius: 6px;
    //font-weight: 700;
    //text-align: center;
    //color: #FFFFFF;
    //flex: 1 1 auto;
    //transition: border-color 0.2s ease 0s;
    //
    //&:hover {
    //  border-color: white;
    //}
    //
    //&:last-child {
    //  margin-bottom: 0;
    //}

  }
}

.space-hostPanel {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 27px;

  &__title {
  }

  &__buttons {
    display: flex;
    gap: 15px;
    font-size: 18px;
    font-weight: 700;
  }

  &__btn {
    width: 30px;
    height: 30px;
  }
}

.settings-hostPanel {
  margin-bottom: 30px;

  & > .spoiler {
    margin-bottom: 15px;

    &:last-child {
    }
  }

  input {
    background: #1A1A1A;
    border-radius: 6px;
    font-size: 11px;
    padding: 13px 14px;
    color: white;
    margin-bottom: 13px;
  }

  &__dice {
  }
}

.dice-settings {
  margin-top: 30px;
  margin-bottom: 20px;

  &__title {
    font-weight: 700;
    margin-bottom: 13px;
  }

  &__body {
    display: flex;
    gap: 20px;
    justify-content: space-between;
  }
}

.mainButton-hostPanel {
  display: flex;
  flex-direction: column;
  gap: 13px;

  & .btn {
    padding: 12px;
  }
}

.hostButton {
  //background: transparent;
  width: 100%;
  display: flex;
  justify-content: center;
  //align-items: center;
  //border: 1px solid rgba(255, 255, 255, 0.2);
  //border-radius: 6px;
  color: #FFFFFF;
  padding: 12px 20px;
  position: relative;
  //transition: border-color 0.2s ease;
  //
  //&:hover {
  //  border-color: white;
  //}
}
</style>