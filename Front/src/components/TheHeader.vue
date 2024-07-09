<script setup>
import AppButton from "@/components/AppButton.vue";
import { computed, onBeforeMount, onMounted, onUnmounted, ref } from "vue";
import router from "@/router/index.js";
import { useAccessStore } from "@/stores/counter.js";
import { useAuthStore } from "@/stores/auth.js";
import { useMyProfileStore } from "@/stores/profile.js";
import { getClassForAccess, getId, getLinkParams } from "@/plugins/functions.js";
import AppAvatar from "@/components/AppAvatar.vue";
import { showConfirmBlock } from "@/plugins/confirmBlockPlugin.js";
import { useAuthSocketStore } from "@/stores/socket/authSocket.js";

const authStore = useAuthStore()
const myProfile = useMyProfileStore()
const access = useAccessStore()
const authSocket = useAuthSocketStore()

const isOpen = ref(false)
const header = ref(null)
let oldScrollY = 0

onBeforeMount(() => {

})
onMounted(async () => {
  window.addEventListener('scroll', headerScroll)
})
onUnmounted(() => {
  window.removeEventListener('scroll', headerScroll)
})

async function logout(e) {
  showConfirmBlock(e.target,async () => {
    authSocket.emit('logout')
    authSocket.close()
    await authStore.logoutUser()
    isOpen.value = false
  },'Вы уверены, что хотите выйти из аккаунта?')

}

function headerScroll() {
  const contentHide = () => header.value.classList.contains('_hide')

  if (scrollY>oldScrollY && !contentHide() && scrollY>300) {
    header.value.classList.add('_hide')
  }
  else if (scrollY<oldScrollY && contentHide()) {
    header.value.classList.remove('_hide')
  }
  oldScrollY = scrollY
}
</script>

<template>
  <header ref="header" class="header">
    <div class="header__container">
      <div class="header__body">
        <div class="header__block">
          <router-link to="/" class="header__logo">
            <img src="/img/logo-header.png" alt="">
            <div class="text">
              Bunker<br>
              Online
            </div>
          </router-link>
        </div>
        <div class="header__block right">
          <div class="header__menu menu">
            <button type="button" class="menu__icon icon-menu"
                    @click="isOpen=!isOpen" :class="{'menu-open':isOpen}"
            >
              <span></span>
            </button>
            <nav class="menu__body" :class="{'menu-open':isOpen}">
              <ul class="menu__list">
                <li class="menu__item">
                  <router-link @click="isOpen=false" to="/rules" class="menu__link">Правила игры</router-link>
                </li>
                <li class="menu__item">
                  <router-link @click="isOpen=false" to="/wiki" class="menu__link">Вики</router-link>
                </li>
                <li class="menu__item">
                  <router-link @click="isOpen=false" to="/contacts" class="menu__link">Контакты</router-link>
                </li>
                <li class="menu__item">
                  <router-link @click="isOpen=false" to="/updates" class="menu__link">Обновления</router-link>
                </li>
              </ul>
              <div class="header__socials socials-header">
                <a target="_blank" href="" class="socials-header__item discord">
                  <img src="/img/icons/discord.png" alt="">
                </a>
                <a target="_blank" href="" class="socials-header__item telegram">
                  <img src="/img/icons/telegram.svg" alt="">
                </a>
<!--                <a target="_blank" href="" class="socials-header__item vk">-->
<!--                  <img src="/img/icons/vk.svg" alt="">-->
<!--                </a>-->
              </div>
              <div v-if="myProfile.isReg" v-adaptive="['.menu__body',992,0]"
                   class="header__authorization authorization-header">
                <router-link @click="isOpen=false" :to="`/profile=${myProfile.id}`" class="authorization-header__img">
                  <AppAvatar :color="myProfile.access" v-model:href="myProfile.avatarName" />
                </router-link>
                <router-link @click="isOpen=false" :to="`/profile=${myProfile.id}`" class="authorization-header__name"
                             :title="myProfile.nickname">
                  {{ myProfile.nickname }}
                </router-link>
                <AppButton @click="logout" class="authorization-header__exit" icon-name="door.svg"></AppButton>
              </div>
              <div v-else @click="isOpen=false" v-adaptive="['.menu__body',992,0]" class="header__login login-header">
                <AppButton class="login-header__btn" @click="router.push('/login')" color="gold">
                  Вход | Регистрация
                </AppButton>
              </div>
            </nav>
          </div>
        </div>
      </div>
    </div>
  </header>
</template>

<style lang="scss">
@import "@/assets/scss/style";

.header {
  position: fixed;
  left: 0;
  top: 0;
  width: 100%;
  max-height: 100px;
  z-index: 15;
  background-color: rgba(0, 0, 0, 0.5);

  @media (min-width: $tablet) {
    backdrop-filter: blur(10px);
  }

  @media (max-width: $tablet) {
    transition: top 0.3s ease;

    &._hide {
      top: -100%;

      .icon-menu {
        top: -100%;
      }

    }
  }

  &__body {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin: 32px 0;
    max-height: 38px;

    @media (max-width: $tablet) {
      margin: 15px 0;
    }

  }

  &__logo {
    display: flex;
    align-items: center;
    position: relative;
    z-index: 16;

    img {
      margin-right: 15px;
    }

    .text {
      font-family: Scribble Serif;
      font-size: 20px;
      text-transform: uppercase;
    }
  }
}

