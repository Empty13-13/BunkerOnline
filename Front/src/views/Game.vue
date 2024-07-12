<script setup="">
import {
  computed,
  onBeforeMount,
  onBeforeUpdate,
  onMounted,
  onUnmounted,
  onUpdated,
  reactive,
  ref,
  watchEffect
} from "vue";
import { useMyProfileStore } from "@/stores/profile.js";
import AppBackground from "@/components/AppBackground.vue";
import AppButton from "@/components/AppButton.vue";
import TheGamerInfo from "@/components/TheGamerInfo.vue";
import TheVoteBlock from "@/components/TheVoteBlock.vue";
import TheHostPanel from "@/components/TheHostPanel.vue";
import AppSmallInfo from "@/components/AppSmallInfo.vue";
import AppAvatar from "@/components/AppAvatar.vue";
import TheLogs from "@/components/TheLogs.vue";
import { showConfirmBlock } from "@/plugins/confirmBlockPlugin.js";
import {
  copyLinkToBuffer,
  getId,
  getLinkParams,
  getLocalData,
  getPercentForVote, getRandomInt,
  objIsEmpty,
  setLocalData
} from "@/plugins/functions.js";
import {
  useHostFunctionalStore,
  useSelectedGame,
  useSelectedGameData,
  useSelectedGameGameplay
} from "@/stores/game.js";
import { usePreloaderStore } from "@/stores/preloader.js";
import { useGlobalPopupStore } from "@/stores/popup.js";
import { useUserSocketStore } from "@/stores/socket/userSocket.js";
import { useHostSocketStore } from "@/stores/socket/hostSocket.js";
import router from "@/router/index.js";
import { goToBlock, openNavigation, showInfoHandler } from "@/plugins/navigationPlugin.js";
import AppLoader from "@/components/AppLoader.vue";
import AppDice6 from "@/components/dices/AppDice6.vue";
import TheAdminPanel from "@/components/TheAdminPanel.vue";

const myProfile = useMyProfileStore()
const selectedGame = useSelectedGame()
const globalPreloader = usePreloaderStore()
const globalPopup = useGlobalPopupStore()
const userSocket = useUserSocketStore()
const hostSocket = useHostSocketStore()
const hostFunctional = useHostFunctionalStore()
const selectedGameData = useSelectedGameData()
const selectedGameGameplay = useSelectedGameGameplay()

const noteTextArea = ref(null)

const firstItem = ['№ Имя', 'num']
const itemsName = [
  ['Пол', 'sex'],
  ['Телосложение', 'body'],
  ['Человеческая черта', 'trait'],
  ['Профессия', 'profession', `
  Дилетант – до 3 месяцев;<br>
Стажер – от 3 месяцев до 1 года;<br>
Любитель – от 1 до 2 лет;<br>
Опытный – от 2 до 5 лет;<br>
Эксперт – от 5 до 10 лет;<br>
Профессионал – более 10 лет.
  `],
  ['Здоровье', 'health'],
  ['Хобби/Увлечение', 'hobbies', `
  Дилетант – до 3 месяцев;<br>
Новичок – от 3 месяцев до 1 года;<br>
Любитель – от 1 до 2 лет;<br>
Продвинутый – от 2 до 5 лет;<br>
Мастер (гуру) – более 5 лет.
  `],
  ['Фобия/Страх', 'phobia'],
  ['Крупный инвентарь', 'inventory'],
  ['Рюкзак', 'backpack'],
  ['Дополнительное сведение', 'addInfo'],
]
const navigationItems = [
  {name: 'Катаклизм', showWatcher: true, goToId: 'welcome'},
  {name: 'Бункер', showWatcher: true, goToId: 'bunker'},
  {name: 'Информация обо мне', showWatcher: false, goToId: 'gamerInfo'},
  {name: 'Желающие попасть внутрь', showWatcher: true, goToId: 'gamerList'},
  {name: 'Таблица со спец возможностями', showWatcher: true, goToId: 'spec'},
  {name: 'Заметки', showWatcher: false, goToId: 'notes'},
]
const getActiveNavigationItems = computed(() => {
  if (selectedGame.imWatcher) {
    return navigationItems.filter(item => item.showWatcher)
  }
  else {
    return navigationItems
  }
})
const specItems = [
  ['Спец. возможность 1', 'spec1'],
  ['Спец. возможность 2', 'spec2'],
]
let isActive = ref(null)
const diceNum = ref(0)

const mayStartGame = computed(() => {
  return selectedGame.players.length>=selectedGame.minPlayers
})

onBeforeMount(() => {
  globalPreloader.activate()
  userSocket.bindEvents()
  hostSocket.bindEvents()

  userSocket.connect()
  hostSocket.setConnect()
})
onMounted(() => {
  watchEffect(() => {
    if (noteTextArea.value) {
      noteTextArea.value.value = getLocalData(`note:game=${getId.value}`)? getLocalData(
          `note:game=${getId.value}`).text:''
    }
  })
})
onUnmounted(() => {
  userSocket.close()
  hostSocket.close()

  selectedGame.clear()
  hostFunctional.clearData()
  selectedGameData.clearData()
})

function getAccessStr(access) {
  if (access==='admin') {
    return 'Админ';
  }
  if (access==='default') {
    return 'Пользователь'
  }
  if (access==='noreg') {
    return 'Гость'
  }
  return access
}

function removeGamer(index, id) {
  hostSocket.emit('kickOutUser', id)
  selectedGame.players.splice(index, 1)
}

const getURL = computed(() => {
  return window.location.href
})

const navBlock = ref()

/**
 * @description Ниже собраны все функции, которые буду использоваться для всяких кликов, событий и т.п.
 */
function closeRoom(e) {
  showConfirmBlock(e.target, async () => {
    hostSocket.emit('closeRoom')
  }, 'Вы уверены, что хотите закрыть комнату?')
}

function startGame(e) {
  showConfirmBlock(e.target, async () => {
    globalPreloader.activate()
    if (selectedGame.isCreateCustomGame) {
      let allData = {}
      selectedGame.players.forEach(player => {
        let body = document.querySelector(`[data-id="${player.id}"]`)
        if (body) {
          const charNames = [
            'sex',
            'body',
            'trait',
            'profession',
            'health',
            'hobbies',
            'phobia',
            'inventory',
            'backpack',
            'addInfo',
            'spec1',
            'spec2'
          ]
          let playerData = {}
          charNames.forEach(char => {
            let inputValue = body.querySelector(`#${char}`)
            if (inputValue && inputValue.value) {
              playerData[char] = inputValue.value || null
            }
            else {
              playerData[char] = null
            }
          })

          allData[player.id] = playerData
        }
      })
      console.log(allData)
      if (!objIsEmpty(allData)) {
        hostSocket.emit('startGame', allData)
        await router.push({top: 0})
      }
      else {
        globalPopup.activate('Ошибка', 'Произошла ошибка при создании данных. Пожалуйста, попробуйте ещё раз')
      }
    }
    else {
      hostSocket.emit('startGame')
    }
  }, null, 'right')
}


function isHiddenGameHandler() {
  hostSocket.emit('isHiddenGame', selectedGame.isHidden)
}

function isHostPlayerTooHandler() {
  hostSocket.emit('isHostPlayerTooGame', hostFunctional.isPlayerToo)
}

async function clickCopyInput(e) {
  let element = e.target
  if (!element.classList.contains('info-awaitRoom__link')) {
    element = element.closest('.info-awaitRoom__link')
  }
  element.classList.remove('_error')
  element.classList.remove('_active')

  if (await copyLinkToBuffer()) {
    element.classList.add('_active')
  }
  else {
    element.classList.add('_error')
  }

  setTimeout(() => {
    element.classList.remove('_error')
    element.classList.remove('_active')
  }, 1500)
}

let timerNoteInput = setTimeout(() => {
}, 500)

function noteInputHandler(e) {
  clearTimeout(timerNoteInput)
  timerNoteInput = setTimeout(() => {
    setLocalData(`note:game=${getId.value}`, {text: e.target.value, date: +(new Date())})
  }, 500)
}

function createCustomGame() {
  selectedGame.isCreateCustomGame = true
}

function getRandomNumToDice() {
  diceNum.value = getRandomInt(1, 6)
}

const audioPlayer = ref()

function toggleSoundHandler() {
  selectedGameData.playedAudio = !selectedGameData.playedAudio
  selectedGameData.showPlayVoiceButton = false
  setTimeout(() => {
    audioPlayer.value.play()
  }, 200)
}

</script>

