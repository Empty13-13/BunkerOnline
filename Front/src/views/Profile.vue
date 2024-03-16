<script setup="">
import AppButton from "@/components/AppButton.vue";
import AppBackground from "@/components/AppBackground.vue";
import { computed, nextTick, onBeforeMount, onBeforeUnmount, onMounted, reactive, ref } from "vue";
import { destroyAll, fieldsInit } from "@/plugins/select.js";
import { useAccessStore } from "@/stores/counter.js";
import router from "@/router/index.js";
import AppPopup from "@/components/AppPopup.vue";
import AppAvatar from "@/components/AppAvatar.vue";
import { getClassForAccess } from "@/plugins/functions.js";
import { useAuthStore } from "@/stores/auth.js"

const authStore = useAuthStore()

const access = useAccessStore()

const getId = computed(() => {
  return +router.currentRoute.value.path.split('=')[1]
})

const myId = access.id
const myAccess = access.level
const data = reactive({
  id: getId,
  isBlocked: false,
  name: 'Никнейм',
  access: {title: access.level, date: new Date()},
  dateRegistration: new Date(),
  birthday: {date: new Date(), isHidden: false},
  isMale: false,
  about: 'Lorem ipsum dolor sit amet, consectetur adipisicing elit. Consequuntur ex inventore molestias nostrum quia sapiente! Architecto, aspernatur at doloribus dolorum fuga iste libero nihil officiis, optio placeat sapiente soluta, suscipit ut vero voluptatibus? Aperiam maiores nostrum reprehenderit? Architecto eveniet facere fuga hic. Ab alias aut consequatur deserunt, dicta dolores, in iusto nulla odio odit perspiciatis vitae? Accusamus adipisci autem consequuntur corporis ducimus ea eaque eos error eveniet id in inventore labore magni maiores modi, molestias natus odio odit placeat quidem repellendus similique suscipit vero. Accusamus adipisci commodi dolor, doloribus hic nam nemo obcaecati quod rerum sint tempore, unde voluptas, voluptates!',
  gameNum: 125,
  survivalRate: 68,
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
const options = ['Мужчина', 'Женщина']

const selectModel = ref(null)
const blockBtn = ref(null)

const isMyProfile = computed(() => {
  return authStore.userInfo.userId===data.id
})
const getBlockButtonImg = computed(() => {
  if (data.isBlocked) {
    return 'blocked.png'
  }
  else {
    return 'unblocked.png'
  }
})

function changeBlocked() {
  data.isBlocked = !data.isBlocked
}

onMounted(() => {
  fieldsInit()
})
onBeforeUnmount(() => {
  destroyAll()
})

const isPopupOpen = ref(false)
const vipValueInput = ref('')
const mvpValueInput = ref('')

</script>

<template>
  <main class="profileBlock">
    <AppBackground img-name="profile.jpg"></AppBackground>
    <div class="">
      <div class="profileBlock__container">
        <div class="profileBlock__block linear-border gold">
          <div class="profileBlock__top" :class="isMyProfile?'':'center'">
            <div class="profileBlock__naming naming-profileBlock">
              <AppAvatar class="naming-profileBlock__img" filename="backgrounds/mainClear.jpg" :color="myAccess"/>
              <div class="naming-profileBlock__name"
              >
                {{ isMyProfile? "Привет, ":'' }}<span :class="getClassForAccess(myAccess)">{{ data.name }}</span>
                <button v-if="myAccess === 'admin' && getId!==myId"
                        class="naming-profileBlock__blockBtn btn"
                        ref="blockBtn"
                        @mouseover="changeBlocked" @mouseout="changeBlocked"
                        @click="changeBlocked"
                >
                  <img :src="'/img/icons/'+getBlockButtonImg" alt="">
                </button>
              </div>
              <div class="naming-profileBlock__access"
                   :class="getClassForAccess(myAccess)"
              >{{ data.access.title }}</div>
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
          <div class="middle-profileBlock" :class="isMyProfile?'':'center'">
            <div v-if="!isMyProfile" class="middle-profileBlock__column">
              <span>Дата регистрации {{ data.dateRegistration.toLocaleDateString() }}</span>
            </div>
            <div v-if="!isMyProfile" class="middle-profileBlock__column">
              <span>Дата рождения: {{
                  data.birthday.date.toLocaleDateString()
                    }} ({{ (new Date()).getFullYear() - data.birthday.date.getFullYear() }} лет)</span>
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
              <input type="date" name="birthday" id="birthday">
              <div class="middle-profileBlock__hideBrith">
                <!--              <input type="checkbox" name="hideBirth" id="hideBirth">-->
                <!--              <label for="hideBirth">Скрыть дату рождения</label>-->
                <div class="checkbox">
                  <input id="hideBirth" class="checkbox__input" type="checkbox" value="1">
                  <label for="hideBirth" class="checkbox__label"><span
                      class="checkbox__text">Скрыть дату рождения</span></label>
                </div>
              </div>
            </div>
            <div v-if="isMyProfile" class="middle-profileBlock__column">
              <label for="sex">Пол</label>
              <select class="profile" name="sex" id="sex">
                <option value="0">Женский</option>
                <option value="1" selected>Мужской</option>
              </select>
            </div>
            <div v-if="isMyProfile" class="middle-profileBlock__column">
              <label for="about">О себе</label>
              <textarea name="about" id="about" placeholder="Текст о себе"></textarea>
            </div>
            <div v-if="isMyProfile" class="middle-profileBlock__column">
              <AppButton color="gold" border="true">Сохранить</AppButton>
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
                    <div class="subscribe-bottom__access" :class="getClassForAccess(myAccess)">{{ data.access.title }}</div>
                    <div @click="isPopupOpen=true" class="subscribe-bottom__raise">Повысить статус</div>
                  </div>
                </div>
                <div v-if="isMyProfile" class="subscribe-bottom__column _right">
                  <div class="subscribe-bottom__date">Действует до<br>{{ data.access.date.toLocaleDateString() }}</div>
                  <div class="subscribe-bottom__extend">
                    <AppButton color="gold">Продлить</AppButton>
                  </div>
                </div>

                <div v-else class="subscribe-bottom__column">
                  <div class="subscribe-bottom__blockTitle">Статус пользователя</div>
                  <div class="subscribe-bottom__body">
                    <div class="subscribe-bottom__access">{{ data.access.title }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
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
            <div class="price-subscribeBlock__price silverTextColor">{{vipValueInput}} ₽</div>
            <div class="price-subscribeBlock__oldPrice silverTextColor">{{+vipValueInput+209}} ₽</div>
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
            <div class="price-subscribeBlock__price goldTextColor">{{mvpValueInput}} ₽</div>
          </div>
          <div class="">
            <AppButton class="subscribeBlock__btn" color="gold">Перейти к оплате</AppButton>
          </div>
        </div>
      </div>
    </AppPopup>
  </main>
</template>

<style lang="scss">
@import "@/assets/scss/style";

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

  @media (max-width: $pc) {
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

    }

    display: flex;
    justify-content: center;
    align-items: center;
  }

  &__blockBtn {
    margin-left: 10px;
    border-radius: 50%;
    border: 1px solid #4a4843;
    width: 30px;
    height: 30px;

    img {
      pointer-events: none;
    }
  }

  &__access {
    text-transform: uppercase;
    background: linear-gradient(90deg, rgb(191, 191, 191), rgb(136, 136, 136) 53.646%, rgb(201, 201, 201) 100%);
    background-clip: border-box;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
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
  margin-bottom: 80px;

  &__column {
    display: flex;
    justify-content: center;
    align-items: center;
    position: relative;

    @media (max-width: $pc) {
      margin-bottom: 35px;
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

  @media (max-width: $pc) {
    display: flex;
    flex-direction: column;
    align-items: inherit;
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
    text-transform: uppercase;
    background: $whiteGrayColor;
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

  @media (max-width:$tablet){
    gap: 15px;
  }

  @media (max-width:$mobile){
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