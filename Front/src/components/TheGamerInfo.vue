<script setup="">
import AppSmallInfo from "@/components/AppSmallInfo.vue";
import { useUserSocketStore } from "@/stores/socket/userSocket.js";
import { useSelectedGame, useSelectedGameData, useSelectedGameGameplay } from "@/stores/game.js";
import AppLoader from "@/components/AppLoader.vue";

defineProps(['data', 'isReg', 'isCreate', 'nickname', 'id'])

const selectedGameGameplay = useSelectedGameGameplay()
const selectedGameData = useSelectedGameData()

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
const specItems = [
  ['Спец. возможность 1', 'spec1'],
  ['Спец. возможность 2', 'spec2'],
]

//========================================================================================================================================================
</script>

<template>
  <div id="gamerInfo" class="gamerInfo">
    <div class="gamerInfo__container">
      <div class="gamerInfo__block linear-border white">
        <h2 v-slide class="gamerInfo__title titleH2" style="cursor: pointer">
          Информация о
          <span>{{ nickname }}</span>
        </h2>
        <div slidebody :data-id="id">
          <div v-if="isCreate" class="gamerInfo__body">
            <div class="gamerInfo__column">
              <div
                  v-for="index in 5"
                  :key="index"
                  class="gamerInfo__item item-gamerInfo"
              >
                <div class="item-gamerInfo__title">
                  {{ itemsName[index - 1][0] }}
                  <AppSmallInfo v-if="itemsName[index - 1].length>2" :html="itemsName[index - 1][2]" />
                </div>
                <div class="item-gamerInfo__description">
                <textarea :id="itemsName[index-1][1].toString()" maxlength="300" placeholder="Введите характеристику"
                          type="text"
                          class="item-gamerInfo__input"></textarea>
                  <!--                  <button class="item-gamerInfo__open">-->
                  <!--                    <img src="/img/icons/lock-closed.png" alt="">-->
                  <!--                  </button>-->
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
                  <AppSmallInfo v-if="itemsName[index + 4].length>2" :html="itemsName[index + 4][2]" />
                </div>
                <div class="item-gamerInfo__description">
                <textarea :id="itemsName[index+4][1].toString()" maxlength="70" placeholder="Введите характеристику"
                          class="item-gamerInfo__input"></textarea>
                  <!--                  <button class="item-gamerInfo__open">-->
                  <!--                    <img src="/img/icons/lock-closed.png" alt="">-->
                  <!--                  </button>-->
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
                  <AppSmallInfo v-if="itemsName[index - 1].length>2" :html="itemsName[index - 1][2]" />
                </div>
                <div class="item-gamerInfo__description">
                  <p class="item-gamerInfo__text">
                    {{ data[itemsName[index - 1][1]].text }}
                  </p>
                  <div v-if="selectedGameData.userData[useSelectedGame().userId] && selectedGameData.userData[useSelectedGame().userId].isAlive"
                       class="item-gamerInfo__lockedFunc">
                    <AppSmallInfo v-if="data[itemsName[index - 1][1]].description"
                                  :html="data[itemsName[index - 1][1]].description" />
                    <button v-if="data.isMVPRefresh===false"
                            @click="selectedGameGameplay.mvpReload($event,itemsName[index - 1][1])"
                            class="item-gamerInfo__reload">
                      <img src="/img/icons/reload.png" alt="">
                    </button>
                    <AppLoader style="max-width: 20px; min-width: 20px; margin: 0 !important;"
                               v-if="data[itemsName[index - 1][1]].isLoading" />
                    <button v-else-if="!data[itemsName[index-1][1]].isOpen"
                            @click="selectedGameGameplay.openChart($event,itemsName[index - 1][1])"
                            class="item-gamerInfo__open">
                      <img src="/img/icons/lock-closed.png" alt="">
                    </button>
                    <button v-else class="item-gamerInfo__open"
                            @click="selectedGameGameplay.openChart($event,itemsName[index - 1][1])">
                      <img src="/img/icons/lock-open.png" alt="">
                    </button>
                  </div>
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
                  <AppSmallInfo v-if="itemsName[index + 4].length>2" :html="itemsName[index + 4][2]" />
                </div>
                <div class="item-gamerInfo__description">
                  <p class="item-gamerInfo__text">
                    {{ data[itemsName[index + 4][1]].text }}
                  </p>
                  <div v-if="selectedGameData.userData[useSelectedGame().userId] && selectedGameData.userData[useSelectedGame().userId].isAlive"
                       class="item-gamerInfo__lockedFunc">
                    <AppSmallInfo v-if="data[itemsName[index + 4][1]].description"
                                  :text="data[itemsName[index + 4][1]].description" />
                    <!--                  {{data[itemsName[index+4][1]]}}-->
                    <button v-if="data.isMVPRefresh===false"
                            @click="selectedGameGameplay.mvpReload($event,itemsName[index+4][1])"
                            class="item-gamerInfo__reload">
                      <img src="/img/icons/reload.png" alt="">
                    </button>
                    <AppLoader style="max-width: 20px; min-width: 20px; margin: 0 !important;"
                               v-if="data[itemsName[index+4][1]].isLoading" />
                    <button v-else-if="!data[itemsName[index+4][1]].isOpen"
                            @click="selectedGameGameplay.openChart($event,itemsName[index+4][1])"
                            class="item-gamerInfo__open">
                      <img src="/img/icons/lock-closed.png" alt="">
                    </button>
                    <button v-else class="item-gamerInfo__open"
                            @click="selectedGameGameplay.openChart($event,itemsName[index+4][1])">
                      <img src="/img/icons/lock-open.png" alt="">
                    </button>
                  </div>
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
              <textarea :id="`spec${item}`" maxlength="150" placeholder="Введите характеристику"
                        class="item-gamerInfo__input"></textarea>
                <!--                <button class="item-gamerInfo__open">-->
                <!--                  <img src="/img/icons/lock-closed.png" alt="">-->
                <!--                </button>-->
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
                <p class="item-gamerInfo__text">{{ data[specItems[item - 1][1]].text }}</p>
                <div v-if="selectedGameData.userData[useSelectedGame().userId] && selectedGameData.userData[useSelectedGame().userId].isAlive"
                     class="item-gamerInfo__lockedFunc">
                  <button v-if="data.isMVPRefresh===false"
                          @click="selectedGameGameplay.mvpReload($event,specItems[item - 1][1])"
                          class="item-gamerInfo__reload">
                    <img v-if="!data[`spec${item}`].isOpen" src="/img/icons/reload.png" alt="">
                  </button>
                  <AppLoader style="max-width: 20px; min-width: 20px;  margin: 0 !important;"
                             v-if="data[specItems[item - 1][1]].isLoading" />
                  <button v-else-if="!data[specItems[item - 1][1]].isOpen"
                          @click="selectedGameGameplay.openChart($event,specItems[item - 1][1])"
                          class="item-gamerInfo__open">
                    <img src="/img/icons/lock-closed.png" alt="">
                  </button>
                  <button v-else class="item-gamerInfo__open"
                          @click="selectedGameGameplay.openChart($event,specItems[item - 1][1])">
                    <img src="/img/icons/lock-open.png" alt="">
                  </button>
                </div>
              </div>
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
    padding-top: 60px;
    margin-right: 20px;
    margin-left: 20px;
    margin-bottom: 0;
    padding-bottom: 50px;

    @media (max-width: $tablet) {
      margin-top: 50px;
      padding-bottom: 45px;
    }
    @media (max-width: $mobile) {
      margin-top: 0;
      padding-top: 45px;
      padding-bottom: 35px;
      display: flex;
      flex-wrap: wrap;
    }
    @media (max-width: $mobileSmall) {
      font-size: 20px;
      padding-top: 35px;
      padding-bottom: 25px;
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

  @media (max-width: $tablet) {
    gap: 30px;
  }

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
    white-space: nowrap;

    @media (max-width: $tablet) {
      white-space: wrap;
    }
    @media (max-width: $mobile) {
      white-space: nowrap;
    }
    @media (max-width: $mobileSmall) {
      white-space: wrap;
      display: flex;
      flex: 0 1 1%;
    }
  }

  &__description {
    display: flex;
    gap: 15px;
    justify-content: flex-end;
    align-items: center;
    flex: 1 1 auto;

    @media (max-width: $tablet) {
      flex: 1 1 auto;
      max-width: 100%;
    }

    .smallInfo {
      margin-left: -8px !important;
    }
  }

  &__text {
    font-weight: 700;
    text-align: end;
  }

  &__lockedFunc {
    display: flex;
    gap: 10px;
    align-items: center;
    justify-content: center;
  }

  &__input {
    background: transparent;
    color: #b4b4b4;
    border: 1px solid;
    display: flex;
    padding: 5px;
    border-radius: 8px;
    max-width: 100%;
    min-width: 100px;
    min-height: 35px;
    max-height: 160px;
    //flex: 0 1 100%;


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