<template>
  <main v-if="!selectedGame.isGameExist">
    <div class="awaitRoom">
      <AppBackground img-name="await.jpg" />
      <div class="awaitRoom__container">
        <div class="awaitRoom__body">
          <div class="info-awaitRoom">
            <div class="info-awaitRoom__title titleH2">{{ selectedGame.gameLoadText }}</div>
          </div>
        </div>
      </div>
    </div>
  </main>
  <main v-else-if="selectedGame.isStarted" class="game">
    <Teleport to="#app">
      <div @click="openNavigation(navBlock)" class="navigation">
        <div class="navigation__block linear-border white" ref="navBlock">
          <ul class="navigation__list">
            <li class="navigation__item"
                v-for="(item,index) in getActiveNavigationItems"
                :key="item.name"
                @click="showInfoHandler">
              <div @click="goToBlock(`${item.goToId}`)" class="navigation__text">{{ index + 1 }}</div>
              <div class="navigation__window">{{ item.name }}</div>
            </li>
          </ul>
        </div>
      </div>
      <TheHostPanel v-if="hostFunctional.haveAccess" :player-items="itemsName.concat(specItems)" />
      <div class="watchersIcon"
           :class="selectedGame.watchersCount>0?'_active':''">
        <img src="/img/icons/watcher.svg" alt="">
      </div>
      <div class="timerBlock"
           :class="hostFunctional.haveAccess?myProfile.isAdmin?'_hostAndAdmin':'_host':myProfile.isAdmin?'_admin':''"
      >
        <div class="timerBlock__body btn gold border">
          <span class="text">{{
              selectedGameData.isPauseTimer? selectedGameData.timerSeconds:selectedGameData.getPlayerEndSeconds
                             }} СЕК.</span>
        </div>
      </div>
      <div class="timerBlock _catastrophe" v-if="selectedGameData.getCatastropheEndSeconds>0">
        <div class="timerBlock__body btn gold border">
          <span class="text">
            {{
              Math.floor(selectedGameData.getCatastropheEndSeconds / 60 / 60)>0? Math.floor(
                  selectedGameData.getCatastropheEndSeconds / 60 / 60) + 'Ч.':''
            }}
            {{
              Math.floor(selectedGameData.getCatastropheEndSeconds / 60 % 60)>0? Math.floor(
                  selectedGameData.getCatastropheEndSeconds / 60 % 60) + 'М.':''
            }}
            {{ Math.floor(selectedGameData.getCatastropheEndSeconds % 60) + 'С.' }}
          </span>
        </div>
      </div>
      <TheAdminPanel v-if="myProfile.isAdmin" />
    </Teleport>
    <div id="welcome" class="welcome">
      <AppBackground :catastropheImg="selectedGameData.bunkerData.imageName" />
      <div class="welcome__container">
        <div class="welcome__body">
          <h1 v-slide class="welcome__titleH2 titleH2">
            Катаклизм
          </h1>
          <div slideBody class="welcome__block">
            <p class="welcome__subtitle">
              {{ selectedGameData.bunkerData.catastrophe }}
            </p>
            <p v-if="selectedGameData.bunkerData.population" class="welcome__population">
              Остаток населения - {{ selectedGameData.bunkerData.population }} человек
            </p>
            <button @click.prevent="toggleSoundHandler"
                    v-if="selectedGameData.bunkerData.soundName && selectedGameData.showPlayVoiceButton"
                    class="welcome__playVoice" type="button">
              {{ selectedGameData.playedAudio? 'Остановить':'Озвучить текст' }}
              <span>
                <img :src="'/img/icons/' + (selectedGameData.playedAudio?'stop.png':'play.png')" alt="">
              </span>
            </button>
            <audio v-if="!selectedGameData.showPlayVoiceButton" ref="audioPlayer" controls>
              <source :src="'/catastropheSounds/'+selectedGameData.bunkerData.soundName" type="audio/mp3" />
            </audio>
          </div>
        </div>
      </div>
    </div>
    <div id="bunker" class="bunker">
      <div class="bunker__container">
        <div class="bunker__block linear-border white">
          <h2 v-slide class="bunker__title titleH2">Бункер</h2>
          <div slidebody>
            <div class="bunker__body">
              <div class="bunker__column text">
                <p class="bunker__description">{{ selectedGameData.bunkerData.bunkerCreated }}.
                                               {{ selectedGameData.bunkerData.bunkerLocation }}.
                                               {{ selectedGameData.bunkerData.bunkerBedroom }}</p>
                <div class="bunker__items items-bunker">
                  <div class="items-bunker__title">В бункере присутствует:</div>
                  <ul class="items-bunker__list">
                    <li class="items-bunker__item"
                        v-for="bunkerItem in selectedGameData.bunkerData.bunkerItems"
                        :key="bunkerItem"
                    >{{ bunkerItem }}
                    </li>
                  </ul>
                </div>
                <p class="bunker__capacity">
                  Количество мест:
                  <span>{{ selectedGameData.bunkerData.maxSurvivor }}</span>
                </p>
              </div>
              <div class="bunker__column tabs">
                <div class="bunker__block-tabs block-tabs linear-border white">
                  <div class="block-tabs__body">
                    <div class="block-tabs__img">
                      <svg width="39.287109" height="39.304688" viewBox="0 0 39.2871 39.3047" fill="none"
                           xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
                        <defs>
                          <linearGradient id="paint_linear_135_191_0" x1="0.000000" y1="19.215611" x2="39.287109"
                                          y2="19.215611" gradientUnits="userSpaceOnUse">
                            <stop stop-color="#F9D35B" />
                            <stop offset="1.000000" stop-color="#D96613" />
                          </linearGradient>
                          <linearGradient id="paint_linear_135_192_0" x1="4.877930" y1="8.204100" x2="11.645508"
                                          y2="8.204100" gradientUnits="userSpaceOnUse">
                            <stop stop-color="#F9D35B" />
                            <stop offset="1.000000" stop-color="#D96613" />
                          </linearGradient>
                          <linearGradient id="paint_linear_135_193_0" x1="27.641602" y1="8.212200" x2="34.409180"
                                          y2="8.212200" gradientUnits="userSpaceOnUse">
                            <stop stop-color="#F9D35B" />
                            <stop offset="1.000000" stop-color="#D96613" />
                          </linearGradient>
                          <linearGradient id="paint_linear_135_194_0" x1="4.911865" y1="30.956478" x2="11.645555"
                                          y2="30.956478" gradientUnits="userSpaceOnUse">
                            <stop stop-color="#F9D35B" />
                            <stop offset="1.000000" stop-color="#D96613" />
                          </linearGradient>
                          <linearGradient id="paint_linear_135_195_0" x1="27.641602" y1="30.956478" x2="34.383781"
                                          y2="30.956478" gradientUnits="userSpaceOnUse">
                            <stop stop-color="#F9D35B" />
                            <stop offset="1.000000" stop-color="#D96613" />
                          </linearGradient>
                        </defs>
                        <path id="Vector"
                              d="M2.64551 0.0703125C2.10059 0.202148 1.30078 0.667969 0.914062 1.08984C0.720703 1.30078 0.430664 1.74023 0.28125 2.06543L0 2.6543L0 19.6699L0 36.6768L0.325195 37.3447C0.720703 38.1445 1.23047 38.6367 2.04785 39.0234L2.63672 39.3047L19.6523 39.3047L36.6592 39.3047L37.3271 38.9795C38.127 38.584 38.6191 38.0742 39.0059 37.2568L39.2871 36.668L39.2871 19.6611L39.2871 2.6543L39.0059 2.06543C38.6191 1.24805 38.127 0.738281 37.3271 0.342773L36.6592 0.0175781L19.8281 0C9.86133 0 2.84766 0.0263672 2.64551 0.0703125ZM36.4658 1.48535C36.9492 1.62598 37.6787 2.35547 37.8193 2.83887C37.9775 3.36621 37.9775 35.9561 37.8193 36.4834C37.6787 36.9668 36.9492 37.6963 36.4658 37.8369C35.9385 37.9951 3.34863 37.9951 2.82129 37.8369C2.33789 37.6963 1.6084 36.9668 1.46777 36.4834C1.30957 35.9561 1.30957 3.36621 1.46777 2.83887C1.59961 2.39062 2.33789 1.63477 2.76855 1.49414C3.23438 1.34473 35.9648 1.34473 36.4658 1.48535Z"
                              fill="url(#paint_linear_135_191_0)" fill-opacity="1.000000" fill-rule="nonzero" />
                        <path id="Vector"
                              d="M5.09766 5.11523C4.94824 5.25586 4.87793 5.42285 4.87793 5.61621C4.88672 6.32812 5.13281 9.79102 5.18555 9.93164C5.27344 10.1514 5.71289 10.3623 5.96777 10.292C6.40723 10.1865 6.50391 9.95801 6.47754 9.0791C6.46875 8.63965 6.43359 8.07715 6.40723 7.83984L6.35449 7.40039L8.49902 9.52734C10.4854 11.5049 10.6699 11.6631 10.9512 11.6631C11.3555 11.6631 11.6455 11.3643 11.6455 10.96C11.6455 10.6875 11.4521 10.4678 9.51855 8.5166L7.38281 6.37207L7.82227 6.4248C8.06836 6.45117 8.62207 6.48633 9.06152 6.49512C9.94043 6.52148 10.1689 6.4248 10.2744 5.98535C10.3447 5.73047 10.1338 5.29102 9.91406 5.20312C9.77344 5.15039 6.31055 4.9043 5.59863 4.89551C5.40527 4.89551 5.23828 4.96582 5.09766 5.11523Z"
                              fill="url(#paint_linear_135_192_0)" fill-opacity="1.000000" fill-rule="nonzero" />
                        <path id="Vector"
                              d="M31.2891 5.02734C30.375 5.08887 29.5312 5.15918 29.417 5.19434C29.1621 5.28223 28.9424 5.71289 29.0127 5.98535C29.1182 6.4248 29.3467 6.52148 30.2256 6.49512C30.665 6.48633 31.2275 6.45117 31.4648 6.4248L31.9043 6.37207L29.7773 8.5166C27.7998 10.5029 27.6416 10.6875 27.6416 10.9688C27.6416 11.373 27.9404 11.6631 28.3447 11.6631C28.6172 11.6631 28.8369 11.4697 30.7881 9.52734L32.9326 7.40039L32.8799 7.83984C32.8535 8.07715 32.8184 8.63965 32.8096 9.0791C32.7832 9.95801 32.8799 10.1865 33.3193 10.292C33.5742 10.3623 34.0137 10.1514 34.1016 9.93164C34.1543 9.79102 34.4004 6.32812 34.4092 5.61621C34.4092 5.42285 34.3389 5.25586 34.1895 5.11523C33.9434 4.86035 33.9082 4.86035 31.2891 5.02734Z"
                              fill="url(#paint_linear_135_193_0)" fill-opacity="1.000000" fill-rule="nonzero" />
                        <path id="Vector"
                              d="M8.49902 29.7861L6.35449 31.9219L6.40723 31.4824C6.43359 31.2363 6.46875 30.6826 6.47754 30.2432C6.50391 29.3643 6.40723 29.1357 5.96777 29.0303C5.71289 28.96 5.27344 29.1709 5.18555 29.3906C5.09766 29.6191 4.86035 33.7148 4.92188 33.9609C4.94824 34.0664 5.0625 34.2246 5.18555 34.3037C5.37891 34.4355 5.58105 34.4355 7.57617 34.3125C8.78027 34.2334 9.82617 34.1455 9.91406 34.1191C10.1338 34.0312 10.3447 33.5918 10.2744 33.3369C10.1689 32.8975 9.94043 32.8008 9.06152 32.8271C8.62207 32.8359 8.06836 32.8711 7.82227 32.8975L7.38281 32.9502L9.51855 30.8057C11.4873 28.8193 11.6455 28.6348 11.6455 28.3535C11.6455 27.9492 11.3467 27.6592 10.9424 27.6592C10.6699 27.6592 10.4502 27.8525 8.49902 29.7861Z"
                              fill="url(#paint_linear_135_194_0)" fill-opacity="1.000000" fill-rule="nonzero" />
                        <path id="Vector"
                              d="M27.835 27.8613C27.7119 27.9932 27.6416 28.1777 27.6416 28.3623C27.6416 28.6348 27.835 28.8545 29.7773 30.8057L31.9043 32.9502L31.4648 32.8975C31.2275 32.8711 30.665 32.8359 30.2256 32.8271C29.3467 32.8008 29.1182 32.8975 29.0127 33.3369C28.9424 33.5918 29.1533 34.0312 29.373 34.1191C29.4609 34.1455 30.5068 34.2334 31.7109 34.3125C33.7061 34.4355 33.9082 34.4355 34.1016 34.3037C34.2246 34.2246 34.3389 34.0664 34.374 33.9521C34.4355 33.7061 34.1895 29.6279 34.1016 29.3906C34.0137 29.1709 33.5742 28.96 33.3193 29.0303C32.8799 29.1357 32.7832 29.3643 32.8096 30.2432C32.8184 30.6826 32.8535 31.2363 32.8799 31.4824L32.9326 31.9219L30.7881 29.7861C28.8018 27.8174 28.6172 27.6592 28.3359 27.6592C28.125 27.6592 27.9668 27.7207 27.835 27.8613Z"
                              fill="url(#paint_linear_135_195_0)" fill-opacity="1.000000" fill-rule="nonzero" />
                      </svg>
                    </div>
                    <div class="block-tabs__row">
                      <h4 class="block-tabs__title">Размер бункера</h4>
                      <p class="block-tabs__description">{{ selectedGameData.bunkerData.bunkerSize }}</p>
                    </div>
                  </div>
                </div>
                <div class="bunker__block-tabs block-tabs linear-border white">
                  <div class="block-tabs__body">
                    <div class="block-tabs__img">
                      <svg width="40.341797" height="43.593750" viewBox="0 0 40.3418 43.5938" fill="none"
                           xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
                        <defs>
                          <linearGradient id="paint_linear_135_198_0" x1="0.000000" y1="21.312485" x2="40.341797"
                                          y2="21.312485" gradientUnits="userSpaceOnUse">
                            <stop stop-color="#F9D35B" />
                            <stop offset="1.000000" stop-color="#D96613" />
                          </linearGradient>
                          <linearGradient id="paint_linear_135_199_0" x1="13.227539" y1="25.906826" x2="21.217403"
                                          y2="25.906826" gradientUnits="userSpaceOnUse">
                            <stop stop-color="#F9D35B" />
                            <stop offset="1.000000" stop-color="#D96613" />
                          </linearGradient>
                          <linearGradient id="paint_linear_135_200_0" x1="23.417480" y1="25.900385" x2="27.114222"
                                          y2="25.900385" gradientUnits="userSpaceOnUse">
                            <stop stop-color="#F9D35B" />
                            <stop offset="1.000000" stop-color="#D96613" />
                          </linearGradient>
                        </defs>
                        <path id="Vector"
                              d="M5.27344 0.166992C5.08008 0.254883 4.81641 0.439453 4.68457 0.580078C4.2627 1.02832 4.1748 1.38867 4.1748 2.59277L4.1748 3.69141L3.18164 3.69141C2.24121 3.69141 2.14453 3.70898 1.64355 3.95508C1.00195 4.28027 0.641602 4.67578 0.272461 5.44922L0 6.02051L0 23.6426L0 41.2646L0.272461 41.8359C0.615234 42.5654 1.23926 43.1807 1.86328 43.418C2.3291 43.5938 2.50488 43.5938 20.1709 43.5938C37.9863 43.5938 38.0039 43.5938 38.4961 43.4092C39.1201 43.1807 39.7178 42.583 40.0693 41.8359L40.3418 41.2646L40.3418 23.6426L40.3418 6.02051L40.0957 5.50195C39.7354 4.72852 39.3223 4.27148 38.6982 3.96387C38.1709 3.7002 38.1357 3.69141 36.8965 3.69141L35.6396 3.69141L35.6396 2.54883C35.6396 1.59082 35.6133 1.34473 35.4727 1.07227C34.8223 -0.202148 33.1523 -0.360352 32.3525 0.773438C32.0537 1.19531 31.957 1.66992 31.957 2.83008L31.9482 3.69141L29.1797 3.69141L26.4111 3.69141L26.4111 2.71582C26.4111 1.43262 26.3057 1.02832 25.8311 0.5625C25.084 -0.18457 23.9414 -0.175781 23.2295 0.580078C22.8076 1.02832 22.7197 1.38867 22.7197 2.59277L22.7197 3.69141L19.916 3.69141L17.1035 3.69141L17.0771 2.43457C17.0508 1.23047 17.042 1.17773 16.7959 0.817383C16.4971 0.369141 15.8203 0 15.3018 0C14.748 0 14.0713 0.360352 13.7812 0.799805C13.5439 1.15137 13.5352 1.23926 13.4912 2.4082L13.4473 3.64746L10.6611 3.67383L7.86621 3.69141L7.86621 2.72461C7.86621 1.43262 7.76074 1.02832 7.28613 0.5625C6.72363 0 5.95898 -0.149414 5.27344 0.166992ZM6.30176 1.55566C6.45117 1.6875 6.45996 1.88965 6.45996 4.35059C6.45996 7.08398 6.44238 7.19824 6.09961 7.32129C6.02051 7.34766 5.87109 7.3125 5.76562 7.24219C5.58105 7.11035 5.58105 7.05762 5.58105 4.39453C5.58105 2.04785 5.59863 1.66113 5.72168 1.54688C5.89746 1.3623 6.09961 1.37109 6.30176 1.55566ZM15.5215 1.49414C15.6797 1.58203 15.6885 1.70508 15.6885 4.35059C15.6885 7.05762 15.6885 7.11035 15.5039 7.24219C15.3809 7.32129 15.249 7.34766 15.126 7.30371C14.9414 7.2334 14.9414 7.19824 14.915 4.43848C14.8975 2.45215 14.9238 1.6084 14.9941 1.5293C15.1172 1.37988 15.2842 1.37109 15.5215 1.49414ZM24.8467 1.55566C24.9961 1.6875 25.0049 1.88965 25.0049 4.35059C25.0049 7.08398 24.9873 7.19824 24.6445 7.32129C24.5654 7.34766 24.416 7.3125 24.3105 7.24219C24.126 7.11035 24.126 7.05762 24.126 4.39453C24.126 2.04785 24.1436 1.66113 24.2666 1.54688C24.4424 1.3623 24.6445 1.37109 24.8467 1.55566ZM34.0664 1.49414C34.2246 1.58203 34.2334 1.70508 34.2334 4.35059C34.2334 7.05762 34.2334 7.11035 34.0488 7.24219C33.9258 7.32129 33.7939 7.34766 33.6709 7.30371C33.4863 7.2334 33.4863 7.19824 33.46 4.43848C33.4424 2.45215 33.4688 1.6084 33.5391 1.5293C33.6621 1.37988 33.8291 1.37109 34.0664 1.49414ZM4.1748 6.17871C4.1748 7.18945 4.19238 7.29492 4.4209 7.74316C5.0625 9.00879 6.81152 9.0791 7.55859 7.86621C7.81348 7.46191 7.82227 7.3916 7.84863 6.2666L7.88379 5.09766L10.6875 5.09766L13.4912 5.09766L13.4912 6.24902C13.4912 7.56738 13.5703 7.82227 14.124 8.30566C15.0557 9.09668 16.4883 8.75391 16.9629 7.62891C17.0596 7.3916 17.0947 6.99609 17.0947 6.19629L17.0947 5.09766L19.8984 5.09766L22.7021 5.09766L22.7373 6.25781C22.7725 7.61133 22.8955 7.96289 23.4844 8.38477C24.3809 9.01758 25.6113 8.74512 26.1562 7.7959C26.3408 7.4707 26.3672 7.30371 26.3936 6.25781L26.4287 5.09766L29.1797 5.09766L31.9219 5.09766L31.9658 6.22266C32.0186 7.52344 32.124 7.83984 32.6689 8.30566C33.5918 9.08789 35.0332 8.74512 35.5078 7.62891C35.6045 7.3916 35.6396 6.99609 35.6396 6.19629L35.6396 5.09766L36.8438 5.09766L38.0391 5.09766L38.3994 5.47559C38.9531 6.04688 38.9795 6.23145 38.9795 9.08789L38.9795 11.6016L20.1709 11.6016L1.3623 11.6016L1.3623 9.08789C1.3623 6.23145 1.38867 6.04688 1.94238 5.47559L2.30273 5.09766L3.23438 5.09766L4.1748 5.09766L4.1748 6.17871ZM38.9795 20.5137L38.9795 28.0195L38.4697 28.7139C37.7666 29.6543 36.7559 30.5771 36.0264 30.9375C35.2266 31.3242 34.4355 31.3857 33.6357 31.1221C33.0293 30.9111 32.7217 30.9463 32.5195 31.2275C32.335 31.4912 32.3525 31.7021 32.625 32.5811C32.8359 33.2754 32.8535 33.4951 32.8535 34.7607C32.8535 35.9385 32.8271 36.2812 32.6689 36.8701C32.4316 37.7139 32.1064 38.4082 31.7549 38.8125L31.4912 39.1113L17.2969 39.1113C1.37988 39.1113 2.83008 39.1729 2.15332 38.4434C1.95117 38.2236 1.70508 37.8633 1.59961 37.6348L1.40625 37.2217L1.37988 25.1104L1.3623 13.0078L20.1709 13.0078L38.9795 13.0078L38.9795 20.5137ZM38.8564 31.8076C38.2939 35.0332 36.4658 37.6699 34.0576 38.6807C33.7412 38.8213 33.4775 38.8916 33.46 38.8477C33.4424 38.8037 33.5127 38.6104 33.6094 38.417C34.2158 37.2393 34.4707 34.7607 34.1807 33.0205L34.1191 32.6953L34.7256 32.6953C35.9033 32.6953 37.1865 32.0801 38.3643 30.9639L38.9355 30.4277L38.9619 30.7266C38.9795 30.8848 38.9268 31.377 38.8564 31.8076ZM38.7422 41.3086C38.5928 41.5986 38.373 41.8711 38.1973 41.9941L37.8984 42.1875L20.1709 42.1875L2.44336 42.1875L2.14453 41.9854C1.69629 41.6953 1.3623 40.9658 1.3623 40.2891L1.3623 39.7354L1.86328 40.043C2.13574 40.21 2.50488 40.3857 2.68066 40.4297C2.87402 40.4824 8.36719 40.5176 17.8418 40.5176C33.9785 40.5176 33.1875 40.5352 34.4619 40.0254C35.3584 39.665 36.1846 39.1377 36.9404 38.4521C37.6084 37.8281 38.5312 36.6855 38.7949 36.1318C38.9268 35.8506 38.9355 35.9561 38.9619 38.3291L38.9795 40.8164L38.7422 41.3086Z"
                              fill="url(#paint_linear_135_198_0)" fill-opacity="1.000000" fill-rule="nonzero" />
                        <path id="Vector"
                              d="M16.4004 19.0811C14.8975 19.3711 13.5967 20.6543 13.3154 22.1309C13.1133 23.168 13.3418 23.7305 13.9658 23.7305C14.3789 23.7305 14.6338 23.4229 14.6338 22.9307C14.6338 21.9375 15.1436 21.1113 16.0225 20.6807C16.4443 20.4785 16.6377 20.4346 17.2266 20.4346C18.0967 20.4346 18.6855 20.6719 19.2129 21.2432C19.6875 21.7617 19.8193 22.1045 19.8193 22.8691C19.8193 23.6689 19.5645 24.2578 19.0283 24.7236C18.501 25.1719 18 25.3213 16.8486 25.374C15.9258 25.418 15.8467 25.4443 15.6885 25.6465C15.46 25.9365 15.4688 26.2178 15.7236 26.5166C15.9258 26.7451 15.9697 26.7627 17.0156 26.8066C17.8857 26.8506 18.1758 26.9033 18.4658 27.0527C19.4062 27.5361 19.8193 28.2129 19.8193 29.2588C19.8193 30.0498 19.6436 30.498 19.1602 30.9639C18.6152 31.4912 18.1318 31.6758 17.2705 31.6846C16.6289 31.6846 16.4531 31.6494 16.0225 31.4385C15.1348 30.999 14.6338 30.1816 14.6338 29.1709C14.6338 28.8281 14.5986 28.7227 14.4053 28.5732C13.8428 28.1338 13.2275 28.5117 13.2275 29.3027C13.2275 30.2168 13.6494 31.2451 14.2998 31.9043C16.4355 34.0752 20.2852 33.2139 21.0938 30.375C21.208 29.9971 21.2344 29.6279 21.208 29.0039C21.1816 28.2656 21.1377 28.0811 20.9004 27.5889C20.7334 27.2637 20.417 26.8242 20.1357 26.5518L19.6523 26.0771L20.127 25.6113C20.3994 25.3389 20.7158 24.9082 20.8828 24.5479C21.1729 23.9766 21.1816 23.915 21.1816 22.8955C21.1816 21.8496 21.1729 21.8232 20.8564 21.1729C20.6807 20.8213 20.3818 20.373 20.1973 20.1973C19.2129 19.2393 17.7539 18.8174 16.4004 19.0811Z"
                              fill="url(#paint_linear_135_199_0)" fill-opacity="1.000000" fill-rule="nonzero" />
                        <path id="Vector"
                              d="M24.9609 19.7402C24.2842 20.1621 23.6602 20.5576 23.5811 20.6367C23.3438 20.8389 23.3701 21.3662 23.625 21.6035C23.9326 21.8936 24.249 21.8408 24.9521 21.4014C25.3037 21.1816 25.6201 21.0059 25.6465 21.0059C25.6816 21.0059 25.708 23.6338 25.708 26.8506L25.708 32.7041L25.9277 32.915C26.2793 33.2666 26.7715 33.1787 27.0088 32.7217C27.0879 32.5811 27.1143 30.7969 27.1143 26.0156L27.1143 19.4941L26.8594 19.2393C26.7188 19.0986 26.5078 18.9844 26.3936 18.9844C26.2793 18.9844 25.6377 19.3271 24.9609 19.7402Z"
                              fill="url(#paint_linear_135_200_0)" fill-opacity="1.000000" fill-rule="nonzero" />
                      </svg>
                    </div>
                    <div class="block-tabs__row">
                      <h4 class="block-tabs__title">Время нахождения</h4>
                      <p class="block-tabs__description">{{ selectedGameData.bunkerData.bunkerTime }}</p>
                    </div>
                  </div>
                </div>
                <div class="bunker__block-tabs block-tabs linear-border white">
                  <div class="block-tabs__body">
                    <div class="block-tabs__img">
                      <svg width="37.392334" height="37.402100" viewBox="0 0 37.3923 37.4021" fill="none"
                           xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
                        <defs>
                          <linearGradient id="paint_linear_135_203_0" x1="0.000000" y1="18.285477" x2="37.392128"
                                          y2="18.285477" gradientUnits="userSpaceOnUse">
                            <stop stop-color="#F9D35B" />
                            <stop offset="1.000000" stop-color="#D96613" />
                          </linearGradient>
                          <linearGradient id="paint_linear_135_204_0" x1="18.021484" y1="10.739689" x2="34.839256"
                                          y2="10.739689" gradientUnits="userSpaceOnUse">
                            <stop stop-color="#F9D35B" />
                            <stop offset="1.000000" stop-color="#D96613" />
                          </linearGradient>
                          <linearGradient id="paint_linear_135_205_0" x1="23.418945" y1="10.857527" x2="29.480717"
                                          y2="10.857527" gradientUnits="userSpaceOnUse">
                            <stop stop-color="#F9D35B" />
                            <stop offset="1.000000" stop-color="#D96613" />
                          </linearGradient>
                        </defs>
                        <path id="Vector"
                              d="M19.825 0.0887451C18.5066 0.369995 17.8298 0.765503 16.1599 2.26843C11.8005 6.19714 9.04077 11.3212 8.12671 17.1571C7.97729 18.1503 7.93335 18.8622 7.90698 20.9276C7.87183 23.7841 7.80151 24.2938 7.21265 25.5331C6.91382 26.1483 6.16675 27.2997 6.05249 27.2997C6.02612 27.2997 5.76245 27.1766 5.46362 27.036C4.85718 26.7372 4.05737 26.579 3.53003 26.6493C1.8689 26.8778 0.673584 27.8358 0.172607 29.3212C-0.0559082 29.9891 -0.0559082 31.4745 0.163818 32.1073C0.515381 33.1005 1.33276 33.9091 2.41382 34.3046C2.86206 34.4716 2.89722 34.5067 3.06421 34.955C3.77612 36.8885 5.62183 37.785 7.76636 37.2489C8.63647 37.0292 9.12866 36.7479 9.66479 36.1766C10.7722 34.9989 11.0447 33.2059 10.324 31.8788C10.1833 31.6151 10.0691 31.369 10.0691 31.3339C10.0691 31.2108 11.1765 30.4725 11.8357 30.1561C13.075 29.5673 13.5847 29.4969 16.4412 29.4618C18.5066 29.4354 19.2185 29.3915 20.2117 29.2421C26.074 28.328 31.1892 25.5594 35.1267 21.1649C35.7068 20.5233 36.3132 19.785 36.489 19.5126C38.616 16.1903 36.8845 10.4159 32.3669 5.70496C29.5896 2.82214 26.3113 0.844604 23.2 0.185425C22.2683 -0.0167236 20.5544 -0.0606689 19.825 0.0887451ZM23.2175 1.67957C29.4578 3.14734 35.9177 10.4686 35.9353 16.0936C35.9441 17.6141 35.575 18.5985 34.7136 19.3807C33.8171 20.2069 32.8591 20.4882 31.2947 20.4178C28.1658 20.2684 24.5623 18.3173 21.5125 15.1268C17.241 10.6532 15.6677 5.12488 17.9705 2.66394C19.1042 1.45105 20.8445 1.12585 23.2175 1.67957ZM15.4919 5.88074C15.5447 9.17664 17.4167 12.9735 20.6072 16.2606C23.9998 19.7499 28.0603 21.8329 31.5408 21.8768L32.4285 21.8856L31.989 22.2723C31.3826 22.8173 29.7566 24.0214 28.9216 24.5487C27.3748 25.5243 25.0017 26.5878 23.156 27.1151C20.8181 27.7919 18.99 28.038 16.3972 28.0204C14.1121 28.0116 13.321 28.0907 12.2224 28.451C10.8777 28.8993 9.85815 29.5233 8.82104 30.5253C8.16187 31.1493 8.15308 31.369 8.70679 32.0458C9.19897 32.6434 9.31323 32.9774 9.25171 33.6718C9.14624 35.0956 8.12671 35.9393 6.55347 35.9481C5.99097 35.9481 5.82397 35.9042 5.42847 35.6932C4.88354 35.3944 4.50562 34.8759 4.3562 34.2167C4.14526 33.2675 4.10132 33.2235 3.1521 33.0126C1.8689 32.7225 1.20093 31.6151 1.45581 30.1913C1.57886 29.5409 1.78101 29.1014 2.13257 28.785C2.73022 28.2225 3.72339 27.9677 4.47046 28.1786C4.69019 28.2313 5.0769 28.4598 5.33179 28.6708C5.99976 29.2157 6.21069 29.1981 6.85229 28.5477C7.88062 27.5194 8.698 26.0428 9.11987 24.5048C9.28687 23.9071 9.30444 23.5468 9.32202 21.411C9.3396 19.0643 9.40112 18.2645 9.68237 16.6385C10.2449 13.3602 11.7302 9.87097 13.7517 7.08484C14.1648 6.50476 15.4128 4.97546 15.4568 4.97546C15.4656 4.97546 15.4832 5.37976 15.4919 5.88074Z"
                              fill="url(#paint_linear_135_203_0)" fill-opacity="1.000000" fill-rule="nonzero" />
                        <path id="Vector"
                              d="M20.0972 2.65515C17.7417 3.28796 17.355 6.1532 19.1216 9.85339C21.0815 13.9579 25.4673 17.8427 29.4399 18.9852C31.5581 19.6005 33.2104 19.3983 34.0981 18.4139C34.5728 17.8866 34.7661 17.368 34.8276 16.4452C35.0298 13.3954 32.5776 9.03601 28.939 5.97742C25.8979 3.4198 22.2856 2.06628 20.0972 2.65515ZM21.9077 4.01746C25.0894 4.44812 29.1147 7.3573 31.4438 10.8993C32.8501 13.0262 33.5884 15.2411 33.3599 16.6298C33.2104 17.5175 32.8501 17.8163 31.8481 17.8778C28.5083 18.08 23.3579 14.4237 20.8706 10.0907C19.9565 8.49109 19.5171 7.11121 19.5171 5.81042C19.5171 4.57117 19.7544 4.18445 20.6157 4.01746C21.1606 3.91199 21.1431 3.91199 21.9077 4.01746Z"
                              fill="url(#paint_linear_135_204_0)" fill-opacity="1.000000" fill-rule="nonzero" />
                        <path id="Vector"
                              d="M24.325 8.10437C23.7273 8.4032 23.4285 8.8866 23.4197 9.57214C23.4109 10.2401 23.49 10.5565 23.8416 11.2333C24.8699 13.202 27.2957 14.494 28.6052 13.7557C29.7302 13.1317 29.7742 11.6112 28.7195 10.1083C28.0164 9.11511 27.1023 8.4032 26.0828 8.06042C25.3533 7.81433 24.8875 7.82312 24.325 8.10437ZM26.2234 9.6864C27.155 10.2401 28.0427 11.4706 27.9812 12.1473C27.9548 12.4813 27.946 12.4901 27.5945 12.4813C26.5486 12.4637 25.0544 11.0223 24.8611 9.8446C24.8171 9.59851 24.8435 9.49304 24.9578 9.41394C25.1511 9.26453 25.7136 9.38757 26.2234 9.6864Z"
                              fill="url(#paint_linear_135_205_0)" fill-opacity="1.000000" fill-rule="nonzero" />
                      </svg>
                    </div>
                    <div class="block-tabs__row">
                      <h4 class="block-tabs__title">Количество еды</h4>
                      <p class="block-tabs__description">{{ selectedGameData.bunkerData.bunkerFood }}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <AppDice6 v-model="diceNum" />
    <TheGamerInfo v-if="!selectedGame.imWatcher"
                  :data="selectedGameData.getMyPlayerData"
                  :isReg="myProfile.isReg"
                  :nickname="selectedGameData.getMyUserData.nickname"
    />
    <div id="gamerList" class="listGamer">
      <div class="listGamer__container">
        <h2 v-slide class="listGamer__title titleH2">
          Желающие попасть в бункер:
          <span> {{ selectedGameData.getAlivePlayers.length }}/{{
              selectedGameData.getActivePlayersFromUserData.length
                 }}</span>
        </h2>
        <div slidebody>
          <div class="wrapper-listGamer">
            <div class="listGamer__table table-listGamer">
              <div class="table-listGamer__row _main">
                <div class="table-listGamer__column">
                  {{ firstItem[0] }}
                </div>
                <div
                    v-for="item in itemsName"
                    :key="item[1]"
                    class="table-listGamer__column"
                >
                  {{ item[0] }}
                  <AppSmallInfo v-if="item.length>2" :html="item[2]" :is-down="true" />
                </div>
              </div>
              <div class="table-listGamer__row"
                   v-for="(data,index) in selectedGameData.getActivePlayersFromUserData"
                   :key="index"
                   :class="[data.data.accessLevel,{dead:!data.data.isAlive}]"
              >
                <!--                Блок с профилем-->
                <div class="table-listGamer__column profile-column" :class="data.data.accessLevel">
                  <div class="profile-column__num">{{ index + 1 }}</div>
                  <AppAvatar v-if="data.id>0" class="profile-column__img"
                             @click="router.push(`profile=${data.id}`)"
                             v-model:href="data.data.avatar"
                             :color="data.data.accessLevel"
                             style="cursor: pointer"
                  />
                  <AppAvatar v-else v-model:href="data.data.avatar" class="profile-column__img"
                             :color="data.data.accessLevel" />
                  <div class="profile-column__texts texts-profile-column">
                    <div class="texts-profile-column__nickname"
                         :title="data.data.nickname"
                         @click="data.id>0?router.push(`profile=${data.id}`):null"
                         :style="data.id>0?'cursor: pointer':''"
                    >
                      {{ data.data.nickname }}
                    </div>
                    <div class="texts-profile-column__access">{{ getAccessStr(data.data.accessLevel) }}</div>
                    <div v-if="hostFunctional.haveAccess"
                         :class="{dead:!data.data.isAlive}"
                         class="texts-profile-column__banish"
                         @click.prevent="hostSocket.emit('banishOrReturn',data.id)"
                    >
                      {{ !data.data.isAlive? 'вернуть':'изгнать' }}
                    </div>
                  </div>
                </div>
                <!--Остальные характеристики-->
                <div class="table-listGamer__column"
                     v-for="item in itemsName"
                     :key="item[1]"
                >
                  <p v-html="selectedGameData.getCharForPlayer(data.id, item[1])"></p>
                  <AppSmallInfo v-if="selectedGameData.getDescriptionForChar(data.id,item[1])"
                                :text="selectedGameData.getDescriptionForChar(data.id,item[1])" />
                </div>
              </div>

              <div class="wrapper-listGamer__subText">
                <p>* Чтобы узнать, выжил ли ваш бункер по окончании игры, вы можете пройти тест
                  <a target="_blank" href="/test">"Оценка выживаемости бункера"</a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="(((hostFunctional.haveAccess && hostFunctional.isPlayerToo) || !hostFunctional.haveAccess) &&
    ((!selectedGame.imWatcher && selectedGameData.isVoiting) || (!objIsEmpty(selectedGameData.voitingData) && selectedGameData.voitingData.status===1))) ||
    (selectedGameData.voitingData.status===1 && hostFunctional.haveAccess && !hostFunctional.isPlayerToo)"
         :style="selectedGameData.voitingData.status===0 && hostFunctional.haveAccess && !hostFunctional.isPlayerToo?'margin: 0;':''"
         class="voting">
      <div class="voting__container">
        <div v-if="selectedGameData.isVoiting && selectedGameData.getMyUserData.isAlive" class="voting__now now-voting">
          <h2 id="voting" v-slide class="now-voting__title titleH2">Голосование</h2>
          <div v-if="!selectedGameData.userVoitingChoice" slidebody>
            <form @submit.prevent="selectedGameGameplay.voteHandler(selectedGameData.votedPlayerID)"
                  class="now-voting__body">
              <div class="now-voting__voteList">
                <TheVoteBlock
                    v-for="(gamer,index) in selectedGameData.getAlivePlayers"
                    :key="gamer.id"
                    :index="index"
                    :nickname="gamer.data.nickname"
                    :value="gamer.id"
                    v-model:isActive="selectedGameData.votedPlayerID"
                />
              </div>
              <AppButton v-if="selectedGameData.votedPlayerID && !selectedGameData.voitingData.isLoading"
                         class="now-voting__submit"
                         color="gold">Проголосовать
              </AppButton>
              <AppLoader v-if="selectedGameData.voitingData.isLoading" />
            </form>
          </div>
          <div v-else class="now-voting__choiceUser">
            <p>
              Вы проголосовали за игрока <b>{{ selectedGameData.userVoitingChoice }}</b>.
              Ожидаем окончание голосования...
            </p>
          </div>
        </div>
        <div v-else-if="!objIsEmpty(selectedGameData.voitingData) && selectedGameData.voitingData.status===1"
             class="voting__result results-voting">
          <h2 v-slide class="results-voting__title titleH2">Результат последнего голосования</h2>
          <div slidebody>
            <div class="results-voting__body">
              <div
                  v-for="vote in selectedGameData.getNonVoitingUsersNicknames(selectedGameData.voitingData).votedList"
                  :key="vote.nickname"
                  class="results-voting__line line-results-voting"
              >
                <div class="line-results-voting__name">
                  {{ vote.nickname }} <span>{{ vote.whoVote.length }}</span>
                </div>
                <div class="line-results-voting__progress progress-result">
                  <div class="progress-result__backline"
                       :style="'width:'+getPercentForVote(vote,selectedGameData.getNonVoitingUsersNicknames(selectedGameData.voitingData).allVoteNum)+'%'"
                  >
                    <span></span>
                  </div>
                  <div class="progress-result__nickList">
                    {{ vote.whoVote.join(', ') }}
                  </div>
                </div>
                <div class="progress-result__percentages">
                  {{
                    getPercentForVote(vote,
                        selectedGameData.getNonVoitingUsersNicknames(selectedGameData.voitingData).allVoteNum)
                  }} %
                </div>
              </div>
            </div>
            <div v-if="selectedGameData.getNonVoitingUsersNicknames(selectedGameData.voitingData).abstainedList.length"
                 class="results-voting__listAbstained">
              Игроки, которые не приняли участие в голосовании:
              <span>{{
                  selectedGameData.getNonVoitingUsersNicknames(selectedGameData.voitingData).abstainedList.join(', ')
                    }}</span>
            </div>
            <div v-else class="results-voting__listAbstained">
              Все игроки приняли участие в голосовании
            </div>
          </div>
        </div>
      </div>
    </div>
    <div id="spec" class="listGamer">
      <div class="listGamer__container">
        <h2 v-slide class="listGamer__title titleH2">
          Таблица спец. возможностей
        </h2>
        <div slidebody>
          <div class="wrapper-listGamer">
            <div class="listGamer__table table-listGamer _spec">
              <div class="table-listGamer__row _main">
                <div class="table-listGamer__column">
                  {{ firstItem[0] }}
                </div>
                <div
                    v-for="item in 2"
                    :key="item"
                    class="table-listGamer__column"
                >
                  Специальная возможность {{ item }}
                </div>
              </div>
              <div class="table-listGamer__row"
                   v-for="(data,index ) in selectedGameData.getActivePlayersFromUserData"
                   :key="index"
                   :class="[data.data.accessLevel,{dead:!data.data.isAlive}]"
              >
                <!--Блок с профилем-->
                <div class="table-listGamer__column profile-column" :class="data.data.accessLevel">
                  <div class="profile-column__num">{{ index + 1 }}</div>
                  <AppAvatar v-if="data.id>0" class="profile-column__img"
                             @click="router.push(`profile=${data.id}`)"
                             v-model:href="data.data.avatar"
                             :color="data.data.accessLevel"
                             style="cursor: pointer"
                  />
                  <AppAvatar v-else v-model:href="data.data.avatar" class="profile-column__img"
                             :color="data.data.accessLevel" />
                  <div class="profile-column__texts texts-profile-column">
                    <div class="texts-profile-column__nickname"
                         :title="data.data.nickname"
                         @click="data.id>0?router.push(`profile=${data.id}`):null"
                         :style="data.id>0?'cursor: pointer':''">
                      {{ data.data.nickname }}
                    </div>
                    <div class="texts-profile-column__access">{{ getAccessStr(data.data.accessLevel) }}</div>
                  </div>
                </div>

                <!--Остальные характеристики-->
                <div v-for="item in specItems"
                     :key="item[1]"
                     class="table-listGamer__column"
                >
                  <p v-html="selectedGameData.getCharForPlayer(data.id, item[1])"></p>
                  <AppSmallInfo v-if="selectedGameData.getDescriptionForChar(data.id,item[1])"
                                :text="selectedGameData.getDescriptionForChar(data.id,item[1])" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div v-if="!selectedGame.imWatcher" id="notes" class="notes">
      <div class="notes__container">
        <div class="notes__block linear-border white">
          <h2 v-slide class="notes__title titleH2">Заметки</h2>
          <div slidebody>
            <div class="notes__body">
              <textarea @input="noteInputHandler" ref="noteTextArea" cols="30" rows="10" class="notes__textarea"
                        maxlength="5500"
                        placeholder="Ваши заметки"></textarea>
              <div class="notes__textarea-warning">* После обновления страницы данные будут сохранены!</div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <TheLogs v-if="!selectedGame.imWatcher || hostFunctional.haveAccess" />
    <div v-if="selectedGame.imWatcher" class="spaceDown"></div>
  </main>
  <main v-else>
    <div v-if="!selectedGame.isCreateCustomGame" class="awaitRoom">
      <AppBackground img-name="await.jpg" />
      <div class="awaitRoom__container">
        <div class="awaitRoom__body">
          <div class="info-awaitRoom">
            <div class="info-awaitRoom__title titleH2">Ожидание игроков</div>
            <div class="info-awaitRoom__body">
              <p v-if="hostFunctional.haveAccess" class="info-awaitRoom__inviteText">Пригласите пользователей по ссылке
                                                                                     ниже</p>
              <div v-if="hostFunctional.haveAccess" @click="clickCopyInput" class="info-awaitRoom__link">
                {{ getURL }}
                <span>
              <svg width="14.000000" height="14.000000" viewBox="0 0 14 14" fill="none"
                   xmlns="http://www.w3.org/2000/svg">
	<defs>
		<clipPath id="clip427_9687">
			<rect id="copyblackinterfacesymboloftwopapersheets_79854 1" width="14.000000" height="14.000000" fill="white"
            fill-opacity="0" />
		</clipPath>
	</defs>
	<rect id="copyblackinterfacesymboloftwopapersheets_79854 1" width="14.000000" height="14.000000" fill="#FFFFFF"
        fill-opacity="0" />
	<g clip-path="url(#clip427_9687)">
		<path id="Vector"
          d="M12.7275 12.0909L12.7275 0L3.18164 0L3.18164 1.27271L11.4541 1.27271L11.4541 12.0909L12.7275 12.0909Z"
          fill="#FFFFFF" fill-opacity="1.000000" fill-rule="nonzero" />
		<path id="Vector"
          d="M1.27246 2.04266L1.27246 13.8663C1.27246 13.9401 1.33105 13.9999 1.40332 13.9999L10.6865 13.9999C10.7598 13.9999 10.8184 13.9408 10.8184 13.8663L10.8184 2.04266C10.8184 1.96887 10.7598 1.90906 10.6865 1.90906L1.40332 1.90906C1.33105 1.90906 1.27246 1.96826 1.27246 2.04266ZM2.54492 3.81818L9.54492 3.81818L9.54492 4.45453L2.54492 4.45453L2.54492 3.81818ZM2.54492 5.72723L9.54492 5.72723L9.54492 6.36359L2.54492 6.36359L2.54492 5.72723ZM2.54492 7.63635L9.54492 7.63635L9.54492 8.27271L2.54492 8.27271L2.54492 7.63635ZM2.54492 9.54541L9.54492 9.54541L9.54492 10.1818L2.54492 10.1818L2.54492 9.54541ZM2.54492 11.4545L7 11.4545L7 12.0909L2.54492 12.0909L2.54492 11.4545Z"
          fill="#FFFFFF" fill-opacity="1.000000" fill-rule="nonzero" />
	</g>
