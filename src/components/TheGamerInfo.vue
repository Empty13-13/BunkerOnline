<script setup="">
import AppSmallInfo from "@/components/AppSmallInfo.vue";

defineProps(['specItems'])

const itemsName = [
  ['Пол', 'sex'],
  ['Телосложение', 'physique'],
  ['Человеческая черта', 'trait'],
  ['Профессия', 'profession', "Какое то всплывающее окно"],
  ['Здоровье', 'health'],
  ['Хобби / Увлечения', 'hobbies', "Какое то всплывающее окно"],
  ['Фобия / Страх', 'phobia'],
  ['Крупный инвентарь', 'inventory'],
  ['Рюкзак', 'backpack'],
  ['Дополнительные сведения', 'addInfo'],
]
const isCreate = false

// const specItems = [
//   {title: 'Раскрыть характеристику “человеческая черта” у другого игрока', isReload: true, isLocked: true},
//   {title: 'У вас есть информация о том, где находится склад с продуктами', isReload: true, isLocked: true},
// ]
const features = {
  sex: {title: "Мужчина 41 год (взрослый) чайлдфри", isReload: true, isLocked: true},
  physique: {title: "Крепкое (Рост: 182 см.)", isReload: true, isLocked: true},
  trait: {title: "Брезгливый", isReload: true, isLocked: true},
  profession: {title: "Астролог (Стажер)", isReload: true, isLocked: false, info: "Какое то всплывающее окно"},
  health: {title: "Перикардит (Легкая степень)", isReload: true, isLocked: true},
  hobbies: {title: "Мужчина 41 год (взрослый) чайлдфри", isReload: true, isLocked: true},
  phobia: {title: "Парентофобия (боязнь родителей)", isReload: false, isLocked: true},
  inventory: {title: "Книга “Как распознать ложь”", isReload: true, isLocked: true},
  backpack: {title: "Консервы", isReload: true, isLocked: true},
  addInfo: {title: "Практикует нестандартные эксперименты", isReload: true, isLocked: false},
}

import AppButton from "@/components/AppButton.vue";
</script>

<template>
  <div class="gamerInfo">
    <div class="gamerInfo__container">
      <div class="gamerInfo__block linear-border white">
        <h2 class="gamerInfo__title titleH2">
          Информация о
          <span> НикИгрока</span>
        </h2>
        <div v-if="isCreate" class="gamerInfo__body">
          <div class="gamerInfo__column">
            <div
                v-for="index in 5"
                :key="index"
                class="gamerInfo__item item-gamerInfo"
            >
              <div class="item-gamerInfo__title">
                {{ itemsName[index - 1][0] }}
                <AppSmallInfo v-if="itemsName[index - 1].length>2" :text="itemsName[index - 1][2]" />
              </div>
              <div class="item-gamerInfo__description">
                <textarea :id="'input'+(index-1)" maxlength="70" placeholder="Введите характеристику" type="text"
                          class="item-gamerInfo__input"></textarea>
                <button class="item-gamerInfo__open">
                  <img src="/img/icons/lock-closed.png" alt="">
                </button>
              </div>
            </div>
          </div>
          <div class="gamerInfo__column">
            <div
                v-for="index in 5"
                :key="index"
                class="gamerInfo__item item-gamerInfo"
            >
              <div class="item-gamerInfo__title">
                {{ itemsName[index + 4][0] }}
                <AppSmallInfo v-if="itemsName[index + 4].length>2" :text="itemsName[index + 4][2]" />
              </div>
              <div class="item-gamerInfo__description">
                <textarea :id="'input'+(index+4)" maxlength="70" placeholder="Введите характеристику"
                          class="item-gamerInfo__input"></textarea>
                <button class="item-gamerInfo__open">
                  <img src="/img/icons/lock-closed.png" alt="">
                </button>
              </div>

            </div>
          </div>
        </div>
        <div v-else class="gamerInfo__body">
          <div class="gamerInfo__column">
            <div
                v-for="index in 5"
                :key="index"
                class="gamerInfo__item item-gamerInfo"
            >
              <div class="item-gamerInfo__title">
                {{ itemsName[index - 1][0] }}
                <AppSmallInfo v-if="itemsName[index - 1].length>2" :text="itemsName[index - 1][2]" />
              </div>
              <div class="item-gamerInfo__description">
                <p class="item-gamerInfo__text">{{ features[itemsName[index - 1][1]].title }}</p>
                <AppSmallInfo v-if="features[itemsName[index - 1][1]].info"
                              :text="features[itemsName[index - 1][1]].info" />
                <button v-if="features[itemsName[index-1][1]].isReload" class="item-gamerInfo__reload">
                  <img src="/img/icons/reload.png" alt="">
                </button>
                <button v-if="features[itemsName[index-1][1]].isLocked" class="item-gamerInfo__open">
                  <img src="/img/icons/lock-closed.png" alt="">
                </button>
                <button v-else class="item-gamerInfo__open">
                  <img src="/img/icons/lock-open.png" alt="">
                </button>
              </div>
            </div>
          </div>
          <div class="gamerInfo__column">
            <div
                v-for="index in 5"
                :key="index"
                class="gamerInfo__item item-gamerInfo"
            >
              <div class="item-gamerInfo__title">
                {{ itemsName[index + 4][0] }}
                <AppSmallInfo v-if="itemsName[index + 4].length>2" :text="itemsName[index + 4][2]" />
              </div>
              <div class="item-gamerInfo__description">
                <p class="item-gamerInfo__text">{{ features[itemsName[index - 1][1]].title }}</p>
                <AppSmallInfo v-if="features[itemsName[index + 4][1]].info"
                              :text="features[itemsName[index + 4][1]].info" />
                <button class="item-gamerInfo__reload">
                  <img v-if="features[itemsName[index+4][1]].isReload" src="/img/icons/reload.png" alt="">
                </button>
                <button v-if="features[itemsName[index+4][1]].isLocked" class="item-gamerInfo__open">
                  <img src="/img/icons/lock-closed.png" alt="">
                </button>
                <button v-else class="item-gamerInfo__open">
                  <img src="/img/icons/lock-open.png" alt="">
                </button>
              </div>
            </div>
          </div>
        </div>

        <div v-if="isCreate" class="gamerInfo__specials">
          <div
              v-for="item in 2"
              :key="item"
              class="gamerInfo__item item-gamerInfo special"
          >
            <div class="item-gamerInfo__title">
              Спец. возможность {{ item }}
            </div>
            <div class="item-gamerInfo__description">
              <textarea :id="'specInput'+(item-1)" maxlength="150" placeholder="Введите характеристику"
                        class="item-gamerInfo__input"></textarea>
              <button class="item-gamerInfo__open">
                <img src="/img/icons/lock-closed.png" alt="">
              </button>
            </div>
          </div>
        </div>
        <div v-else class="gamerInfo__specials">
          <div
              v-for="item in 2"
              :key="item"
              class="gamerInfo__item item-gamerInfo special"
          >
            <div class="item-gamerInfo__title">
              Спец. возможность {{ item }}
            </div>
            <div class="item-gamerInfo__description">
              <p class="item-gamerInfo__text">{{ specItems[item - 1].title }}</p>
              <button class="item-gamerInfo__reload">
                <img v-if="specItems[item - 1].isReload" src="/img/icons/reload.png" alt="">
              </button>
              <button v-if="specItems[item-1].isLocked" class="item-gamerInfo__open">
                <img src="/img/icons/lock-closed.png" alt="">
              </button>
              <button v-else class="item-gamerInfo__open">
                <img src="/img/icons/lock-open.png" alt="">
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>

