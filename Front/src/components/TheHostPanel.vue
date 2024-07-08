<script setup="">
import AppSpoiler from "@/components/Forms/AppSpoiler.vue";
import AppButton from "@/components/AppButton.vue";
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import AppSelect from "@/components/Forms/AppSelect.vue";
import { destroyAll, fieldsInit } from "@/plugins/select.js";
import { showConfirmBlock } from "@/plugins/confirmBlockPlugin.js";
import { hostSocket, userSocket } from "@/socket/sockets.js";
import { useHostFunctionalStore, useSelectedGame, useSelectedGameData } from "@/stores/game.js";
import { RouterView } from "vue-router";
import { useConfirmBlockStore } from "@/stores/confirmBlock.js";
import AppSmallInfo from "@/components/AppSmallInfo.vue";

let props = defineProps({
  playerItems: Array
})

let editPlayerItems = []

for (let data of props.playerItems) {
  editPlayerItems.push({text: data[0], value: data[1]})
}

const hostFunctional = useHostFunctionalStore()
const selectedGameData = useSelectedGameData()
const confirmStore = useConfirmBlockStore()

const charPerson = ref(null)
const charItem = ref(null)
const charInput = ref(null)
const isOpen = ref(false)
const funcData = ref({
  characteristics: {id: 0, chart: 0, inputValue: ''},
  profession: {id: 0, chart: 0},
  health: {id: 0, chart: 0},
  body: {id: 0},
  swap: {id1: 0, id2: 0, chart: 0},
  steal: {id1: 0, id2: 0, chart: 0},
  heal: {id: 0, chart: 0},
  addCharacteristic: {id: 0, chart: 0, inputValue: ''},
  deleteInventory: {id: 0},
  rotateChangeDelete: {chart: 0},
  bunkerCharacteristics: {chart: 0},
  changeHost: {id: 0},
})

function selectPlayer2WithoutSelectedFirst(value) {
  return selectedGameData.getPlayerForSelect.filter(item => item.value!==value)
}


const professionItems = [
  {text: 'Дилетант', value: 0},
  {text: 'Стажер', value: 1},
  {text: 'Любитель', value: 2},
  {text: 'Опытный', value: 3},
  {text: 'Эксперт', value: 4},
  {text: 'Профессионал', value: 5},
]
const healthLevel = [
  {text: 'Легкая', value: 0},
  {text: 'Средняя', value: 1},
  {text: 'Тяжелая', value: 2},
  {text: 'Критическая', value: 3},
]
const playerCharacteristics = [
  {text: 'Пол', value: 0},
  {text: 'Телосложение', value: 1},
  {text: 'Человеческая черта', value: 2},
  {text: 'Профессия', value: 3},
  {text: 'Здоровье', value: 4},
  {text: 'Хобби/Увлечение', value: 5},
  {text: 'Фобия/Страх', value: 6},
  {text: 'Крупный инвентарь', value: 7},
  {text: 'Рюкзак', value: 8},
  {text: 'Дополнительное сведение', value: 9},
]
const playerCharacteristicsWithAll = [
  {text: 'Все характеристики', value: 0},
  {text: 'Пол', value: 1},
  {text: 'Телосложение', value: 2},
  {text: 'Человеческая черта', value: 3},
  {text: 'Профессия', value: 4},
  {text: 'Здоровье', value: 5},
  {text: 'Хобби/Увлечение', value: 6},
  {text: 'Фобия/Страх', value: 7},
  {text: 'Крупный инвентарь', value: 8},
  {text: 'Рюкзак', value: 9},
  {text: 'Дополнительное сведение', value: 10},
]
const healItems = [
  {text: "Сделать идеально здоровым", value: 0},
  {text: "Сделать чайлдфри", value: 1},
  {text: "Вылечить чайлдфри", value: 2},
  {text: "Вылечить фобию", value: 3},
]
const addCharacteristicItems = [
  {text: 'Человеческая черта', value: 0},
  {text: 'Здоровье', value: 1},
  {text: 'Хобби/Увлечение', value: 2},
  {text: 'Фобия/Страх', value: 3},
  {text: 'Крупный инвентарь', value: 4},
  {text: 'Рюкзак', value: 5},
  {text: 'Дополнительное сведение', value: 6},]