</svg>
            </span>
              </div>

              <p v-if="!hostFunctional.haveAccess" class="info-awaitRoom__text">
                Вы успешно зарегистрировались в игру
                {{ selectedGame.userId<0? `, Гость#${Math.abs(selectedGame.userId)}`:myProfile.nickname }}!
              </p>
              <div class="info-awaitRoom__min">
                {{
                  hostFunctional.haveAccess? `Чтобы начать игру нужно как минимум ${selectedGame.minPlayers} человек.`:'Ожидаем других игроков...'
                }}
                ({{ selectedGame.players.length }}/{{ selectedGame.maxPlayers }})
              </div>

              <p v-if="!hostFunctional.haveAccess" class="info-awaitRoom__text">
                Минимальное количество игроков: {{ selectedGame.minPlayers }}<br>
                Максимальное количество игроков: {{ selectedGame.maxPlayers }}
              </p>


              <div v-if="(myProfile.isMVP || myProfile.isAdmin) && hostFunctional.haveAccess && selectedGame.userId>0"
                   class="checkbox info-awaitRoom__hiddenGame">
                <input id="hiddenGame" @change="isHiddenGameHandler" v-model="selectedGame.isHidden"
                       class="checkbox__input" type="checkbox" value="1" name="form[]">
                <label for="hiddenGame" class="checkbox__label">
                  <span class="checkbox__text">Приватная игра</span>
                </label>
              </div>

              <div
                  v-if="hostFunctional.haveAccess && !(!hostFunctional.isPlayerToo && selectedGame.players.length>=selectedGame.maxPlayers)"
                  class="checkbox info-awaitRoom__hiddenGame">
                <input id="hostPlayerToo" class="checkbox__input" type="checkbox" value="1" name="form[]"
                       @change="isHostPlayerTooHandler"
                       v-model="hostFunctional.isPlayerToo"
                >
                <label for="hostPlayerToo" class="checkbox__label">
                  <span class="checkbox__text">Ведущий также и игрок</span>
                </label>
              </div>


              <div v-if="hostFunctional.haveAccess" class="info-awaitRoom__buttons">
                <AppButton @click="closeRoom" class="info-awaitRoom__btn closeBtn" color="red">Закрыть комнату
                </AppButton>
                <button :disabled="!mayStartGame"
                        class="info-awaitRoom__btn startBtn btn"
                        :class="mayStartGame?'green':''"
                        @click="startGame"
                >
                  Начать игру
                </button>
                <button v-if="myProfile.isMVP || myProfile.isAdmin" :disabled="!mayStartGame"
                        class="info-awaitRoom__btn startBtn btn"
                        :class="mayStartGame?'gold':''"
                        @click="createCustomGame"
                >
                  <span class="text">Создать кастомную игру</span>
                </button>
              </div>
              <p v-else class="info-awaitRoom__text small">Только ведущий может начать игру</p>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div v-if="hostFunctional.haveAccess && !selectedGame.isCreateCustomGame" class="people-awaitRoom">
      <div class="people-awaitRoom__container">
        <div class="people-awaitRoom__title titleH2">Кандидаты в бункер</div>
        <div class="people-awaitRoom__body">
          <ul class="people-awaitRoom__list">
            <li class="people-awaitRoom__item linear-border white"
                v-for="(gamer,index) in selectedGame.players"
                :key="gamer.nickname"
            >
              <div class="people-awaitRoom__item-column">
                <div class="people-awaitRoom__title">
                  {{ +gamer.id=== +selectedGame.userId? 'Это вы':`Игрок ${index + 1}` }}
                </div>
                <div class="people-awaitRoom__nickname">{{ gamer.nickname }}</div>
              </div>
              <div v-if="+gamer.id !== +selectedGame.userId" @click="removeGamer(index,gamer.id)"
                   class="people-awaitRoom__removeBtn">
                <svg width="14.631836" height="14.627319" viewBox="0 0 14.6318 14.6273" fill="none"
                     xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
                  <defs />
                  <path id="Vector"
                        d="M0.56543 14.6273C0.492188 14.6277 0.417969 14.6135 0.349609 14.5856C0.28125 14.5576 0.21875 14.5163 0.166016 14.4642C0.113281 14.4119 0.0722656 14.3497 0.0429688 14.2811C0.0146484 14.2126 0 14.139 0 14.0648C0 13.9905 0.0146484 13.917 0.0429688 13.8484C0.0722656 13.7799 0.113281 13.7177 0.166016 13.6654L13.666 0.165405C13.7725 0.0595093 13.916 0 14.0654 0C14.2158 0 14.3594 0.0595093 14.4648 0.165405C14.5713 0.271362 14.6309 0.414978 14.6309 0.564819C14.6309 0.7146 14.5713 0.858276 14.4648 0.964172L0.964844 14.4642C0.912109 14.5163 0.850586 14.5576 0.78125 14.5856C0.712891 14.6135 0.639648 14.6277 0.56543 14.6273Z"
                        fill="#FFFFFF" fill-opacity="1.000000" fill-rule="nonzero" />
                  <path id="Vector"
                        d="M14.0654 14.6273C13.9922 14.6277 13.918 14.6135 13.8496 14.5856C13.7812 14.5576 13.7188 14.5163 13.666 14.4642L0.166016 0.964172C0.0605469 0.858276 0.000976562 0.7146 0.000976562 0.564819C0.000976562 0.414978 0.0605469 0.271362 0.166016 0.165405C0.272461 0.0595093 0.416016 0 0.56543 0C0.71582 0 0.859375 0.0595093 0.964844 0.165405L14.4648 13.6654C14.5176 13.7177 14.5596 13.7799 14.5879 13.8484C14.6172 13.917 14.6318 13.9905 14.6318 14.0648C14.6318 14.139 14.6172 14.2126 14.5879 14.2811C14.5596 14.3497 14.5176 14.4119 14.4648 14.4642C14.4121 14.5163 14.3506 14.5576 14.2812 14.5856C14.2129 14.6135 14.1396 14.6277 14.0654 14.6273Z"
                        fill="#FFFFFF" fill-opacity="1.000000" fill-rule="nonzero" />
                </svg>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
    <div v-if="!selectedGame.isCreateCustomGame" class="watchersIcon"
         :class="selectedGame.watchersCount>0?'_active':''">
      <img src="/img/icons/watcher.svg" alt="">
    </div>
    <div v-show="selectedGame.isCreateCustomGame" class="customGame">
      <div class="customGame__container">
        <div class="customGame__body">
          <AppButton @click="selectedGame.isCreateCustomGame=false" class="customGame_backBtn" border="true"
                     color="gold"
                     icon-name="upButton.png" />
          <div class="customGame__tables tables-customGame">
            <TheGamerInfo is-create="true"
                          v-for="player in selectedGame.players"
                          :key="player.id"
                          :nickname="player.nickname"
                          :id="player.id"
            />
          </div>
          <div class="customGame__bottom">
            <button :disabled="!mayStartGame"
                    class="info-awaitRoom__btn startBtn"
                    :class="mayStartGame?'btn green':''"
                    @click="startGame"
            >
              Начать кастомную игру
            </button>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>

