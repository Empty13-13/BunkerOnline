<script setup="">
import { onMounted, ref } from "vue";
import axiosInstance from "@/api.js";
import { usePreloaderStore } from "@/stores/preloader.js";
import { useOtherTextsStore } from "@/stores/otherTexts.js";

const globalPreloader = usePreloaderStore()
const otherTexts = useOtherTextsStore()

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
        <p class="wiki__description" v-html="otherTexts.allTexts['wiki:text']">
        </p>
        <ul>
          <li>
            <router-link to="/test" class="wiki__link colorGold">Тест "Оценка выживаемости бункера"</router-link>
          </li>
          <li>
            <router-link to="/wiki/professional-abilities" class="wiki__link colorGold">Профессиональные возможности</router-link>
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