const rotateChangeDeleteItems = [
  {text: 'Пол по часовой стрелке', value: 0, rotate: 0},
  {text: 'Пол против часовой стрелки', value: 0, rotate: 1},
  {text: 'Телосложение по часовой стрелке', value: 1, rotate: 0},
  {text: 'Телосложение против часовой стрелки', value: 1, rotate: 1},
  {text: 'Человеческая черта по часовой стрелке', value: 2, rotate: 0},
  {text: 'Человеческая черта против часовой стрелки', value: 2, rotate: 1},
  {text: 'Профессия по часовой стрелке', value: 3, rotate: 0},
  {text: 'Профессия против часовой стрелки', value: 3, rotate: 1},
  {text: 'Здоровье по часовой стрелке', value: 4, rotate: 0},
  {text: 'Здоровье против часовой стрелки', value: 4, rotate: 1},
  {text: 'Хобби по часовой стрелке', value: 5, rotate: 0},
  {text: 'Хобби против часовой стрелки', value: 5, rotate: 1},
  {text: 'Фобия по часовой стрелке', value: 6, rotate: 0},
  {text: 'Фобия против часовой стрелки', value: 6, rotate: 1},
  {text: 'Инвентарь по часовой стрелке', value: 7, rotate: 0},
  {text: 'Инвентарь против часовой стрелки', value: 7, rotate: 1},
  {text: 'Рюкзак по часовой стрелке', value: 8, rotate: 0},
  {text: 'Рюкзак против часовой стрелки', value: 8, rotate: 1},
  {text: 'Доп. Сведения по часовой стрелке', value: 9, rotate: 0},
  {text: 'Доп. Сведения против часовой стрелки', value: 9, rotate: 1},
  {text: 'Аннулировать всем профессию', value: 10},
  {text: 'Аннулировать всем Хобби', value: 11},
]
const bunkerCharacteristicsItems = [
  {text: 'Когда был построен', value: 1},
  {text: 'Размер', value: 2},
  {text: 'Время нахождения', value: 3},
  {text: 'Количество еды', value: 4},
  {text: 'В бункере присутствует', value: 6},
]

