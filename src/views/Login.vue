<script setup="">
import { useAccessStore } from "@/stores/counter.js";

const access = useAccessStore()

import AppBackground from "@/components/AppBackground.vue";
import AppButton from "@/components/AppButton.vue";
</script>

<template>
  <main class="authBlock">
    <AppBackground class="backgroundAuth" img-name="profile.jpg" />
    <div class="authBlock__container">
      <h1 class="authBlock__title">Вход и регистрация</h1>
      <div class="authBlock__body">
        <div class="authBlock__login login-authBlock linear-border gold">
          <div class="login-authBlock__body">
            <h2 class="login-authBlock__title">Вход</h2>
            <form action="" class="login-authBlock__form authBlock-form">
              <input placeholder="Ваш ник" type="text" name="nickname" maxlength="15">
              <input placeholder="Пароль" type="password" name="password">
              <div>
                <p>Войти с помощью</p>
                <span>
                  <AppButton color="purple" icon-name="discord.png" />
                  <AppButton icon-name="vk.png" />
                </span>
              </div>
              <AppButton @click="$router.push(`/profile=${access.id}`)" color="gold">Войти</AppButton>
            </form>
          </div>
        </div>
        <div class="authBlock__reg login-authBlock linear-border gold">
          <div class="login-authBlock__body">
            <h2 class="login-authBlock__title">Регистрация</h2>
            <form action="" class="login-authBlock__form authBlock-form">
              <input placeholder="Ваш ник" type="text" name="nickname" maxlength="15">
              <input placeholder="Электронная почта" type="email" name="nickname" maxlength="15">
              <input placeholder="Пароль" type="password" name="password">
              <input placeholder="Подтвердите пароль" type="password" name="passwordRepeat">
              <div>
                <p>Войти с помощью</p>
                <span>
                  <AppButton color="purple" icon-name="discord.png" />
                  <AppButton icon-name="vk.png" />
                </span>
              </div>
              <AppButton @click="$router.push(`/profile=${access.id}`)" color="gold">Регистрация</AppButton>
            </form>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>

<style lang="scss">
@import "@/assets/scss/style";

.authBlock + footer {
  .footer__wrapper {
    img {
      height: 750px !important;
    }
  }
}

.authBlock {
  margin-top: 130px;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 100px;

  @media (max-width: $tablet) {
    margin-top: 80px;
  }

  &__container {
  }

  &__title {
    font-weight: 700;
    font-size: 30px;
    margin-bottom: 50px;
    text-align: center;
    background: linear-gradient(90deg, #F9D35B, #D96613);
    background-clip: border-box;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;

    @media (max-width: $pc) {
      font-size: 27px;
      margin-bottom: 45px;
    }
    @media (max-width: $tablet) {
      font-size: 25px;
      margin-bottom: 40px;
    }
    @media (max-width: $mobile) {
      font-size: 22px;
      margin-bottom: 35px;
    }
    @media (max-width: $mobileSmall) {
      font-size: 20px;
      margin-bottom: 30px;
    }
  }

  &__body {
    display: flex;
    align-items: flex-start;
    gap: 30px;
    width: 100%;

    @media (max-width:$tablet){
      flex-direction: column;
      align-items:center;
    }
  }
}

.login-authBlock {
  padding: 35px 80px;
  max-width: 511px;
  
  @media (max-width: $pc) {
    padding: 35px 60px;
  }
  @media (max-width:$tablet){
     padding: 35px 50px;
  }
  @media (max-width: $mobile) {
     padding: 35px 30px;
  }
  @media (max-width: $mobileSmall) {
     padding: 35px 20px;
  }

  &__body {
  }

  &__title {
    text-align: center;
    font-size: 20px;
    font-weight: 700;
    margin-bottom: 30px;

    @media (max-width: $mobile) {
      margin-bottom: 20px;
    }
  }
}

.authBlock-form {
  input {
    padding: 14px 15px;
    background: #60606065;
    color: $fontColor;
    border-radius: 5px;
    margin-bottom: 15px;
    width: 100%;
  }

  div {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin: 20px 0;

    span {
      display: flex;
      gap: 15px;
    }

    button {
      width: 35px;
      height: 35px;
      background: #0077FF;

      &:hover {
        background: #519df6;
      }

      .img {
        display: flex;
        justify-content: center;
        align-items: center;

        img {
          max-width: 18px;
        }
      }
    }
  }

  & > .btn {
    width: 100%;
    font-size: 11px;
    font-weight: 600;
    padding: 14px;
  }
}


</style>