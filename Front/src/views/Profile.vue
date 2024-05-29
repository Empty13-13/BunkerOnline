<script setup="">
import AppButton from "@/components/AppButton.vue";
import AppBackground from "@/components/AppBackground.vue";
import {
  computed,
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
import { showConfirmBlock } from "@/plugins/confirmBlockPlugin.js";
import { useGlobalPopupStore } from "@/stores/popup.js";
import AppSelect from "@/components/Forms/AppSelect.vue";
import { useAdminSocketStore } from "@/stores/socket/adminSocket.js";

const authStore = useAuthStore()
const myProfile = useMyProfileStore()
const globalPreloader = usePreloaderStore()
const actionsProfile = useActionsProfileStore()
const globalPopup = useGlobalPopupStore()
const adminSocket = useAdminSocketStore()

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
  isMale: {text: 'Не выбран', value: -1},
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
  return +myProfile.id=== +data.id
})
const getBlockButtonImg = computed(() => {
  if (data.isBlocked) {
    return 'blocked.png'
  }
  else {
    return 'unblocked.png'
  }
})
const getSex = computed(() => {
  if (data.isMale.value=== -1) {
    return 'Не указан'
  }
  else if (data.isMale.value===0) {
    return 'Женский'
  }
  else if (data.isMale.value===1) {
    return 'Мужской'
  }
})

let birthdayInput = ref()
let isHiddenBirthdayInput = ref()
let isMaleSelect = ref()
let aboutInput = ref()
let saveBtnText = ref('Сохранить')

let isChangingName = ref(false)
let oldNickname = null

const sexOptions = [
  {text: 'Не выбран', value: -1},
  {text: 'Женский', value: 0},
  {text: 'Мужской', value: 1},
]

function changeBlocked() {
  data.isBlocked = !data.isBlocked
}

function banUser(e) {
  showConfirmBlock(e.target, async () => {
    globalPreloader.activate()

    try {
      await axiosInstance.post(`/blockUser=${data.id}`, {}, {
        withCredentials: true
      })
      await updateProfileInfo()
      if (data.isBlocked) {
        globalPopup.activate('Успешно!', 'Пользователь успешно заблокирован', 'green')
        adminSocket.setConnect()
        adminSocket.emit('banUser',data.id)
        // adminSocket.close()
      }
      else {
        globalPopup.activate('Успешно!', 'Пользователь успешно разблокирован', 'green')
      }
    } catch(e) {
      console.log(e.message)
    }

    globalPreloader.deactivate()
  })
}