onMounted(() => {
})
onBeforeUnmount(() => {
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

function restartGame(e) {
  showConfirmBlock(e.target, () => {
    hostSocket.emit('clearData');
  }, 'Вы уверены что хотите создать новую игру? Весь прогресс текущей игры будет утрачен')
}

function cancelPreviousAction(e) {
  showConfirmBlock(e.target,() => {
    hostSocket.emit('reverseLog')
  },'Вы уверены что хотите отменить предыдущее действие?')
}

</script>

<template>
  <div class="hostPanel" :class="isOpen?'_active':''"
       tabindex="0"
       @keyup.esc.exact="confirmStore.deactivate"
       @keyup.enter.exact="confirmStore._enterHandler"
  >
    <span @click.left="isOpen=false"></span>
    <div class="hostPanel__block">
      <h3 class="hostPanel__title">Панель ведущего</h3>
      <div class="hostPanel__body">
        <div class="hostPanel__timers timers-hostPanel">
          <div class="timers-hostPanel__num">
            <AppButton @click="hostFunctional.activateTimer(15)" class="timers-hostPanel__btn"
                       :class="selectedGameData.activeTimers[0]?'gold border':''">15
            </AppButton>
            <AppButton @click="hostFunctional.activateTimer(30)" class="timers-hostPanel__btn"
                       :class="selectedGameData.activeTimers[1]?'gold border':''">30
            </AppButton>
            <AppButton @click="hostFunctional.activateTimer(60)" class="timers-hostPanel__btn"
                       :class="selectedGameData.activeTimers[2]?'gold border':''">60
            </AppButton>
          </div>
          <div v-if="selectedGameData.timerStart" class="timers-hostPanel__nav">
            <AppButton
                @click="selectedGameData.isPauseTimer?hostSocket.emit('timer:resume'):hostSocket.emit('timer:pause')"
                color="gold" class="timers-hostPanel__btn" border="true"
                :iconName="!selectedGameData.isPauseTimer?'pause.png':'play.png'" />
            <AppButton @click="hostSocket.emit('timer:stop')" color="gold" class="timers-hostPanel__btn" border="true"
                       iconName="stop.png" />
          </div>
        </div>
        <div class="hostPanel__buttons buttons-hostPanel">
          <AppButton class="buttons-hostPanel__btn" color="grayGold" border="true"
                     @click="hostFunctional.refreshBunkerData">Изменить катаклизм
          </AppButton>
          <!--          <AppButton border="true" class="buttons-hostPanel__btn" color="grayGold"-->
          <!--                     @click="hostFunctional.refreshBunkerData($event)">Изменить бункер-->
          <!--          </AppButton>-->
          <AppButton :class="selectedGameData.isVoiting?'_active':''" border="true" class="buttons-hostPanel__btn"
                     color="grayGold"
                     @click="selectedGameData.isVoiting?hostFunctional.endVoiting($event):hostFunctional.startVoiting($event)"
          >
            {{ selectedGameData.isVoiting? "Завершить голосование":"Начать голосование" }}
          </AppButton>
          <!--          <AppButton class="buttons-hostPanel__btn" color="grayGold" border="true"-->
          <!--                     @click="hostFunctional.setAllProfessionToNull($event)">Аннулировать всем специальность-->
          <!--          </AppButton>-->
          <!--          <AppButton border="true" class="buttons-hostPanel__btn" color="grayGold"-->
          <!--                     @click="hostFunctional.professionRotate($event)">Специальности по часовой стрелке-->
          <!--          </AppButton>-->
        </div>
        <div class="hostPanel__space space-hostPanel">
          <div class="space-hostPanel__title">Мест в бункере</div>
          <div class="space-hostPanel__buttons">
            <AppButton color="red"
                       @click="hostFunctional.changeSpaceNum(false,$event)" class="space-hostPanel__btn"
                       :disabled="selectedGameData.bunkerData.maxSurvivor<=1"
            >-
            </AppButton>
            <AppButton color="green" class="space-hostPanel__btn"
                       @click="hostFunctional.changeSpaceNum(true,$event)"
                       :disabled="selectedGameData.bunkerData.maxSurvivor>=selectedGameData.getActivePlayersFromUserData.length"
            >+
            </AppButton>
          </div>
        </div>
        <div class="hostPanel__settings settings-hostPanel">
          <AppSpoiler title="Изменить характеристику">
            <AppSelect :options="selectedGameData.getPlayerForSelectAndAll" v-model="funcData.characteristics.id" />
            <AppSelect :options="playerCharacteristicsWithAll" v-model="funcData.characteristics.chart" />
            <div :class="![8,9,10].includes(funcData.characteristics.chart.value)?'_hide':''"
                 class="characteristicsInput">
              <input v-model="funcData.characteristics.inputValue"
                     placeholder="Ваша характеристика"
                     type="text">
            </div>
            <button class="hostButton btn grayGold border" @click.prevent="hostFunctional.changeCharacteristics(
                $event,
                funcData.characteristics.id.value,
                funcData.characteristics.chart.value,
                funcData.characteristics.inputValue,
            )">
              <span class="text">Изменить характеристику</span>
            </button>
          </AppSpoiler>
          <AppSpoiler title="Изменить стаж профессии">
            <AppSelect :options="selectedGameData.getPlayerForSelectAndAll" v-model="funcData.profession.id" />
            <AppSelect :options="professionItems" v-model="funcData.profession.chart" />
            <button class="hostButton btn grayGold border"
                    @click.prevent="hostFunctional.professionExp($event,
                    funcData.profession.id.value,
                    funcData.profession.chart.value)">
              <span class="text">Изменить стаж профессии</span>
            </button>
          </AppSpoiler>
          <AppSpoiler title="Изменить степень болезни">
            <AppSelect :options="selectedGameData.getPlayerForSelectAndAll" v-model="funcData.health.id" />
            <AppSelect :options="healthLevel" v-model="funcData.health.chart" />
            <button class="hostButton btn grayGold border"
                    @click.prevent="hostFunctional.degreeOfSick($event,
                    funcData.health.id.value,
                    funcData.health.chart.value)">
              <span class="text">Изменить степень болезни</span>
            </button>
          </AppSpoiler>
          <AppSpoiler title="Изменить пол на противоположный">
            <AppSelect :options="selectedGameData.getPlayerForSelectAndAll" v-model="funcData.body.id" />
            <button class="hostButton btn grayGold border"
                    @click.prevent="hostFunctional.sexOpposite($event,funcData.body.id.value)">
              <span class="text">Изменить пол</span>
            </button>
          </AppSpoiler>
          <AppSpoiler title="Обменять характеристики">
            <AppSelect :options="selectedGameData.getPlayerForSelectAndAll" v-model="funcData.swap.id1" />
            <AppSelect v-if="funcData.swap.id1.value!==0"
                       :options="selectPlayer2WithoutSelectedFirst(funcData.swap.id1.value)"
                       v-model="funcData.swap.id2" />
            <AppSelect :options="playerCharacteristics" v-model="funcData.swap.chart" />
            <button class="hostButton btn grayGold border"
                    @click.prevent="hostFunctional.swapCharacter(
                        $event,
                        funcData.swap.id1.value,
                        funcData.swap.id2.value||null,
                        funcData.swap.chart.value
                        )">
              <span class="text">Обменять</span>
            </button>
          </AppSpoiler>
          <AppSpoiler title="Украсть характеристику">
            <p>Кто крадет:</p>
            <AppSelect v-model="funcData.steal.id1" :options="selectedGameData.getPlayerForSelect" />
            <p>У кого крадут:</p>
            <AppSelect v-model="funcData.steal.id2"
                       :options="selectPlayer2WithoutSelectedFirst(funcData.steal.id1.value)" />
            <AppSelect v-model="funcData.steal.chart" :options="playerCharacteristics" />
            <div class="hostButtonBlock">
              <button class="hostButton btn grayGold border"
                      @click.prevent="hostFunctional.stealChart($event,funcData.steal.id1.value,funcData.steal.id2.value,funcData.steal.chart.value)">
                <span class="text">Украсть</span>
              </button>
              <div class="hostButtonBlock__smallInfo smallInfo-hostButtonBlock">
                <div class="smallInfo-hostButtonBlock__img smallInfo__img">i</div>
                <div class="smallInfo-hostButtonBlock__block">
                  <p>
                    <b>Пол, телосложение, Человеческая черта, Профессия, Здоровье, Фобия</b> – тот, у кого украли одну
                                                                                             из
                                                                                             данных характеристик,
                                                                                             получает (автоматически)
                                                                                             новую
                  </p>
                  <br>
                  <br>
                  <p>
                    <b>Хобби, крупный инвентарь, рюкзак, доп.сведение</b> – тот, у кого украли характеристику, получает
                                                                          значение <b>Пусто</b>
                  </p>
                </div>
              </div>
            </div>
          </AppSpoiler>
          <AppSpoiler title="Вылечить/Сделать">
            <AppSelect v-model="funcData.heal.id" :options="selectedGameData.getPlayerForSelectAndAll" />
            <AppSelect v-model="funcData.heal.chart" :options="healItems" />
            <button class="hostButton btn grayGold border"
                    @click.prevent="
                    hostFunctional.healthOrDo(
                        $event,
                    funcData.heal.id.value,
                    funcData.heal.chart.value
                    )">
              <span class="text">Применить</span>
            </button>
          </AppSpoiler>
          <AppSpoiler title="Добавить доп. характеристику">
            <AppSelect :options="selectedGameData.getPlayerForSelectAndAll" v-model="funcData.addCharacteristic.id" />
            <AppSelect :options="addCharacteristicItems" v-model="funcData.addCharacteristic.chart" />
            <div :class="![4,5,6].includes(funcData.addCharacteristic.chart.value)?'_hide':''"
                 class="characteristicsInput">
              <input v-model="funcData.addCharacteristic.inputValue"
                     placeholder="Ваша характеристика"
                     maxlength="100"
                     type="text">
            </div>
            <button class="hostButton btn grayGold border"
                    @click.prevent="hostFunctional.addChart(
                        $event,
                        funcData.addCharacteristic.id.value,
                    funcData.addCharacteristic.chart.value,
                    funcData.addCharacteristic.inputValue
                    )">
              <span class="text">Добавить</span>
            </button>
          </AppSpoiler>
          <AppSpoiler title="Удалить/перенести инвентарь">
            <AppSelect :options="selectedGameData.getPlayerForSelectAndAll" v-model="funcData.deleteInventory.id" />
            <button class="hostButton btn grayGold border"
                    @click.prevent="hostFunctional.deleteRelocate($event,funcData.deleteInventory.id.value,0)">
              <span class="text">Удалить инвентарь</span>
            </button>
            <button class="hostButton btn grayGold border"
                    @click.prevent="hostFunctional.deleteRelocate($event,funcData.deleteInventory.id.value,2)">
              <span class="text">Удалить рюкзак</span>
            </button>
            <button v-if="funcData.deleteInventory.id.value !== 0" class="hostButton btn grayGold border"
                    @click.prevent="hostFunctional.changeRelocate($event,funcData.deleteInventory.id.value,1)">
              <span class="text">Перенести инвентарь</span>
            </button>
            <button v-if="funcData.deleteInventory.id.value !== 0" class="hostButton btn grayGold border"
                    @click.prevent="hostFunctional.changeRelocate($event,funcData.deleteInventory.id.value,3)">
              <span class="text">Перенести рюкзак</span>
            </button>
          </AppSpoiler>
          <AppSpoiler title="Изменить по/против/аннулировать">
            <AppSelect :options="rotateChangeDeleteItems" v-model="funcData.rotateChangeDelete.chart" />
            <button class="hostButton btn grayGold border"
                    @click.prevent="hostFunctional.rotateChangeDelete($event,rotateChangeDeleteItems,funcData.rotateChangeDelete.chart)">
              <span class="text">Применить</span>
            </button>
          </AppSpoiler>
          <AppSpoiler title="Изменить бункер">
            <AppSelect :options="bunkerCharacteristicsItems" v-model="funcData.bunkerCharacteristics.chart" />
            <button class="hostButton btn grayGold border"
                    @click.prevent="hostFunctional.changeBunker($event, funcData.bunkerCharacteristics.chart.value)">
              <span class="text">Применить</span>
            </button>
          </AppSpoiler>

          <!--          <div class="settings-hostPanel__dice dice-settings">-->
          <!--            <div class="dice-settings__title">Бросить кубик</div>-->
          <!--            <div class="dice-settings__body">-->
          <!--              <button class="hostButton btn grayGold border" @click="hostFunctional.rollTheDice($event,6)"-->
          <!--                      :disabled="selectedGameData.showDice20 || selectedGameData.showDice6"-->
          <!--              >-->
          <!--                <span class="text">С 6 гранями</span></button>-->
          <!--              <button class="hostButton btn grayGold border" @click="hostFunctional.rollTheDice($event,20)"-->
          <!--                      :disabled="selectedGameData.showDice20 || selectedGameData.showDice6"-->
          <!--              >-->
          <!--                <span class="text">С 20 гранями</span>-->
          <!--              </button>-->
          <!--            </div>-->
          <!--          </div>-->

          <AppSpoiler title="Бросить кубик">
            <div class="dice-settings__body">
              <button class="hostButton btn grayGold border" @click.prevent="hostFunctional.rollTheDice($event,6)"
                      :disabled="selectedGameData.showDice20 || selectedGameData.showDice6"
              >
                <span class="text">С 6 гранями</span></button>
              <button class="hostButton btn grayGold border" @click.prevent="hostFunctional.rollTheDice($event,20)"
                      :disabled="selectedGameData.showDice20 || selectedGameData.showDice6"
              >
                <span class="text">С 20 гранями</span>
              </button>
            </div>
          </AppSpoiler>
          <AppSpoiler title="Сменить ведущего">
            <AppSelect :options="selectedGameData.getAllPlayersSelectToChangeAdmin" v-model="funcData.changeHost.id" />
            <button class="hostButton btn grayGold border"
                    @click.prevent="hostFunctional.transferHost($event,funcData.changeHost.id.value)">
              <span class="text">Сменить ведущего</span>
            </button>
          </AppSpoiler>
        </div>
        <div class="hostPanel__mainButton mainButton-hostPanel">
          <AppButton color="gold" @click="cancelPreviousAction" :disabled="!selectedGameData.showCancelButton">Отменить предыдущее действие</AppButton>
          <AppButton color="green" @click="restartGame">Начать игру заново</AppButton>
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

          &::before {
            width: 2px;
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

      &::before, &::after {
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
  justify-content: space-around;
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

  p {
    margin-bottom: 5px;
    margin-top: 8px;
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
    padding-top: 10px;
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
  width: 100%;
  display: flex;
  justify-content: center;
  color: #FFFFFF;
  padding: 12px 20px;
  position: relative;
  margin-top: 15px;
}

.characteristicsInput {
  width: 100%;
  display: flex;
  transition: height 0.3s ease, padding-top 0.3s ease;
  height: 48px;
  padding-top: 5px;

  &._hide {
    height: 0;
    padding-top: 0;
    overflow: hidden;
  }

  input {
    width: 100%;
    margin-bottom: 0;
  }
}

.hostButtonBlock {
  position: relative;
}

.smallInfo-hostButtonBlock {
  z-index: 999;
  position: absolute;
  right: 10px;
  top: calc(50% + 7px);
  transform: translate(0, -50%);

  &__img {
    cursor: pointer;
    position: relative;
    z-index: 99;
    pointer-events: auto;
  }

  &__img:hover + .smallInfo-hostButtonBlock__block {
    opacity: 1;
  }

  &__block {
    position: absolute;
    width: 300px;
    left: -280px;
    bottom: calc(100% + 10px);
    background: #333333;
    padding: 10px;
    border-radius: 8px;
    opacity: 0;
    transition: opacity 0.2s ease;
    pointer-events: none;
  }
}
</style>