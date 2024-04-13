<script setup>
import { useAuthStore } from "@/stores/auth.js";
import { useMyProfileStore } from "@/stores/profile.js";
import AppBackground from "@/components/AppBackground.vue";
import AppButton from "@/components/AppButton.vue";
import TheRoom from "@/components/TheRoom.vue";
import TheList from "@/components/TheList.vue";
import router from "@/router/index.js";
import { onBeforeMount, onMounted, onUnmounted, ref } from "vue";
import AppPopup from "@/components/AppPopup.vue";
import TheResetPopup from "@/components/TheResetPopup.vue";
import { useSelectedGame } from "@/stores/game.js";
import { useGlobalPopupStore } from "@/stores/popup.js";
import { usePreloaderStore } from "@/stores/preloader.js";
import axiosInstance from "@/api.js";
import AppLoader from "@/components/AppLoader.vue";

const authStore = useAuthStore()
const myProfile = useMyProfileStore()
const selectedGame = useSelectedGame()
const globalPopup = useGlobalPopupStore()
const globalPreloader = usePreloaderStore()

const activeGames = ref([])
const streamersData = [
  {name: 'nickname228'},
  {name: 'nickname228'},
  {name: 'nickname228'},
]

const inputId = ref('')

const isOpenHowToPlay = ref(false)

function openGallery(e) {
  let imgDiv = e.target.parentNode.parentNode.querySelector('.interface__img')
  const imgRect = imgDiv.getBoundingClientRect()
  const oldStyle = imgDiv.style
}

async function letsGo() {
  globalPreloader.activate()
  const error = await selectedGame.generateGameId()
  if(error) {
    globalPopup.activate('Ошибка создания комнаты',error,'red')
  } else {
    await router.push(`/game=${selectedGame.gameId}`)
  }

  globalPreloader.deactivate()
}

const showPopup = ref(false)
const roomData = ref([])
const loadingActiveGame = ref(true)
const loadingAllGames = ref(true)
const updateInterval = setInterval(async () => {
  console.log('Обновляем игры')
  await updateMyGames()
  await updateAllGames()
},30000)

onBeforeMount(() => {
  let params = router.currentRoute.value.query
  if (params['connected'] && (params['connected']==='resetPassword' || params['connected']==='resetEmail')) {
    showPopup.value = true
  }
})
onMounted(async () => {
  console.log('noregToken',authStore.getLocalData('noregToken'))
  await updateMyGames()
  await updateAllGames()
})
onUnmounted(() => {
  clearInterval(updateInterval)
})

async function updateMyGames() {
  try {
    let data = await axiosInstance.post('/userGames', {
      noregToken: authStore.getLocalData('noregToken')
    })
    loadingActiveGame.value = true
    roomData.value = []
    if(data) {
      roomData.value = roomData.value.concat(data.data)
    }
  } catch(e) {
    console.log(e)
  } finally {
    loadingActiveGame.value = false
  }
}

async function updateAllGames() {
  try {
    let data = await axiosInstance.post('/allGames')
    loadingAllGames.value = true
    activeGames.value = []
    if(data) {
      activeGames.value = activeGames.value.concat(data.data)
    }

  } catch(e) {
    console.log(e)
  } finally {
    loadingAllGames.value = false
  }
}
</script>

