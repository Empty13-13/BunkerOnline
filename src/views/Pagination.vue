<script setup="">
import { useAccessStore } from "@/stores/counter.js";

const access = useAccessStore()

function setNoreg(event, isStarted = false) {
  access.level = 'noreg'
  access.id = 123
  access.loginId = 123
  console.log(isStarted)
  access.isStarted = isStarted
}


function setReg(event, isStarted = false, loginId = 313) {
  access.level = 'vip'
  access.id = 313
  access.loginId = loginId
  console.log(loginId)
  access.isStarted = isStarted
}

function setAdmin(event, isStarted = false, loginId = 313) {
  access.level = 'admin'
  access.id = 313
  access.loginId = loginId
  console.log(loginId)
  access.isStarted = isStarted
}

</script>

<template>
  <main class="pagination">
    <h1>Незарегистрированный пользователь</h1>
    <router-link @click="setNoreg" to="/home">Главная страница</router-link>
    <router-link @click="setNoreg" to="/game=123">Комната ожидания</router-link>
    <router-link @click="setNoreg($event,true)" to="/game=123">Игра</router-link>
    <router-link @click="setNoreg" to="/profile=313">Профиль другого пользователя</router-link>

    <h1>Зарегистрированный пользователь</h1>
    <router-link @click="setReg" to="/home">Главная страница</router-link>
    <router-link @click="setReg" to="/game=123">Комната ожидания</router-link>
    <router-link @click="setReg($event,true)" to="/game=123">Игра</router-link>
    <router-link @click="setReg($event,false,123)" to="/profile=313">Личный профиль игрока</router-link>
    <router-link @click="setReg($event,false,313)" to="/profile=123">Профиль другого пользователя</router-link>

    <h1>Админ</h1>
    <router-link @click="setAdmin" to="/home">Главная страница</router-link>
    <router-link @click="setAdmin" to="/game=123">Комната ожидания</router-link>
    <router-link @click="setAdmin($event,true)" to="/game=123">Игра</router-link>
    <router-link @click="setAdmin($event,false,123)" to="/profile=313">Личный профиль игрока</router-link>
    <router-link @click="setAdmin($event,false,313)" to="/profile=123">Профиль другого пользователя</router-link>

    <h1>Другие страницы</h1>
    <router-link to="/wiki">Вики</router-link>
    <router-link to="/updates">Обновления</router-link>
    <router-link to="/rules">Правила</router-link>
    <router-link to="/contacts">Контакты</router-link>
  </main>
</template>

<style scoped lang="scss">
.pagination {
  padding: 50px;
  display: flex;
  flex-direction: column;

  h1 {
    font-size: 20px;
    margin-bottom: 20px;
  }

  a {
    text-decoration: underline;
    margin-bottom: 10px;

    &:hover {
      text-decoration: none;
    }
  }
}
</style>