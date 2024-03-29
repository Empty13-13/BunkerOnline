<script setup="">
import AppButton from "@/components/AppButton.vue";
import AppBackground from "@/components/AppBackground.vue";
import {
  computed,
  nextTick,
  onBeforeMount,
  onBeforeUnmount,
  onBeforeUpdate,
  onMounted,
  onUpdated,
  reactive,
  ref
} from "vue";
import { destroyAll, fieldsInit } from "@/plugins/select.js";
import router from "@/router/index.js";
import AppPopup from "@/components/AppPopup.vue";
import AppAvatar from "@/components/AppAvatar.vue";
import { getClassForAccess, getDisplayNameForAccess, getLinkParams } from "@/plugins/functions.js";
import { useAuthStore } from "@/stores/auth.js"
import { usePreloaderStore } from "@/stores/preloader.js";
import AppLoader from "@/components/AppLoader.vue";
import axiosInstance from "@/api.js";
import { testNicknameKey } from "@/plugins/auth.js";
import { useMyProfileStore } from "@/stores/profile.js";
import { useActionsProfileStore } from "@/stores/profile.js";
import { focusInInput, setErrorForInput } from "@/plugins/inputActions.js";
import AppUpButton from "@/components/AppUpButton.vue";
import AppConfirm from "@/components/AppConfirm.vue";
import { showConfirmBlock } from "@/plugins/confirmBlockPlugin.js";
import { useGlobalPopupStore } from "@/stores/popup.js";

const authStore = useAuthStore()
const myProfile = useMyProfileStore()
const globalPreloader = usePreloaderStore()
const actionsProfile = useActionsProfileStore()
const globalPopup = useGlobalPopupStore()

const getId = computed(() => {
  return +router.currentRoute.value.path.split('=')[1]
})
let oldId = 0

const data = reactive({
  id: getId,
  isBlocked: false,
  name: 'Загружаем...',
  avatar: '',
  access: {title: 'Загружаем...', date: new Date()},
  dateRegistration: new Date(),
  birthday: {date: new Date(), isHidden: false},
  isMale: 0,
  about: '',
  gameNum: 0,
  survivalRate: 0,
  packs: {
    basic: [
      {title: 'Пак 1', id: 311},
      {title: 'Пак 2', id: 312},
      {title: 'Пак 3', id: 313},
      {title: 'Пак 4', id: 314},
    ],
    advanced: [
      {title: 'Пак 1', id: 311},
      {title: 'Пак 2', id: 312},
      {title: 'Пак 3', id: 313},
      {title: 'Пак 4', id: 314},
      {title: 'Пак 5', id: 315},
      {title: 'Пак 6', id: 316},
      {title: 'Пак 7', id: 317},
    ]
  }
})

const isMyProfile = computed(() => {
  return myProfile.id===data.id
})
const getBlockButtonImg = computed(() => {
  if (data.isBlocked) {
    return 'blocked.png'
  }
  else {
    return 'unblocked.png'
  }
})

let birthdayInput = ref()
let isHiddenBirthdayInput = ref()
let isMaleSelect = ref()
let aboutInput = ref()
let saveBtnText = ref('Сохранить')


let isChangingName = ref(false)
let oldNickname = null

function changeBlocked() {
  data.isBlocked = !data.isBlocked
}

async function banUser() {
  globalPreloader.activate()

  try {
    await axiosInstance.post(`/blockUser=${data.id}`, {}, {
      withCredentials: true
    })
  } catch(e) {
    console.log(e.message)
  }
  await updateProfileInfo()

  if(data.isBlocked) {
    globalPopup.activate('Успешно!','Пользователь успешно заблокирован')
  } else {
    globalPopup.activate('Успешно!','Пользователь успешно разблокирован')
  }

  globalPreloader.deactivate()
}

