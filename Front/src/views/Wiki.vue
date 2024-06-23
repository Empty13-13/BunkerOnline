<script setup="">
import { onMounted, ref } from "vue";
import axiosInstance from "@/api.js";
import { usePreloaderStore } from "@/stores/preloader.js";

const globalPreloader = usePreloaderStore()

const links = ref([])

onMounted(async () => {
  globalPreloader.activate()
  try {
    let linksData = await axiosInstance.get('/wikiList')
    links.value = linksData.data
  } catch(e) {

  }
  globalPreloader.deactivate()
})

</script>

<template>
  <main class="wiki paddingTop">
    <div class="wiki__container ">
      <h1 class="wiki__title titleH1">Добро пожаловать на Bunker Online вики!</h1>
      <div class="wiki__body">
        <p class="wiki__description">
          Добро пожаловать на Bunker Online вики! <br>
          Это энциклопедия, посвящённая игре «Бункер Онлайн!»! <br>
          Здесь вы
          найдете всю детальную информацию об игровых элементах, таких как, например, характеристики и что они означают.<br>
          Также вы будете иметь полное представление о том, что за болезнь у вашего персонажа, на сколько это опасно и
          т.д. <br>
          Категории:
        </p>
        <ul>
          <li>
            <router-link to="/wiki/professions" class="wiki__link colorGold">Профессиональные возможности</router-link>
          </li>
          <li
              v-for="link in links"
              :key="link.link"
          >
            <router-link :to="`/wiki/${link.link}`" class="wiki__link colorGold">{{ link.title }}</router-link>
          </li>
        </ul>
      </div>
    </div>
  </main>
</template>

<style scoped lang="scss">
.wiki {

  &__container {

  }

  &__title {
  }

  &__body {
    display: flex;
    flex-direction: column;
  }

  &__description {
    margin-bottom: 20px;
    font-size: 14px;
    line-height: 1.8;
  }

  &__link {
    display: inline-block;
    line-height: 2.5;
    font-weight: 700;
    text-decoration: underline;
    color: rgb(249, 211, 91);

    &:hover {
      text-decoration: none;
    }
  }
}
</style>