<template>
  <main class="main">
    <div class="welcome">
      <AppBackground img-name="mainClear.jpg"></AppBackground>
      <div class="welcome__container">
        <div class="welcome__body">
          <h1 class="welcome__title">
            Bunker Online
          </h1>
          <p class="welcome__subtitle">Докажи всем, что именно ты должен попасть в бункер.</p>

        </div>
      </div>
    </div>
    <div class="room">
      <div class="room__container">
        <h2 class="room__title">Создание игровой комнаты</h2>
        <div class="room__body">
          <div class="room__create create-room">
            <div class="create-room__body">
              <input v-if="false" v-model="inputId" type="text"
                     placeholder="Введите ID игры для присоединения">
              <AppButton @click="letsGo" v-if="false" class="create-room__btn join" color="gold"
                         :disabled="inputId.length<4">
                Присоединиться
              </AppButton>
              <AppButton @click="letsGo" v-else class="create-room__btn create" color="gold">
                Создать игру
              </AppButton>
              <AppButton class="create-room__btn find" color="purple" iconName="discord.svg">Поиск игроков</AppButton>
              <AppButton class="create-room__btn howToPlay" color="gold" :border="true" @click="isOpenHowToPlay=true">
                Как играть?
              </AppButton>
            </div>
          </div>
          <AppLoader v-if="loadingActiveGame"/>
          <div v-else-if="roomData.length"  class="room__list list-room">
            <TheRoom
                v-for="room in roomData"
                :key="room.idRoom"
                :gamers-num="room.countPlayers"
                :isStarted="room.isStarted"
                :datetime="new Date(room.dataCreate)"
                :link="room.idRoom"
            />
          </div>
        </div>
      </div>
    </div>
    <AppLoader v-if="loadingAllGames"/>
    <div v-else-if="activeGames.length" class="activeGame">
      <div class="activeGame__container">
        <h2 class="activeGame__title">Активные игры</h2>
        <div class="activeGame__body">
          <TheList :data="activeGames" title="Активные игры" class="activeGame__game" />
          <!--          <TheList :data="streamersData" title="Стримеры онлайн" class="activeGame__game" />-->
        </div>
      </div>
    </div>
    <div class="interface">
      <h2 class="interface__title titleH2">Интерфейс игры</h2>
      <div class="interface__container">
        <div class="interface__body">
          <div @click="openGallery" class="interface__block">
            <div class="interface__img">
              <img src="/interface/1.jpg" alt="">
            </div>
            <div class="interface__titleImg">Страница ожидания ведущего</div>
          </div>
          <div @click="openGallery" class="interface__block">
            <div class="interface__img">
              <img src="/interface/2.jpg" alt="">
            </div>
            <div class="interface__titleImg">Страница ожидания игрока</div>
          </div>
          <div @click="openGallery" class="interface__block">
            <div class="interface__img">
              <img src="/interface/3.jpg" alt="">
            </div>
            <div class="interface__titleImg">Страница игры ведущего</div>
          </div>
          <div @click="openGallery" class="interface__block">
            <div class="interface__img">
              <img src="/interface/4.jpg" alt="">
            </div>
            <div class="interface__titleImg">Страница игры игрока</div>
          </div>
        </div>
      </div>
    </div>

    <AppPopup v-model="isOpenHowToPlay">
      <template v-slot:title>
        Как играть?
      </template>
      1) Нажать на кнопку "Создать игру!" (после создания комнаты вы автоматически становитесь ведущим игры).<br>
      <br>
      2) На следующей странице вы получите ссылку на игровую комнату. Разошлите эту ссылку людям, с которыми вы хотите
      играть.<br>
      <br>
      3) Ждем, когда все желающие присоединятся. Вы, как ведущий игры, будете видеть кто уже зашел.<br>
      <br>
      4) Как только зайдут все желающие, вы должны начать игру, нажав на кнопку "Начать игру!".<br>
      <br>
      Как найти игроков?<br>
      Все очень просто! Присоединяйтесь к нашему <a target="_blank" href="">Discord</a> каналу, где вы всегда найдете
      людей, с которыми отлично проведете время!<br>
    </AppPopup>
    <teleport to="#app">
      <TheResetPopup v-if="showPopup" />
    </teleport>
  </main>
</template>

<style lang="scss">
@import "@/assets/scss/style";

.main {
  position: relative;
  overflow: hidden;
}

//========================================================================================================================================================
.welcome {
  width: 100vw;
  height: 100vh;
  width: 100dvw;
  height: 100dvh;
  position: relative;
  z-index: 2;

  &__container {
    height: 100%;
  }

  &__body {
    position: relative;
    z-index: 4;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
  }

  &__title {
    text-align: center;
    font-family: Scribble Serif;
    font-size: 90px;
    text-transform: uppercase;
    display: inline;

    @media (max-width: $pc) {
      font-size: 80px;
    }
    @media (max-width: $tablet) {
      font-size: 70px;
    }
    @media (max-width: $mobile) {
      font-size: 50px;
    }
    @media (max-width: $mobileSmall) {
      font-size: 40px;
    }
  }

  &__subtitle {
    font-family: Montserrat;
    font-size: 14px;
    line-height: 1.8;
    font-weight: 400;
    text-align: center;
    max-width: 1047px;
    margin: 0 auto;

    @media (max-width: $tablet) {
      font-size: 13px;
    }
    @media (max-width: $mobile) {
      max-width: 310px;
    }
    @media (max-width: $mobileSmall) {
      max-width: 280px;
      font-size: 12px;
    }
  }
}