async function changeName() {
  if (!isChangingName.value) {
    isChangingName.value = true
    oldNickname = data.name
  }
  else {
    if (oldNickname===data.name) {
      isChangingName.value = false
      return
    }

    try {
      let response = await actionsProfile.updateNickname(data.id, {nickname: data.name})
      data.isChange = false
      isChangingName.value = false
      console.log("Смогли поменять ник!", response)
    } catch(e) {
      console.log(e.message)
      setErrorForInput('nickname', e.response.data.message)
    }
  }
}

async function keyDownNickname(e) {
  if (myProfile.isAdmin) {
    return
  }
  if (!testNicknameKey(e.key)) {
    e.preventDefault()
  }
}

onBeforeMount(async () => {
  globalPreloader.activate()
  oldId = getId.value
  let params = getLinkParams()
  if (params['account'] && params['account']==="connected") {
    await authStore.refreshToken()
    if (!localStorage.getItem('userId')) {
      myProfile.id = getId.value
      localStorage.setItem('userId', myProfile.id.toString())
    }
    await myProfile.setMyProfileInfo()
  }
  else if (isMyProfile) {
    await myProfile.setMyProfileInfo()
  }
})
onMounted(async () => {
  await updateProfileInfo()
  fieldsInit()

  globalPreloader.deactivate()
})
onBeforeUpdate(async () => {
  if (oldId!==getId.value) {
    destroyAll()
  }
})
onUpdated(async () => {
  if (oldId!==getId.value) {
    globalPreloader.activate()
    oldId = getId.value
    await updateProfileInfo()
    fieldsInit()

    if (isMyProfile) {
      await myProfile.setMyProfileInfo()
    }

    globalPreloader.deactivate()
  }
})
onBeforeUnmount(() => {
  destroyAll()
})

const isPopupOpen = ref(false)
const vipValueInput = ref('')
const mvpValueInput = ref('')
const isSaveLoader = ref(false)

async function saveProfileInfoHandler(e) {
  e.preventDefault()
  isSaveLoader.value = true
  let body = {}
  if (data.birthday.date!==birthdayInput.value) {
    body.birthday = new Date(birthdayInput.value.value)
  }
  if (isHiddenBirthdayInput.value.checked!==data.hiddenBirthday) {
    body.hiddenBirthday = isHiddenBirthdayInput.value.checked
  }
  if (+isMaleSelect.value!==data.sex) {
    body.sex = +isMaleSelect.value.value
  }
  if (aboutInput.value!==data.text) {
    body.text = aboutInput.value.value
  }

  let response = await authStore.updateProfileInfo(getId.value, body)
  if (response && response.status && response.status===200) {
    saveBtnText.value = 'Сохранили!'
  }
  else {
    saveBtnText.value = 'Ошибка!'
  }
  setTimeout(() => {
    saveBtnText.value = 'Сохранить'
  }, 3400)
  isSaveLoader.value = false
}

async function updateProfileInfo() {
  let userInfo = await actionsProfile.getUserInfo(getId.value)
  if (!userInfo) {
    await router.push('/')
    globalPopup.activate('Ошибка!','Данный пользователь не найден')
    return
  }

  data.isBlocked = userInfo.data.isBanned || false
  data.isChange = userInfo.data.isChange || false
  data.access.title = userInfo.data.accsessLevel.toLowerCase() || 'default'
  if (data.isBlocked) {
    data.access.title = 'banned'
  }
  data.access.date = new Date(userInfo.data.accsessDate) || '∞'
  data.name = userInfo.data.nickname
  data.dateRegistration = new Date(userInfo.data.createdAt)
  data.avatar = userInfo.data.avatar
  data.birthday.date = userInfo.data.birthday? new Date(userInfo.data.birthday):null
  if (data.birthday.date && birthdayInput.value) {
    birthdayInput.value.valueAsDate = data.birthday.date
  }
  data.birthday.isHidden = userInfo.data.hiddenBirthday || false
  if (isHiddenBirthdayInput.value) {
    isHiddenBirthdayInput.value.checked = data.birthday.isHidden
  }
  data.isMale = !!+userInfo.data.sex || 0
  if (isMaleSelect.value) {
    isMaleSelect.value.value = data.isMale
  }
  data.about = userInfo.data.text || ''
  if (aboutInput.value) {
    aboutInput.value = data.about
  }
  data.gameNum = userInfo.data.numGame || 0
  data.survivalRate = !!userInfo.data.numGame && userInfo.data.numWinGame? Math.round(
      userInfo.data.numWinGame / userInfo.data.numGame * 100):0
}