async function changeName(e) {
  if (!isChangingName.value) {
    isChangingName.value = true
    oldNickname = data.name
  }
  else {
    if (!(myProfile.isMVP || myProfile.isAdmin)) {
      showConfirmBlock(e.target, () => {

      }, 'С уровнем подписки "Пользователь" и VIP изменить никнейм можно только один раз. Вы подтверждаете действие?')
    }
    else {
      console.log(data.name)
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
  oldId = +getId.value
  let params = getLinkParams()
  if (params['account'] && params['account']==="connected") {
    await authStore.refreshToken()
    if (!localStorage.getItem('userId')) {
      myProfile.id = +getId.value
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
  if (oldId!== +getId.value) {
    destroyAll()
  }
})
onUpdated(async () => {
  if (oldId!== +getId.value) {
    globalPreloader.activate()
    oldId = +getId.value
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
  if (+data.isMale.value!==data.sex) {
    if (+data.isMale.value=== -1) {
      body.sex = null
    }
    else {
      body.sex = +data.isMale.value
    }
  }
  if (aboutInput.value!==data.text) {
    body.text = aboutInput.value.value
  }

  let response = await authStore.updateProfileInfo(+getId.value, body)
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
  let userInfo = await actionsProfile.getUserInfo(+getId.value)
  console.log('userInfo', userInfo)
  if (!userInfo) {
    await router.push('/')
    // globalPopup.activate('Ошибка!', 'Данный пользователь не найден', 'red')
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
  console.log('typeof data.birthday:: ',typeof  userInfo.data.birthday, userInfo.data.birthday)
  data.birthday.date = userInfo.data.birthday? new Date(userInfo.data.birthday):null
  data.birthday.isHidden = userInfo.data.hiddenBirthday || false
  if (data.birthday.date) {
    if (birthdayInput.value) {
      birthdayInput.value.valueAsDate = data.birthday.date
    }
    let date = ''
    date = `${data.birthday.date.getDate().toString().padStart(2,'0')}.${(data.birthday.date.getMonth()+1).toString().padStart(2,'0')}`

    if(!data.birthday.isHidden) {
      date += `.${data.birthday.date.getFullYear()}`
    }
    data.birthday.date = date
  }
  if (isHiddenBirthdayInput.value) {
    isHiddenBirthdayInput.value.checked = data.birthday.isHidden
  }
  console.log('userInfo.data.sex', userInfo.data.sex)
  if (!(userInfo.data.sex===null || userInfo.data.sex===undefined)) {
    data.isMale = {text: !!userInfo.data.sex? 'Мужской':'Женский', value: +userInfo.data.sex}
  }

  console.log('data.isMale', data.isMale)
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
      globalPopup.activate('Внимание', 'Вы уже отправляли запрос на восстановление пароля', 'gold')
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
      globalPopup.activate('Внимание', 'Вы уже отправляли запрос на восстановление email', 'gold')
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
                         :color="data.access.title"
                         :block-edit="isMyProfile && myProfile.isHigherThanDefault ||
                                      !isMyProfile && myProfile.isAdmin"
                         v-model:href="data.avatar"
              />
              <div class="naming-profileBlock__name">
                {{ isMyProfile? "Привет, ":'' }}
                <span v-if="!isChangingName" :class="getClassForAccess(data.access.title)">
                  {{ data.name }}
                  <button
                      v-if="((isMyProfile && myProfile.isHigherThanDefault) || myProfile.isAdmin || (isMyProfile && data.isChange)) && !isChangingName"
                      class="naming-profileBlock__blockBtn btn"
                      ref="changeNameBtn"
                      @click="changeName"
                  >
                    <img src="/img/icons/pencil.png" alt="">
                  </button>
                  <button v-if="myProfile.isAdmin && !isMyProfile && !isChangingName"
                          class="naming-profileBlock__blockBtn btn"
                          @mouseover="changeBlocked" @mouseout="changeBlocked"
                          @click="banUser"
                          :style="isMyProfile?'':'margin-left:7px;'"
                  >
                    <img :src="'/img/icons/'+getBlockButtonImg" alt="">
                  </button>
                </span>
                <div v-else class="naming-profileBlock__input">
                  <small hidden="">Какой то текст с ошибкой</small>
                  <input type="text" name="nickname" class="_type2" maxlength="15" minlength="3"
                         v-model="data.name"
                         @keydown="keyDownNickname"
                         @focus="focusInInput"
                  >
                  <button
                      v-if="((isMyProfile && myProfile.isHigherThanDefault) || myProfile.isAdmin || (isMyProfile && data.isChange)) && isChangingName"
                      class="naming-profileBlock__blockBtn btn"
                      ref="changeNameBtn"
                      @click="changeName"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="100" height="100"
                         viewBox="0,0,256,256">
                      <g fill="#ffffff" fill-rule="nonzero" stroke="none" stroke-width="1" stroke-linecap="butt"
                         stroke-linejoin="miter" stroke-miterlimit="10" stroke-dasharray="" stroke-dashoffset="0"
                         font-family="none" font-size="none"
                         style="mix-blend-mode: normal">
                        <g transform="scale(8.53333,8.53333)">
                          <path
                              d="M26.98047,5.99023c-0.2598,0.00774 -0.50638,0.11632 -0.6875,0.30273l-15.29297,15.29297l-6.29297,-6.29297c-0.25082,-0.26124 -0.62327,-0.36647 -0.97371,-0.27511c-0.35044,0.09136 -0.62411,0.36503 -0.71547,0.71547c-0.09136,0.35044 0.01388,0.72289 0.27511,0.97371l7,7c0.39053,0.39037 1.02353,0.39037 1.41406,0l16,-16c0.29576,-0.28749 0.38469,-0.72707 0.22393,-1.10691c-0.16075,-0.37985 -0.53821,-0.62204 -0.9505,-0.60988z"></path>
                        </g>
                      </g>
                    </svg>
                  </button>
                </div>
              </div>
              <div class="naming-profileBlock__access"
                   :class="getClassForAccess(data.access.title)"
              >
                {{ getDisplayNameForAccess(data.access.title) }}
              </div>
            </div>
            <div v-if="isMyProfile" class="profileBlock__packs packs-profileBlock">
              <div class="packs-profileBlock__block linear-border white">
                <div class="packs-profileBlock__block-body">
                  <div class="packs-profileBlock__column">
                    <div class="packs-profileBlock__title">Базовый пак</div>
                    <AppLoader v-if="myProfile.showLoaderForPacks" />
                    <ul v-else class="packs-profileBlock__list">
                      <li class="packs-profileBlock__item"
                          v-for="pack in myProfile.basePacks"
                          :key="pack.id"
                      >
                        <div class="checkbox" :title="pack.text">
                          <input :id="'basic'+pack.id" class="checkbox__input" name="basic" type="checkbox"
                                 :value="pack.id"
                                 v-model="pack.isUse"
                                 :disabled="pack.disabled"
                                 @change="myProfile.changePacks(pack)"
                          >
                          <label :for="'basic'+pack.id" class="checkbox__label" :class="pack.systemPack?'_system':''">
                            <span class="checkbox__text">{{ pack.namePack }}</span>
                          </label>
                        </div>
                      </li>
                    </ul>
                  </div>
                  <div class="packs-profileBlock__column">
                    <div class="packs-profileBlock__title">Расширенный пак</div>
                    <AppLoader v-if="myProfile.showLoaderForPacks" />
                    <ul v-else class="packs-profileBlock__list">
                      <li class="packs-profileBlock__item"
                          v-for="(pack,index) in myProfile.advancePacks"
                          :key="pack.id"
                      >
                        <div class="checkbox" :title="pack.text">
                          <input :id="'advanced'+pack.id" class="checkbox__input" name="advanced" type="checkbox"
                                 :value="pack.id"
                                 v-model="pack.isUse"
                                 :disabled="pack.disabled"
                                 @change="myProfile.changePacks(pack)"
                          >
                          <label :for="'advanced'+pack.id" class="checkbox__label"
                                 :class="pack.systemPack?'_system':''">
                            <span class="checkbox__text">{{ pack.namePack }}</span>
                          </label>
                        </div>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <form @submit="saveProfileInfoHandler" class="middle-profileBlock" :class="isMyProfile?'':'center'">
            <div v-if="!isMyProfile" class="middle-profileBlock__column">
              <span>Дата регистрации {{ data.dateRegistration.toLocaleDateString() }}</span>
            </div>
            <div v-if="!isMyProfile || (!isMyProfile && myProfile.isAdmin)"
                 class="middle-profileBlock__column">
              <span>Дата рождения:
                    {{ data.birthday.date? data.birthday.date:"Не установлено" }}
                    {{
                  data.birthday.date && typeof data.birthday.date!=='string'? "(" + ((new Date()).getFullYear() - data.birthday.date.getFullYear()) + ")":""
                    }}
              </span>
            </div>
            <div v-if="!isMyProfile" class="middle-profileBlock__column">
              <span>Пол: {{ getSex }}</span>
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
                      class="checkbox__text">Скрыть год рождения</span></label>
                </div>
              </div>
            </div>
            <div v-if="isMyProfile" class="middle-profileBlock__column">
              <label for="sex">Пол</label>
              <AppSelect v-model="data.isMale" :options="sexOptions" class="selectBlock profile" />
              <!--              <select ref="isMaleSelect" class="profile" name="sex" id="sex">-->
              <!--                <option value="-1" :selected="data.isMale===-1">Не выбран</option>-->
              <!--                <option value="0" :selected="data.isMale===0">Женский</option>-->
              <!--                <option value="1" :selected="data.isMale===1">Мужской</option>-->
              <!--              </select>-->
            </div>
            <div v-if="isMyProfile" class="middle-profileBlock__column">
              <label for="about">О себе</label>
              <textarea maxlength="254" ref="aboutInput" name="about" id="about" placeholder="Текст о себе">{{data.about}}</textarea>
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
              <div class="subscribe-bottom__block linear-border white"
                   :class="myProfile.isDefault && isMyProfile?'_newSubscribe':''">
                <div v-if="myProfile.isDefault && isMyProfile" class="subscribe-bottom__newSubscribe">
                  <AppButton @click="isPopupOpen=true" color="gold">Оформить подписку</AppButton>
                </div>
                <div v-if="isMyProfile && !myProfile.isDefault" class="subscribe-bottom__column">
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
                <div v-if="isMyProfile && data.access.title !== 'admin' && !myProfile.isDefault"
                     class="subscribe-bottom__column _right">
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

  @media (max-width: $pc) {
    padding: 120px 0;
  }
  @media (max-width: $tablet) {
    padding: 100px 0;
  }
  @media (max-width: $mobile) {
    padding: 80px 0;
  }

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
    gap: 20px;

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
  flex: 1 1 auto;

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
    display: flex;
    align-items: center;
    gap: 7px;

    @media (max-width: $tablet) {
      flex-wrap: wrap;
      justify-content: center;
    }
    @media (max-width: $mobile) {
      justify-content: center;
    }

    span {
      //margin-left: 7px;
      display: flex;
      align-items: center;
      gap: 10px;

      @media (max-width: $mobileSmall) {
        justify-content: center;
        flex-wrap: wrap;
      }

      button {
        margin-left: 0 !important;
      }
    }

    input {

    }

    button {
      svg {
        max-width: 100%;
        max-height: 100%;
      }
    }
  }

  &__blockBtn {
    margin-left: 10px;
    border-radius: 50%;
    border: 1px solid #4a4843;
    width: 30px;
    height: 30px;
    max-width: 30px;
    max-height: 30px;

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
    display: flex;
    align-items: center;

    small {
      font-size: 12px;
      font-weight: 500;
      color: $redColorHover;
      position: absolute;
      left: 0;
      bottom: -20px;
    }

    input {
      display: flex;
      flex: 1 1 auto;
      width: 100%;
      max-width: 15ch;
    }
  }
}

.packs-profileBlock {

  @media (max-width: $mobile) {
    width: 100%;
  }

  &__block {
    padding: 30px 35px;
    @media (max-width: $mobile) {
      padding: 28px 32px;
    }

    @media (max-width: $mobile) {
      padding: 27px 20px;
    }
  }

  &__block-body {
    display: flex;
    gap: 55px;
    max-height: 200px;
    overflow-y: auto;
    overflow-x: hidden;

    @media (max-width: $mobile) {
      justify-content: space-around;
    }

    @media (max-width: $mobile) {
      gap: 20px;
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

    label._system {
      @extend %goldTextColor;
    }

    input:disabled + label {
      &::before {
        background: rgba(28, 27, 27, 0.28) !important;
      }
    }

    input:disabled:checked + label {
      &::before {
        background: url("/img/icons/check.png") 50%/50% no-repeat, linear-gradient(90.00deg, rgb(110, 93, 41), rgb(65, 31, 6) 100%) !important;
      }
    }
  }
}

.middle-profileBlock {
  display: grid;
  grid-template-columns: 15fr 15fr 55fr 15fr;
  align-items: flex-start;
  gap: 30px;
  position: relative;
  z-index: 4 !important;
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
      &:nth-child(1) {
        margin-bottom: 30px;
      }
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
    min-height: 70px;
    height: 70px;
    resize: vertical;

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

    //@media (max-width: $mobileSmall) {
    //  position: relative;
    //  margin-left: 15px;
    //  white-space: nowrap;
    //}
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

  &__block._newSubscribe {
    display: flex;
    justify-content: center;
    align-items: center;
  }

  &__newSubscribe {
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;

    button {
      height: 50px;
      font-size: 13px;
      font-weight: 600;
      max-width: 320px;

      @media (max-width: $mobile) {
        height: 45px;
        font-size: 12px;
      }
      @media (max-width: $mobileSmall) {
        font-size: 11px;
        height: 40px;
      }
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