<!--Страница с игрой-->
<style lang="scss">
@import "@/assets/scss/style";

.spaceDown {
  height: 280px;
  width: 100%;

  @media (max-width: $tablet) {
    height: 250px;
  }

  @media (max-width: $mobile) {
    height: 200px;
  }
  @media (max-width: $mobileSmall) {
    height: 100px;
  }
}

.game {
  .titleH2 {
    cursor: pointer;
  }
}

.bunker {
  position: relative;
  z-index: 2;
  margin-bottom: 75px;

  &__container {
  }

  &__block {
    position: relative;
    padding: 45px 78px;
    padding-bottom: 0 !important;

    @media (max-width: $tablet) {
      padding: 40px 40px;
    }
    @media (max-width: $mobile) {
      padding: 33px 20px;
    }

  }

  &__title {
    position: relative;
    z-index: 3;
  }

  &__body {
    position: relative;
    z-index: 3;
    display: grid;
    grid-template-columns: 2fr 1fr;
    padding-bottom: 45px;
    gap: 40px;

    @media (max-width: $tablet) {
      padding-bottom: 40px;
    }
    @media (max-width: 850px) {
      grid-template-columns: auto;
      grid-template-rows: auto auto;
      gap: 30px;
    }

  }

  &__column {
    display: flex;
    flex-direction: column;

    &.text {
      @media (max-width: $mobile) {
        text-align: center;
      }
    }

    &.tabs {
      gap: 30px;

      @media (max-width: $mobile) {
        gap: 20px;
      }
    }
  }

  &__description {
    margin-bottom: 30px;
    max-width: 560px;
    margin-right: 100px;
    font-weight: 700;
    font-size: 13px;

    @media (max-width: 1200px) {
      margin-right: 0;
    }
    @media (max-width: $tablet) {
      margin: 0;
      margin-bottom: 15px;
    }
    @media (max-width: $mobileSmall) {
      font-size: 12px;
    }
  }

  &__capacity {
    font-size: 30px;
    font-weight: 700;

    span {
      margin-left: 5px;
      background: linear-gradient(180deg, #F9D35B, #D96613);
      background-clip: border-box;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    @media (max-width: $pc) {
      font-size: 27px;
    }
    @media (max-width: $tablet) {
      font-size: 26px;
    }
    @media (max-width: $mobile) {
      font-size: 23px;
    }
    @media (max-width: $mobileSmall) {
      font-size: 20px;
    }
  }
}

.items-bunker {
  margin-bottom: 70px;

  @media (max-width: $pc) {
    margin-bottom: 60px;
  }
  @media (max-width: $tablet) {
    margin-bottom: 50px;
  }
  @media (max-width: $mobile) {
    margin-bottom: 40px;
  }
  @media (max-width: $mobileSmall) {
    margin-bottom: 30px;
  }

  &__title {
    font-size: 14px;
    line-height: 1.8;
    margin-bottom: 15px;

  }

  &__list {
  }

  &__item {
    font-weight: 700;
    margin-bottom: 15px;

    &:last-child {
      margin-bottom: 0;
    }
  }
}

.block-tabs {


  &__body {
    position: relative;
    z-index: 3;
    padding: 28px 33px;
    display: flex;
    align-items: center;
    gap: 30px;
  }

  &__img {
  }

  &__row {
    display: flex;
    flex-direction: column;
  }

  &__title {
    font-size: 11px;
    font-weight: 600;
    margin-bottom: 15px;
    white-space: nowrap;
  }

  &__description {
    font-size: 12px;
    font-weight: 700;
    white-space: nowrap;

    @media (max-width: 1200px) {
      white-space: wrap;
      min-width: 300px;
    }
    @media (max-width: $tablet) {
      min-width: 250px;
    }
    @media (max-width: $mobile) {
      min-width: 0;
    }
  }
}

//========================================================================================================================================================
.listGamer {
  background: #131313;
  padding-top: 50px;

  @media (max-width: $pc) {
    padding-top: 43px;
  }
  @media (max-width: $tablet) {
    padding-top: 35px;
  }
  @media (max-width: $mobile) {
    padding-top: 25px;
  }
  @media (max-width: $mobileSmall) {
    padding-top: 25px;
  }

  &__container {
  }

  &__title {
    @media (max-width: $mobileSmall) {
      margin-right: 15px;
      margin-left: 15px;
      font-size: 20px !important;
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }
  }
}

.wrapper-listGamer {
  overflow-x: auto;

  &__subText {
    margin-top: 20px;
    color: #F9D35BFF;
    background: linear-gradient(90deg, #F9D35B, #D96613);
    background-clip: border-box;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    line-height: 1.2;
    position: relative;

    a {
      line-height: 1.2;
      position: relative;
      color: #F9D35BFF;
      background: linear-gradient(90deg, #F9D35B, #D96613);
      background-clip: border-box;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;

      &::after {
        content: '';
        position: absolute;
        left: 0;
        top: calc(100%);
        width: 100%;
        height: 1px;
        background: #F9D35BFF;
        opacity: 0.4;
      }

      @media (any-hover: hover) {
        &:hover {
          &::after {
            background: none;
          }
        }
      }
    }
  }
}

.table-listGamer {
  min-width: 1300px;
  padding-bottom: 130px;

  @media (max-width: $pc) {
    padding-bottom: 110px;
  }
  @media (max-width: $tablet) {
    padding-bottom: 90px;
  }
  @media (max-width: $mobile) {
    padding-bottom: 70px;
  }
  @media (max-width: $mobileSmall) {
    padding-bottom: 50px;
  }

  &__row {
    border-bottom: 1px solid #323232;
    display: grid;
    grid-template-columns: 13fr 10.1fr 8.5fr 9.24fr 8.29fr 8fr 8.21fr 9.8fr 7.6fr 7.9fr 9.4fr;
    //display: flex;

    &._main {
      .table-listGamer__column {
        padding-top: 13px;

        .smallInfo {
          position: absolute;
          right: 4px;
          top: 4px;
        }
      }
    }

    &.admin {
      background: linear-gradient(90deg, #4A2E2E, rgba(0, 0, 0, 0), #4A2E2E);

      .profile-column__img {
        border: 3px solid $redColor;
        box-shadow: 0 4px 20px 0 rgba(255, 0, 0, 0.65);
        position: relative;
        margin-right: 11px;

        img {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
          height: 100%;
          z-index: 3;
          object-fit: cover;
          object-position: center;
        }
      }

      .texts-profile-column__nickname {
        color: $redColor;
      }

      .texts-profile-column__access {
        color: $redColor;
        text-transform: capitalize;
      }
    }

    &.mvp {
      background: linear-gradient(90deg, #373323, rgba(0, 0, 0, 0), #373323);

      .profile-column__img {
        border: none;
        position: relative;
        //width: 29px;
        //height: 29px;
        margin-right: 16px;

        img {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
          height: 100%;
          z-index: 3;
          object-fit: cover;
          object-position: center;
        }

        &::before {
          content: '';
          border-radius: 50%;
          overflow: hidden;
          position: absolute;
          left: -3px;
          top: -3px;
          width: calc(100% + 6px);
          height: calc(100% + 6px);
          background: $goldColor;
          z-index: 1;
          box-shadow: 0 5px 30px 0 rgba(217, 102, 19, 0.7);
        }

      }

      .texts-profile-column__nickname {
        background: linear-gradient(90deg, #F9D35B, #D96613);
        background-clip: border-box;
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
      }

      .texts-profile-column__access {
        background: linear-gradient(90deg, #F9D35B, #D96613);
        background-clip: border-box;
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        opacity: 0.8;
        text-transform: uppercase;
      }
    }

    &.vip {
      background: linear-gradient(90deg, #2a2a2a, rgba(0, 0, 0, 0), #2a2a2a);

      .profile-column__img {
        border: none;
        position: relative;
        //min-width: 29px;
        //width: 29px;
        //height: 29px;
        margin-right: 16px;

        img {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
          height: 100%;
          z-index: 3;
          object-fit: cover;
          object-position: center;
        }

        &::before {
          content: '';
          border-radius: 50%;
          overflow: hidden;
          position: absolute;
          left: -3px;
          top: -3px;
          width: calc(100% + 6px);
          height: calc(100% + 6px);
          background: linear-gradient(135deg, #696969, rgba(0, 0, 0, 0), #C9C9C9);
          z-index: 1;
          box-shadow: 0px 4px 10px 0px rgba(255, 26, 26, 0.21);
        }
      }

      .texts-profile-column__nickname {
        background: linear-gradient(135deg, #BFBFBF, #6F6F6F, #C9C9C9);
        background-clip: border-box;
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
      }

      .texts-profile-column__access {
        background: linear-gradient(135deg, #BFBFBF, #6F6F6F, #C9C9C9);
        background-clip: border-box;
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        text-transform: uppercase;
      }
    }

    &.default {
      .texts-profile-column__nickname {
        color: white;
      }

      .profile-column__img {
        background: #3B3B3B;
      }
    }

    &.dead {
      position: relative;
      background: black;

      &::after {
        content: '';
        background: black;
        opacity: 0.8;
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
      }

      .table-listGamer__column {
        border-right: 1px solid white;

        &:first-child {
          border-right: 1px solid #323232;
        }
      }

      .texts-profile-column__banish {
        color: white;
      }

      .profile-column {
        &::after {
          content: '';
          background: black;
          opacity: 0.5;
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
        }
      }
    }
  }

  &__column {
    border-right: 1px solid #323232;
    padding: 25px 3px 20px 15px;
    font-size: 11px;
    font-weight: 600;
    position: relative;

    &:first-child {
      border-left: 1px solid #323232;
    }

    &.profile-column {
      padding-right: 5px;
    }

    .smallInfo {
      position: absolute;
      right: 4px;
      top: 4px;
      z-index: 3;
    }
  }

  &._spec {
    .table-listGamer__row {
      grid-template-columns: 15fr 50fr 50fr;

    }
  }
}

.profile-column {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-right: 30px;
  z-index: 3;

  &__num {
    margin-right: 15px;
  }

  &__img {
    border-radius: 50%;
    display: flex;
    justify-content: center;
    align-items: center;
    min-width: 34px;
    max-width: 34px;
    min-height: 34px;
    max-height: 34px;
    width: 34px;
    height: 34px;
    border: 2px solid #3B3B3B;
    margin-right: 10px;

    img {
      border-radius: 50%;
      overflow: hidden;


      &._noPhoto {
        width: 11px;
        height: 12px;
      }
    }
  }

  &__texts {
  }
}

.texts-profile-column {
  color: #afaca6;
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1 1 auto;

  &__nickname {
    font-size: 10px;
    font-weight: 600;
    width: 100%;
    word-wrap: anywhere;

    //white-space: nowrap;
    //overflow: hidden;
    //text-overflow: ellipsis;
  }

  &__access {
    font-size: 9px;
    font-weight: 600;
  }

  &__banish {
    font-size: 9px;
    font-weight: 600;
    background: transparent;
    cursor: pointer;

    &:hover {
      color: $redColor;
    }

    &.dead {
      &:hover {
        color: $greenColor;
        z-index: 3;
      }
    }
  }
}

//========================================================================================================================================================
.voting {
  margin-top: 40px;

  @media (max-width: $mobile) {
    margin-top: 50px;
  }

  &__container {
  }
}

.now-voting {

  &__title {
  }

  &__body {
    padding-bottom: 80px;

    @media (max-width: $tablet) {
      padding-bottom: 50px;
    }
  }

  &__voteList {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    align-items: center;
    gap: 30px;
    margin-bottom: 40px;
  }

  &__submit {
    margin: 0 auto;
    padding: 14px 38px;
  }

  &__choiceUser {
    display: flex;
    justify-content: center;
    align-items: center;

    p {
      margin-bottom: 60px;
      padding: 20px 50px;
      background: $greenColor;
      border-radius: 8px;
      text-align: center;
      font-size: 13px;
      max-width: 1300px;

      @media (max-width: $mobile) {
        padding: 20px;
      }
    }
  }
}

//====

.results-voting {

  &__title {
  }

  &__body {
    margin-bottom: 40px;
  }

  &__line {
    display: flex;
  }

  &__listAbstained {
    color: #b2b2b2;
    font-size: 11px;
    font-weight: 600;
    padding-bottom: 100px;

    @media (max-width: $pc) {
      padding-bottom: 90px;
    }
    @media (max-width: $tablet) {
      padding-bottom: 85px;
    }
    @media (max-width: $mobile) {
      padding-bottom: 80px;
    }
    @media (max-width: $mobileSmall) {
      padding-bottom: 75px;
    }

    span {
      color: white;
      font-size: 10px;
    }
  }
}

.line-results-voting {
  display: grid;
  grid-template-columns: 127px  100fr 70px;
  margin-bottom: 30px;
  gap: 60px 35px;

  @media (max-width: $mobile) {
    gap: 15px;
  }

  &__name {
    font-size: 11px;
    font-weight: 600;

    span {
      background: linear-gradient(180deg, #F9D35B, #D96613);
      background-clip: border-box;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-left: 10px;
    }
  }
}

.progress-result {
  pointer-events: none;
  background: #333333;
  border-radius: 5px;
  position: relative;
  height: 5px;
  width: 100%;

  &__backline {
    position: absolute;
    left: 0;
    top: 0;
    width: 10%;
    height: 100%;
    border-radius: 5px;
    background: $goldColor;
  }

  &__nickList {
    display: flex;
    position: absolute;
    left: 0;
    top: 200%;
    width: 100%;
    height: 100%;
    color: #999999;
    font-size: 9px;
    font-weight: 600;
  }

  &__percentages {
  }
}

//========================================================================================================================================================
.notes {
  margin: 50px 0;

  &__container {
  }

  &__block {
    padding: 64px 50px 90px 50px;
    padding-bottom: 0 !important;

    @media (max-width: $pc) {
      padding: 60px 45px;
    }
    @media (max-width: $tablet) {
      padding: 45px 40px;
    }
    @media (max-width: $mobile) {
      padding: 35px 30px;
    }
    @media (max-width: $mobileSmall) {
      padding: 25px 20px;
    }
  }

  &__title {

  }

  &__body {
    display: grid;
    padding-bottom: 90px;
    @media (max-width: $mobile) {
      padding-bottom: 60px;
    }
  }

  &__textarea {
    background: #121212;
    backdrop-filter: blur(12.5px);
    border-radius: 6px;
    font-weight: 600;
    font-size: 11px;
    color: $fontColor;
    margin-bottom: 15px;
    resize: vertical;
    max-height: 400px;
    min-height: 100px;

    &::placeholder {
      color: #b7b7b7;
    }

    padding: 18px;
  }

  &__textarea-warning {
    background: linear-gradient(90deg, #F9D35B, #D96613);
    background-clip: border-box;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    font-size: 11px;
    font-weight: 600;

    @media (max-width: $mobile) {
      text-align: center;
    }
  }
}

//========================================================================================================================================================
.watchersIcon {
  position: fixed;
  right: 75px;
  bottom: 27px;
  width: 40px;
  z-index: 5;
  opacity: 0;
  transition: opacity 0.5s ease;
  pointer-events: none;

  img {
    max-width: 100%;
  }

  &._active {
    opacity: 1;
  }
}


</style>

<!--Комната ожидания-->
<style lang="scss">
@import "@/assets/scss/style";

.awaitRoom {
  width: 100vw;
  height: 100vh;
  width: 100dvw;
  height: 100dvh;
  position: relative;

  &__container {
    position: relative;
    z-index: 5;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  &__body {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
  }
}

.info-awaitRoom {
  position: relative;

  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    background: #000000;
    opacity: 0.7;
    filter: blur(55.5px);
    z-index: -1;
  }

  &__title {

  }

  &__body {
  }

  &__inviteText {
    margin-bottom: 15px;
    font-weight: 700;
  }

  &__link {
    font-size: 14px;
    line-height: 1.4;
    display: inline-flex;
    justify-content: center;
    align-items: center;
    font-weight: 500;
    padding: 5px;
    cursor: pointer;
    border: 1px solid transparent;
    margin-bottom: 15px;
    border-radius: 6px;

    &:hover {
      border: 1px solid white;
    }

    span {
      display: flex;
      justify-content: center;
      align-items: center;
      margin-left: 10px;
    }

    &._active {
      border: 1px solid $greenColorHover
    }

    &._error {
      border: 1px solid $redColorHover;
    }
  }

  &__min {
    margin-bottom: 30px;
  }

  &__buttons {
    display: flex;
    gap: 30px;

    @media (max-width: 800px) {
      flex-wrap: wrap;
    }

    @media (max-width: 500px) {
      flex-direction: column;
      align-items: center;
    }
  }

  &__btn {
    width: 200px;
    height: 36px;
    padding: 12px;
    border-radius: 6px;

    &.closeBtn {
      font-weight: 700;
    }

    &.startBtn {
      &:disabled {
        font-weight: 700;
        background: transparent;
        border: 1px solid #FFFFFF70;
        color: #ffffff80;
      }
    }
  }

  &__text {
    font-weight: 500;
    line-height: 1.8;
    margin-bottom: 15px;
    font-size: 14px;

    &:last-child {
      margin-bottom: 0;
    }

    &.bold {
      line-height: 1;
      font-weight: 700;
      font-size: 12px;
    }

    &.small {
      font-size: 11px;
      font-weight: 600;
    }
  }

  &__hiddenGame {
    margin-bottom: 15px !important;
  }
}

.people-awaitRoom {
  margin-top: 40px;
  margin-bottom: 200px;


  &__body {

  }

  &__list {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 30px;
  }

  &__item {
    padding: 24px 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex: 0 1 186px;
  }

  &__item-column {
    color: #b4b4b4;
  }

  &__title {
    font-size: 11px;
    font-weight: 600;
    margin-bottom: 10px;
  }


  &__nickname {
    font-weight: 700;
  }

  &__removeBtn {
    cursor: pointer;
  }
}

.customGame {
  margin-top: 100px;
  margin-bottom: 100px;

  &_backBtn {
    position: fixed;
    top: 100px;
    left: calc(50% - 680px);
    width: 40px;
    height: 40px;
    z-index: 10;

    @media (max-width: 1400px) {
      left: 20px;
    }

    img {
      max-width: 100%;
      max-height: 100%;
      transform: rotate(-90deg);
    }
  }

  &__container {
  }

  &__body {
  }

  &__bottom {
    display: flex;
    justify-content: center;
    align-items: center;

    button {
      max-width: 220px;
    }
  }
}

.tables-customGame {
}
</style>

<!--Навигация-->
<style lang="scss">
@import "@/assets/scss/style";

.navigation {
  position: fixed;
  left: 10px;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10;
  font-size: 11px;
  font-weight: 600;
  top: 50%;
  transform: translate(0, -50%);
  padding: 20px 0;

  &__block {
    padding: 22px 15px;
    transition: transform 0.2s ease;

    @media (max-width: $pc) {
      padding: 30px 13px;
    }
    @media (max-width: $tablet) {
      padding: 25px 12px;
    }
    @media (max-width: $mobile) {
      padding: 20px 9px;
      transform: translateX(-100%);
    }
    @media (max-width: $mobileSmall) {
      padding: 20px 5px;
    }

    &._active {
      transform: translateX(0);
    }
  }

  &__list {
    display: flex;
    flex-direction: column;
  }

  &__item {
    position: relative;
    margin-bottom: 5px;

    &:last-child {
      margin-bottom: 0;
    }
  }

  &__text {
    cursor: pointer;
    padding: 10px;

    @media (min-width: $mobile) {
      @media (any-hover: hover) {
        &:hover {
          text-decoration: underline;

          & + .navigation__window {
            opacity: 1;
          }
        }
      }
      @media (hover: none) {
        &:active {
          text-decoration: underline;

          & + .navigation__window {
            opacity: 1;
          }
        }
      }
    }
  }

  &__window {
    position: absolute;
    left: calc(100% + 20px);
    top: 10px;
    font-size: 14px;
    white-space: nowrap;
    opacity: 0;
    transition: opacity 0.4s ease;
    pointer-events: none;

    &._active {
      opacity: 1;
    }
  }
}

</style>

<style lang="scss">
@import "@/assets/scss/style";

.timerBlock {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translate(-50%, 0);
  z-index: 9;

  @media (max-width: $mobile) {
    left: 20px;
    transform: translate(0);
  }

  &._host, &._admin {
    @media (max-width: $mobile) {
      bottom: 70px;
    }
  }

  &._hostAndAdmin {
    @media (max-width: $mobile) {
      bottom: 120px;
    }
  }

  &__body {
    padding: 15px 20px;
    font-size: 18px;

    @media (max-width: $mobile) {
      font-size: 14px;
      padding: 13px 14px;
      width: 83px;
    }
  }

  &._catastrophe {
    left: 15px;
    top: 105px;
    height: 40px;
    transform: none;

    @media (max-width: $tablet) {
      top: 75px;
    }

    .timerBlock__body {
      width: auto;
    }
  }
}
</style>