const showPasswordChangePopup = ref(false)
const showEmailChangePopup = ref(false)

function changePasswordHandler(e) {
  e.preventDefault()
  showConfirmBlock(e.target, async () => {
    try {
      await axiosInstance.post('/resetPasswordProfile', {}, {
        withCredentials: true
      })
      showPasswordChangePopup.value = true
    } catch(e) {
      console.log(e.message)
    }

  }, 'Вы уверены что хотите сменить пароль?')
}

function changeEmailHandler(e) {
  e.preventDefault()
  showConfirmBlock(e.target, async () => {
    try {
      await axiosInstance.post('/resetEmail', {}, {
        withCredentials: true
      })
      showEmailChangePopup.value = true
    } catch(e) {
      console.log(e.message)
    }
  })
}
</script>

<template>
  <main v-cloak class="profileBlock">
    <AppBackground img-name="profile.jpg"></AppBackground>
    <div class="">
      <div class="profileBlock__container">
        <div class="profileBlock__block linear-border gold">
          <div class="profileBlock__top" :class="isMyProfile?'':'center'">
            <div class="profileBlock__naming naming-profileBlock">
              <AppAvatar class="naming-profileBlock__img"
                         filename="backgrounds/mainClear.jpg"
                         :color="data.access.title"
                         v-model:href="data.avatar"
              />
              <div class="naming-profileBlock__name">
                {{ isMyProfile? "Привет, ":'' }}
                <span v-if="!isChangingName" :class="getClassForAccess(data.access.title)">
                  {{ data.name }}
                </span>
                <div v-else class="naming-profileBlock__input">
                  <small hidden="">Какой то текст с ошибкой</small>
                  <input type="text" name="nickname" class="_type2" maxlength="15" minlength="3"
                         v-model="data.name"
                         @keydown="keyDownNickname"
                         @focus="focusInInput"
                  >
                </div>

                <button v-if="myProfile.isAdmin && !isMyProfile && !isChangingName"
                        class="naming-profileBlock__blockBtn btn"
                        @mouseover="changeBlocked" @mouseout="changeBlocked"
                        @click="banUser"
                >
                  <img :src="'/img/icons/'+getBlockButtonImg" alt="">
                </button>
                <button
                    v-if="(isMyProfile && !myProfile.isDefault) || myProfile.isAdmin || (isMyProfile && data.isChange)"
                    class="naming-profileBlock__blockBtn btn"
                    ref="changeNameBtn"
                    @click="changeName"
                >
                  <img v-if="!isChangingName" src="/img/icons/pencil.png" alt="">
                  <svg v-else xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50" width="50px" height="50px">
                    <path stroke="white"
                          d="M 42.875 8.625 C 42.84375 8.632813 42.8125 8.644531 42.78125 8.65625 C 42.519531 8.722656 42.292969 8.890625 42.15625 9.125 L 21.71875 40.8125 L 7.65625 28.125 C 7.410156 27.8125 7 27.675781 6.613281 27.777344 C 6.226563 27.878906 941406 28.203125 5.882813 28.597656 C 5.824219 28.992188 6.003906 29.382813 6.34375 29.59375 L 21.25 43.09375 C 21.46875 43.285156 21.761719 43.371094 22.050781 43.328125 C 22.339844 43.285156 22.59375 43.121094 22.75 42.875 L 43.84375 10.1875 C 44.074219 9.859375 44.085938 9.425781 43.875 9.085938 C 43.664063 8.746094 43.269531 8.566406 42.875 8.625 Z" />
                  </svg>
                </button>
              </div>
              <div class="naming-profileBlock__access"
                   :class="getClassForAccess(data.access.title)"
              >
                {{ getDisplayNameForAccess(data.access.title) }}
              </div>
            </div>
            <div v-if="isMyProfile" class="profileBlock__packs packs-profileBlock">
              <div class="packs-profileBlock__block linear-border white">
                <div class="packs-profileBlock__column">
                  <div class="packs-profileBlock__title">Базовый пак</div>
                  <ul class="packs-profileBlock__list">
                    <li class="packs-profileBlock__item"
                        v-for="item in data.packs.basic"
                        :key="item.id"
                    >
                      <div class="checkbox">
                        <input :id="'basic'+item.id" class="checkbox__input" name="basic" type="checkbox"
                               :value="item.id">
                        <label :for="'basic'+item.id" class="checkbox__label">
                          <span class="checkbox__text">{{ item.title }}</span>
                        </label>
                      </div>
                    </li>
                  </ul>
                </div>
                <div class="packs-profileBlock__column">
                  <div class="packs-profileBlock__title">Расширенный пак</div>
                  <ul class="packs-profileBlock__list">
                    <li class="packs-profileBlock__item"
                        v-for="item in data.packs.advanced"
                        :key="item.id"
                    >
                      <div class="checkbox">
                        <input :id="'advanced'+item.id" class="checkbox__input" name="advanced" type="checkbox"
                               :value="item.id">
                        <label :for="'advanced'+item.id" class="checkbox__label">
                          <span class="checkbox__text">{{ item.title }}</span>
                        </label>
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          <form @submit="saveProfileInfoHandler" class="middle-profileBlock" :class="isMyProfile?'':'center'">
            <div v-if="!isMyProfile" class="middle-profileBlock__column">
              <span>Дата регистрации {{ data.dateRegistration.toLocaleDateString() }}</span>
            </div>
            <div v-if="!isMyProfile && !data.birthday.isHidden || (!isMyProfile && myProfile.isAdmin)"
                 class="middle-profileBlock__column">
              <span>Дата рождения:
                    {{ data.birthday.date? data.birthday.date.toLocaleDateString():"Не установлено" }}
                    {{
                  data.birthday.date? "(" + ((new Date()).getFullYear() - data.birthday.date.getFullYear()) + ")":""
                    }}
              </span>
            </div>
            <div v-if="!isMyProfile" class="middle-profileBlock__column">
              <span>Пол: {{ data.isMale? "Мужской":"Женский" }}</span>
            </div>
            <div v-if="!isMyProfile" class="middle-profileBlock__column">
              <span>{{ data.about }}</span>
            </div>

            <!--========================================================================================================================================================-->

            <div v-if="isMyProfile" class="middle-profileBlock__column">
              <label for="birthday">Дата рождения</label>
              <input ref="birthdayInput" type="date" name="birthday" id="birthday">
              <div class="middle-profileBlock__hideBrith">
                <div class="checkbox">
                  <input ref="isHiddenBirthdayInput" id="hideBirth" class="checkbox__input" type="checkbox" value="1">
                  <label for="hideBirth" class="checkbox__label"><span
                      class="checkbox__text">Скрыть дату рождения</span></label>
                </div>
              </div>
            </div>
            <div v-if="isMyProfile" class="middle-profileBlock__column">
              <label for="sex">Пол</label>
              <select ref="isMaleSelect" class="profile" name="sex" id="sex">
                <option value="0" :selected="!data.isMale?'selected':''">Женский</option>
                <option value="1" :selected="data.isMale?'selected':''">Мужской</option>
              </select>
            </div>
            <div v-if="isMyProfile" class="middle-profileBlock__column">
              <label for="about">О себе</label>
              <textarea ref="aboutInput" name="about" id="about" placeholder="Текст о себе">{{data.about}}</textarea>
            </div>
            <div v-if="isMyProfile" class="middle-profileBlock__column">
              <AppLoader v-if="isSaveLoader" />
              <AppButton v-else color="gold" border="true">{{ saveBtnText }}</AppButton>
            </div>
          </form>
          <div v-if="isMyProfile" class="change-profileBlock">
            <div class="change-profileBlock__body">
              <AppButton @click="changePasswordHandler" color="gold" border="true" class="change-profileBlock__btn">
                Сменить пароль
              </AppButton>
              <AppButton @click="changeEmailHandler" color="gold" border="true" class="change-profileBlock__btn">Сменить
                                                                                                                 почту
              </AppButton>
            </div>
          </div>
          <div class="profileBlock__bottom" :class="isMyProfile?'':'center'">
            <div class="statistic-bottom">
              <div v-if="isMyProfile" class="statistic-bottom__title">Статистика по играм</div>
              <div class="statistic-bottom__body">
                <div class="statistic-bottom__block linear-border white">
                  <div class="statistic-bottom__blockTitle">Всего игр сыграно</div>
                  <div class="statistic-bottom__blockValue">{{ data.gameNum }}</div>
                </div>
                <div class="statistic-bottom__block linear-border white">
                  <div class="statistic-bottom__blockTitle">Выживаемость</div>
                  <div class="statistic-bottom__blockValue">{{ data.survivalRate }}%</div>
                </div>
              </div>
            </div>
            <div class="subscribe-bottom">
              <div v-if="isMyProfile" class="subscribe-bottom__title">Подписка</div>
              <div class="subscribe-bottom__block linear-border white">
                <div v-if="isMyProfile" class="subscribe-bottom__column">
                  <div class="subscribe-bottom__blockTitle">Ваш текущий статус</div>
                  <div class="subscribe-bottom__body">
                    <div class="subscribe-bottom__access" :class="getClassForAccess(data.access.title)">
                      {{ getDisplayNameForAccess(data.access.title) }}
                    </div>
                    <div v-if="!(myProfile.isAdmin && isMyProfile) && !(data.access.title === 'mvp')"
                         @click="isPopupOpen=true"
                         class="subscribe-bottom__raise">Повысить статус
                    </div>
                  </div>
                </div>
                <div v-if="isMyProfile && data.access.title !== 'admin'" class="subscribe-bottom__column _right">
                  <div class="subscribe-bottom__date">Действует до<br>{{ data.access.date.toLocaleDateString() }}</div>
                  <div class="subscribe-bottom__extend">
                    <AppButton color="gold">Продлить</AppButton>
                  </div>
                </div>

                <div v-if="!isMyProfile" class="subscribe-bottom__column">
                  <div class="subscribe-bottom__blockTitle">Статус пользователя</div>
                  <div class="subscribe-bottom__body">
                    <div class="subscribe-bottom__access" :class="getClassForAccess(data.access.title)">
                      {{ getDisplayNameForAccess(data.access.title) }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <teleport to="#app">
      <AppPopup v-model="isPopupOpen">
        <template v-slot:title>
          Оплата подписки
        </template>
        <div class="subscribeBlock">
          <div class="subscribeBlock__block linear-border white">
            <div class="subscribeBlock__title silverTextColor">VIP</div>
            <p class="subscribeBlock__text">
              Товарищи! дальнейшее развитие различных форм деятельности требуют определения и уточнения модели развития.
              Товарищи! дальнейшее развитие различных форм деятельности требуют определения и уточнения модели развития.
            </p>
            <div class="subscribeBlock__days">
              <label for="dayVip">Срок действия</label>
              <select v-model="vipValueInput" name="dayVip" id="dayVip" class="profile">
                <option value="500">1 месяц</option>
                <option value="3000">6 месяцев</option>
                <option value="6000">12 месяцев</option>
              </select>
            </div>
            <div class="price-subscribeBlock">
              <div class="price-subscribeBlock__price silverTextColor">{{ vipValueInput }} ₽</div>
              <div class="price-subscribeBlock__oldPrice silverTextColor">{{ +vipValueInput + 209 }} ₽</div>
              <div class="price-subscribeBlock__discount">Скидка 33%</div>
            </div>
            <div class="">
              <AppButton class="subscribeBlock__btn" color="whiteGray">Перейти к оплате</AppButton>
            </div>
          </div>
          <div class="subscribeBlock__block linear-border gold">
            <div class="subscribeBlock__title goldTextColor">MVP</div>
            <p class="subscribeBlock__text">
              Товарищи! дальнейшее развитие различных форм деятельности требуют определения и уточнения модели развития.
              Товарищи! дальнейшее развитие различных форм деятельности требуют определения и уточнения модели развития.
            </p>
            <div class="subscribeBlock__days">
              <label for="dayMvp">Срок действия</label>
              <select v-model="mvpValueInput" name="dayMvp" id="dayMvp" class="profile">
                <option value="1000">1 месяц</option>
                <option value="6000">6 месяцев</option>
                <option value="12000">12 месяцев</option>
              </select>
            </div>
            <div class="price-subscribeBlock">
              <div class="price-subscribeBlock__price goldTextColor">{{ mvpValueInput }} ₽</div>
            </div>
            <div class="">
              <AppButton class="subscribeBlock__btn" color="gold">Перейти к оплате</AppButton>
            </div>
          </div>
        </div>
      </AppPopup>
      <AppPopup v-model="showPasswordChangePopup" color="gold">
        <template v-slot:title>
          Подтверждение смены пароля отправлено на почту
        </template>
        Для изменения пароля следуйте инструкции в почте
      </AppPopup>
      <AppPopup v-model="showEmailChangePopup" color="gold">
        <template v-slot:title>
          Подтверждение смены Email отправлено на почту
        </template>
        Для изменения Email следуйте инструкции в почте
      </AppPopup>
    </teleport>
  </main>
</template>

<style lang="scss">
@import "@/assets/scss/style";
@import "@/assets/scss/base";

[v-cloak] {
  display: none;
}

.profileBlock {
  position: relative;
  padding: 130px 0;

  &__container {
  }

  &__block {
    padding: 35px 80px;
    width: 100%;

    @media (max-width: $tablet) {
      padding: 35px 60px;
    }
    @media (max-width: $mobile) {
      padding: 35px 40px;
    }
    @media (max-width: $mobileSmall) {
      padding: 35px 20px;
    }
  }

  &__body {
  }

  &__top {
    display: flex;
    justify-content: space-between;
    margin-bottom: 45px;

    &.center {
      justify-content: center;
      text-align: center;

      .naming-profileBlock {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
      }
    }

    @media (max-width: $mobile) {
      align-items: center;
      flex-direction: column;
      gap: 30px;
    }
  }

  &__bottom {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 80px;

    @media (max-width: $pc) {
      display: flex;
      flex-direction: column;
      gap: 30px;
    }

    &.center {
      display: flex;
      justify-content: space-between;
      max-width: 705px;
      gap: 30px;
      margin: 0 auto;
      white-space: nowrap;

      .statistic-bottom__block, .subscribe-bottom__block {
        width: 215px;
      }

      @media (max-width: $pc) {
        flex-direction: row;
        .subscribe-bottom__block {
          justify-content: flex-start;
          align-items: flex-start;
        }
      }
      @media (max-width: 800px) {
        flex-direction: column;
        justify-content: center;
        align-items: center;
      }

      @media (max-width: 580px) {
        .subscribe-bottom, .statistic-bottom {
          width: 100%;
        }

        .statistic-bottom__block {
          width: 100%;
        }

        .subscribe-bottom__block {
          width: 100%;
        }
      }
    }
  }
}

.naming-profileBlock {
  font-size: 30px;
  font-weight: 700;
  line-height: 1.5;

  @media (max-width: $tablet) {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  &__img {
    width: 120px;
    height: 120px;
    margin-bottom: 30px;
  }

  &__name {
    margin-bottom: 5px;

    span {
      margin-left: 7px;
    }

    display: flex;
    align-items: center;

    input {

    }
  }

  &__blockBtn {
    margin-left: 10px;
    border-radius: 50%;
    border: 1px solid #4a4843;
    width: 30px;
    height: 30px;

    img {
      pointer-events: none;
      max-width: 100%;
    }
  }

  &__access {
    background: white;
    background-clip: border-box;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  &__input {
    position: relative;
    margin-left: 7px;

    small {
      font-size: 12px;
      font-weight: 500;
      color: $redColorHover;
      position: absolute;
      left: 0;
      bottom: -20px;
    }
  }
}

.packs-profileBlock {
  @media (max-width: $mobile) {
    width: 100%;
  }

  &__block {
    padding: 30px 35px;
    display: flex;
    gap: 55px;

    @media (max-width: $mobile) {
      justify-content: space-around;
      padding: 28px 32px;
    }

    @media (max-width: $mobile) {
      gap: 20px;
      padding: 27px 20px;
    }
  }

  &__column {
  }

  &__title {
    font-weight: 700;
    margin-bottom: 15px;
  }

  &__list {
  }

  &__item {
    margin-bottom: 5px;

    &:last-child {
      margin-bottom: 0;
    }

    label {
      color: #a0a0a0;
      font-size: 9px;
      font-weight: 600;
      margin-left: 8px;
    }
  }
}

.middle-profileBlock {
  display: grid;
  grid-template-columns: 15fr 15fr 55fr 15fr;
  align-items: flex-start;
  gap: 30px;
  position: relative;
  z-index: 4;
  margin-bottom: 30px;

  @media (max-width: $pc) {
    display: flex;
    flex-wrap: wrap;
    align-items: inherit;
  }

  @media (max-width: $tablet) {
    margin-bottom: 70px;
  }

  &__column {
    display: flex;
    justify-content: center;
    align-items: center;
    position: relative;

    @media (max-width: $pc) {
      margin-bottom: 35px;
      flex: 1 1 auto;

      &:nth-child(1), &:nth-child(2) {
        flex: 0 1 48%;
      }
      &:nth-child(3) {
        flex: 1 1 100%;
      }
    }
    @media (max-width: $tablet) {
      &:nth-child(1), &:nth-child(2) {
        flex: 0 1 47.5%;
      }
    }
    @media (max-width: $mobile) {
      &:nth-child(1), &:nth-child(2) {
        flex: 1 1 100%;
      }
    }

    @media (max-width: $mobileSmall) {
      margin-bottom: 0;
    }
  }

  label {
    font-size: 9px;
    font-weight: 600;
    margin-bottom: 10px;
    position: absolute;
    left: 0;
    bottom: 100%;
    color: #a6a8a8;
  }

  input, textarea, select {
    background: #60606030;
    width: 100%;
    border-radius: 6px;
    padding: 12px 14px;
    max-height: 40px;
    color: white;
  }

  input[type="date"] {

  }

  input[type=checkbox] {
    max-width: 20px;
    max-height: 20px;
    margin-right: 10px;
  }

  button {
    padding: 12px 30px;
    max-width: 200px;
  }

  textarea {
    max-height: 300px;
    height: 70px;

    @media (max-width: $pc) {
      height: 130px;
    }
  }

  &__hideBrith {
    position: absolute;
    top: calc(100% + 10px);
    left: 0;
    width: 145px;
    display: flex;
    align-items: center;

    label {
      position: relative;
      margin: 0;
    }

    @media (max-width: $mobileSmall) {
      position: relative;
      margin-left: 15px;
      white-space: nowrap;
    }
  }


  &.center {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 10px;
    color: #b4b4b4;
    text-align: center;
    max-width: 705px;
    margin: 0 auto;
    margin-bottom: 30px;

    .middle-profileBlock__column {
      margin-bottom: 0;

      &:first-child {
        margin: 0 !important;
      }
    }
  }
}

.change-profileBlock {
  margin-bottom: 50px;

  &__body {
    display: flex;
    gap: 33px;

    @media (max-width: $mobileSmall) {
      flex-direction: column;
      align-items: center;
      gap: 20px;
    }
  }

  &__btn {
    padding: 13px;
    flex: 0 1 183px;

    @media (max-width: $tablet) {
      flex: 1 1 auto;
    }

    @media (max-width: $mobileSmall) {
      width: 200px;
    }
  }
}

.statistic-bottom {

  &__body {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 30px;
  }

  &__title {
    font-weight: 700;
    font-size: 20px;
    margin-bottom: 30px;
  }

  &__block {
    padding: 28px 33px;

    @media (max-width: $mobile) {
      padding: 23px 25px;
    }
    @media (max-width: $mobileSmall) {
      padding: 18px;
      white-space: nowrap;
    }
  }

  &__blockTitle {
    font-size: 11px;
    font-weight: 600;
    color: #b5b5b5;
    margin-bottom: 15px;
  }

  &__blockValue {
    font-weight: 700;
  }
}

.subscribe-bottom {

  &__title {
    font-weight: 700;
    font-size: 20px;
    margin-bottom: 30px;
  }

  &__block {
    color: #b5b5b5;
    display: grid;
    grid-template-columns: 40fr 60fr;
    gap: 30px;
    padding: 28px 33px;

    @media (max-width: $tablet) {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
    }
  }

  &__column {

    &._right {
      display: flex;
      justify-content: flex-end;
      align-items: flex-end;
      text-align: right;

      @media (max-width: $tablet) {
        width: 100%;
        justify-content: center;
        align-items: center;
        text-align: left;
      }
    }
  }

  &__body {
    display: grid;
    grid-template-columns: 20fr 80fr;
    gap: 15px;
  }

  &__blockTitle {
    font-size: 11px;
    font-weight: 600;
    color: #b5b5b5;
    margin-bottom: 15px;
  }

  &__access {
    background: white;
    background-clip: border-box;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    font-weight: 700;
  }

  &__raise {
    color: white;
    text-decoration: underline;
    cursor: pointer;

    &:hover {
      text-decoration: none;
    }
  }

  &__date {
    margin-right: 30px;
    line-height: 1.4;
    white-space: nowrap;
  }

  &__extend {

    button {
      padding: 12px 50px;
    }
  }
}

</style>
<style lang="scss">
@import "@/assets/scss/style";
@import "@/assets/scss/base";

.subscribeBlock {
  display: flex;
  gap: 30px;

  @media (max-width: $tablet) {
    gap: 15px;
  }

  @media (max-width: $mobile) {
    flex-direction: column;
  }

  &__block {
    padding: 26px 20px;

    @media (max-width: $tablet) {
      padding: 26px 15px;
    }
  }

  &__title {
    font-size: 30px;
    font-weight: 700;
    margin-bottom: 15px;
    text-align: center;
  }

  &__text {
    font-size: 11px;
    font-weight: 600;
    margin-bottom: 25px;
    opacity: 40%;
    text-align: center;
  }

  &__days {
    display: flex;
    flex-direction: column;
    margin-bottom: 20px;
    position: relative;
    z-index: 4 !important;

    label {
      font-size: 9px;
      font-weight: 600;
      opacity: 60%;
      margin-bottom: 10px;
    }
  }

  &__btn {
    width: 100%;
    display: flex;
    padding: 14px 25px;
  }
}

.price-subscribeBlock {
  display: flex;
  justify-content: space-around;
  align-items: center;
  margin-bottom: 20px;

  @media (max-width: $mobile) {

  }

  &__price {
    font-weight: 700;
    font-size: 30px;
  }

  &__oldPrice {
    font-weight: 400;
    font-size: 20px;
    text-decoration-line: line-through;
  }

  &__discount {
    color: white;
    font-size: 10px;
    font-weight: 700;
    background: #328925;
    border-radius: 15px;
    padding: 5px 8px;
  }
}
</style>