//========================================================================================================================================================
.room {
  position: relative;
  z-index: 5;
  width: 100%;
  max-width: 1050px;
  margin: 0 auto;

  &__container {
  }

  &__title {
    font-size: 30px;
    font-weight: 700;
    margin-bottom: 50px;
    display: flex;
    justify-content: center;
    align-items: center;
    text-align: center;

    @media (max-width: $pc) {
      margin-bottom: 45px;
      font-size: 29px;
    }
    @media (max-width: $tablet) {
      margin-bottom: 35px;
      font-size: 27px;
    }
    @media (max-width: $mobile) {
      margin-bottom: 25px;
      font-size: 25px;
    }
  }
}

.create-room {
  margin-bottom: 60px;
  display: flex;
  justify-content: center;
  align-items: center;

  @media (max-width: $pc) {
    margin-bottom: 55px;
  }
  @media (max-width: $tablet) {
    margin-bottom: 45px;
  }
  @media (max-width: $mobile) {
    margin-bottom: 35px;
  }
  @media (max-width: $mobileSmall) {
    margin-bottom: 25px;
  }

  &__body {
    display: flex;
    align-items: center;
    gap: 30px;
    font-size: 11px;

    @media (max-width: 840px) {
      flex-direction: column;
      width: 100%;
      gap: 20px;
    }

    input {
      min-width: 250px;

      @media (max-width: 840px) {
        width: 380px;
        min-width: 0;
        text-align: center;
      }

      @media (max-width: 570px) {
        width: 100%;
      }
    }

  }

  &__btn {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 14px 38px;

    &.create {

    }

    &.find {
      padding: 13px 22px;
    }

    &.howToPlay {

    }

    @media (max-width: 840px) {
      width: 380px;
    }

    @media (max-width: 570px) {
      width: 100%;
    }
  }
}

.list-room {
  margin-bottom: 80px;

  @media (max-width: $mobile) {
    margin-bottom: 75px;
  }
}

//========================================================================================================================================================
.activeGame {
  margin-bottom: 100px;

  &__container {
  }

  &__title {
    font-weight: bold;
    font-size: 30px;
    margin-bottom: 50px;
    display: flex;
    justify-content: center;
    align-items: center;
    text-align: center;

    @media (max-width: $pc) {
      font-size: 29px;
    }
    @media (max-width: $tablet) {
      font-size: 28px;
      margin-bottom: 45px;
    }
    @media (max-width: $mobile) {
      font-size: 26px;
      margin-bottom: 35px;
    }
    @media (max-width: $mobileSmall) {
      font-size: 25px;
      margin-bottom: 25px;
    }
  }

  &__body {
    display: flex;
    justify-content: center;
    align-items: flex-start;
    gap: 30px;

    @media (max-width: $tablet) {
      gap: 25px;
      flex-direction: column;
      align-items: center;
      justify-content: flex-start;
    }
  }

  &__game {
    max-width: 510px;
  }
}

//========================================================================================================================================================
.interface {

  &__title {
  }

  &__container {
  }

  &__body {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr 1fr;
    gap: 30px;
    justify-content: center;
    align-items: center;

    @media (max-width: $tablet) {
      grid-template-columns: 1fr 1fr;
      grid-template-rows: 1fr 1fr;
      gap: 19px;
    }
  }

  &__block {
    display: grid;
    grid-template-rows: 250px 1fr;
    gap: 30px;
    justify-content: center;

    @media (max-width: $tablet) {
      gap: 19px;
      grid-template-rows: auto auto;
    }

    &:hover {
      cursor: pointer;

      .interface__img {
        border-color: white;
        transform: scale(1.05);
      }
    }
  }

  &__img {
    border-radius: 9px;
    overflow: hidden;
    transition: transform 0.3s ease, border-color 0.3s ease;
    border: 1px solid transparent;
    position: relative;
    display: flex;

    @include adaptiveValue("width", 294, 215, 1920, 992);
    @include adaptiveValue("width", 350, 160, 991, 360);

    @include adaptiveValue("height", 250, 136, 991, 360);


    img {
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: center;
    }
  }

  &__titleImg {
    text-align: center;
  }
}

</style>