.header__block.right {
  display: flex;
  align-items: center;
  flex: 0 1 75%;
  justify-content: inherit;
  gap: 15px;

  @media (max-width: 1140px) {
    flex: 0 1 70%;
  }
  @media (max-width: 1040px) {
    flex: 0 1 80%;
  }
}

.menu {
  flex: 1 1 auto;

  &__body {
    display: flex;
    flex: 1 1 100%;
    justify-content: space-around;
    gap: 40px;
    @media (max-width: $pc) {
      gap: 30px;
    }

    @media (max-width: $tablet) {
      position: fixed;
      left: 10%;
      top: 0;
      width: 100%;
      height: 100%;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      opacity: 0;
      transition: opacity 0.3s ease, left 0.3s ease;
      pointer-events: none;

      &::before {
        content: '';
        background: rgba(0, 0, 0, 95%);
        position: fixed;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        z-index: -1;
      }

      &.menu-open {
        opacity: 1;
        left: 0;
        pointer-events: auto;
      }
    }
  }

  &__list {
    flex: 1 1 auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;

    @media (max-width: $tablet) {
      flex-direction: column;
      flex: 0 0 auto;
      margin-bottom: 30px;
    }
  }

  &__item {
    &:hover {
      .menu__link::before {
        left: 0;
        opacity: 1;
      }
    }
  }

  &__link {
    position: relative;
    padding: 10px;
    text-align: center;
    display: flex;
    background: $fontColor;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    white-space: nowrap;
    font-size: 12px;
    font-weight: 600;
    //transition: background 0.3s ease 0s,-webkit-background-clip 0.3s ease 0s;

    @media (max-width: $tablet) {
      font-size: 16px;
      opacity: 0.8;
    }

    &.router-link-active {
      background: $goldColor;
      -webkit-background-clip: text;
    }

    &:hover {
      background: $goldColorHover;
      -webkit-background-clip: text;
    }
  }
}

.socials-header {
  display: flex;
  align-items: center;
  justify-content: center;
  @include adaptiveValue("margin-left", 50, 0, 1330, 1140);

  &__item {
    border-radius: 6px;
    display: flex;
    justify-content: center;
    align-items: center;
    width: 35px;
    height: 35px;
    margin-right: 30px;

    &:last-child {
      margin-right: 0;
    }

    transition: background 0.2s ease;

    &.discord {
      background: $purpleColor;

      img {
        max-width: 19px;
      }

      &:hover {
        background: $purpleColorHover;
      }
    }

    &.telegram {
      background: $whiteBlueColor;

      &:hover {
        background: $whiteBlueHover;
      }
    }

    &.vk {
      background: $blueColor;

      &:hover {
        background: $blueHover;
      }
    }
  }
}

.authorization-header {
  flex: 0 0 190px;
  display: flex;
  justify-content: center;
  align-items: center;

  @media (max-width: $tablet) {
    flex: 0 0 auto;
  }

  &__img {
    margin-right: 15px;
    border-radius: 50%;
    //background: $goldColor;
    width: 35px;
    height: 35px;
    display: flex;
    justify-content: center;
    align-items: center;
    transition: box-shadow 0.2s ease;

    &:hover {
      box-shadow: 0px 5px 30px 0px rgba(217, 102, 19, 0.7);
    }

    .avatar {
      width: 100%;
      height: 100%;
    }
  }

  &__name {
    text-align: left;
    margin-right: 15px;
    max-width: 90px;
    line-height: 1.2;

    display: -webkit-box;
    -webkit-line-clamp: 2; // количество строк
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  &__exit {
    width: 35px;
    height: 35px;
    max-width: 35px;

    &>* {
      pointer-events: none;
    }
  }
}

.login-header {
  &__btn {
    padding: 10px 38px;
    line-height: 100%;
    font-weight: 600;
    font-size: rem(11);
  }
}

//Burger
.icon-menu {
  display: none;
  @media (max-width: $tablet) {
    display: block;
    position: fixed;
    right: 10px;
    top: 27px;
    width: rem(26);
    height: rem(18);
    cursor: pointer;
    background: inherit;
    z-index: 5;
    transition: top 0.3s ease;

    span,
    &::before,
    &::after {
      content: "";
      transition: all 0.3s ease 0s;
      right: 0;
      position: absolute;
      width: 100%;
      height: rem(2);
      background-color: $fontColor;
    }
    &::before {
      top: 0;
    }
    &::after {
      bottom: 0;
      width: 80%;
    }
    span {
      top: calc(50% - rem(1));
      width: 50%;
    }
    &.menu-open {
      span {
        width: 0;
      }

      &::before,
      &::after {
      }

      &::before {
        top: calc(50% - rem(1));
        transform: rotate(-45deg);
      }

      &::after {
        bottom: calc(50% - rem(1));
        transform: rotate(45deg);
        width: 100%;
      }
    }
  }
}

</style>