</template>

<style scoped lang="scss">
@import "@/assets/scss/style";

.gamerInfo {
  margin-bottom: 120px;

  @media (max-width: $pc) {
    margin-bottom: 100px;
  }
  @media (max-width: $tablet) {
    margin-bottom: 90px;
  }
  @media (max-width: $mobile) {
    margin-bottom: 70px;
  }
  @media (max-width: $mobileSmall) {
    margin-bottom: 50px;
  }

  &__container {
  }

  &__block {
  }

  &__title {
    margin-top: 60px;

    @media (max-width: $tablet) {
      margin-top: 50px;
    }
    @media (max-width: $mobile) {
      margin-top: 40px;
    }
  }

  &__body {
    display: flex;
    justify-content: space-between;
    gap: 100px;
    padding: 0 47px;

    @media (max-width: $pc) {
      padding: 0 35px;
    }
    @media (max-width: $tablet) {
      padding: 0 30px;
    }
    @media (max-width: $mobile) {
      padding: 0 25px;
      flex-direction: column;
      gap: 0;
    }
    @media (max-width: $mobileSmall) {
      padding: 0 20px;
    }
  }

  &__column {
    max-width: 460px;
    width: 100%;

    @media (max-width: $mobile) {
      max-width: 100%;
    }
  }

  &__specials {
    padding: 0 47px;
    background: #081E04;

    @media (max-width: $pc) {
      padding: 0 35px;
    }
    @media (max-width: $tablet) {
      padding: 0 30px;
    }
    @media (max-width: $mobile) {
      padding: 0 25px;
    }
    @media (max-width: $mobileSmall) {
      padding: 0 20px;
    }
  }
}

.item-gamerInfo {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 40px;
  padding: 20px 0;
  border-bottom: 1px dashed;
  border-color: #373737;

  @media (max-width: $mobile) {
    gap: 20px;
    &:first-child {
      border-top: 1px dashed;
      border-color: #373737;
    }
  }

  &:last-child {
    border: none;
  }

  &.special {
    display: flex;
    max-width: 733px;
    margin: 0 auto;
    gap: 40px;

    &:first-child {
      padding-top: 28px;
      border-top: none;
    }

    &:last-child {
      padding-bottom: 28px;
    }

    .item-gamerInfo__title {
      color: #B4BBB3;
      min-width: 90px;

      @media (max-width: $mobile) {
        max-width: 100px;
      }
    }

    .item-gamerInfo__input {
      @include adaptiveValue("width", 484, 166);
    }

    @media (max-width: $mobileSmall) {
      gap: 10px;

      .item-gamerInfo__text {
        max-width: 100%;
      }
    }
  }

  &__title {
    font-weight: 600;
    font-size: 11px;
    color: #b4b4b4;
    display: flex;
    align-items: center;
  }

  &__description {
    display: flex;
    gap: 15px;
    justify-content: flex-end;
    align-items: center;
  }

  &__text {
    font-weight: 700;
    text-align: end;
    @media (max-width: $mobileSmall) {
      max-width: 150px;
    }
  }

  &__input {
    background: transparent;
    color: #b4b4b4;
    border: 1px solid;
    display: flex;
    max-width: 100%;
    padding: 5px;

    @media (max-width: $mobileSmall) {
      width: 166px;
    }


    &::placeholder {
      color: #525252;
    }

    &.special {
      width: 484px;
    }
  }

  &__reload {
    width: 18px;
    background: transparent;
  }

  &__open {
    width: 18px;
    background: transparent;
  }
}

</style>