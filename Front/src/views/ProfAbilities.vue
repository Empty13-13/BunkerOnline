<script setup="">
import { useOtherTextsStore } from "@/stores/otherTexts.js";
import { computed, onBeforeMount, ref } from "vue";
import axiosInstance from "@/api.js";
import { usePreloaderStore } from "@/stores/preloader.js";

const otherTexts = useOtherTextsStore()
const globalPreloader = usePreloaderStore()

const inputModel = ref('')

const list = ref([])
const getResultList = computed(() => {
  let inputValue = inputModel.value
  if (!inputValue.length>0) {
    return list.value
  }
  else {
    return list.value.reduce((old, item) => {
      let check = false
      let newItem = {}
      Object.assign(newItem, item)
      if (newItem.title.toString().toLowerCase().includes(inputValue.toLocaleLowerCase())) {
        check = true
        newItem.title = newItem.title.replace(eval('/' + inputValue + '/gi'), `<mark>${inputValue}</mark>`)
      }
      if (newItem.description.toString().toLocaleLowerCase().includes(inputValue.toLocaleLowerCase())) {
        check = true
        newItem.description = newItem.description.replace(eval('/' + inputValue + '/gi'), `<mark>${inputValue}</mark>`)
      }
      if (check) {
        old.push(newItem)
      }
      return old
    }, [])
  }
})

onBeforeMount(async () => {
  try {
    globalPreloader.activate()
    let baseProfData = await axiosInstance.get('/getBaseProfession')
    if(baseProfData.data) {
      list.value = baseProfData.data
    }
  } catch(e) {
    console.log('Ошибка при попытке взять профессии')
  } finally {
    globalPreloader.deactivate()
  }
})
</script>

<template>
  <div class="profAbilities paddingTop">
    <div class="profAbilities__container">
      <h1 class="profAbilities__title titleH1">Профессиональные возможности</h1>
      <p class="profAbilities__subText" v-html="otherTexts.allTexts['professionalAbilities:text']">
      </p>
      <div class="profAbilities__body">
        <div class="profAbilities__inputBlock">
          <input type="text" name="profName" placeholder="Поиск специальности..." v-model.trim="inputModel">
        </div>
        <div class="profAbilities__list">
          <ul>
            <li>
              <h3 class="profAbilities__item-title _title">Профессия</h3>
              <p class="profAbilities__item-description _title">Возможности</p>
            </li>
            <li
                v-if="getResultList.length"
                v-for="(item,index) in getResultList"
                :key="index"
            >
              <h3 class="profAbilities__item-title" v-html="item.title"></h3>
              <p class="profAbilities__item-description" v-html="item.description"></p>
            </li>
            <li v-else>
              <h3 class="profAbilities__item-title">Результатов нет</h3>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss">
.profAbilities {
  &__container {
  }

  &__title {
  }

  &__subText {
    font-size: 14px;
    line-height: 1.8;
  }

  &__body {
    margin-top: 40px;
  }

  &__inputBlock {
    width: 100%;
    margin-bottom: 20px;

    input {
      width: 100%;
      font-size: 13px;
      padding: 15px;
    }
  }

  &__list {
    background: black;
    border-radius: 8px;

    ul {
      li{
        display: grid;
        grid-template-columns: 30fr 80fr;
        padding: 15px;
        gap: 15px;

        //border-bottom: 1px solid rgba(255,255,255,0.3);
        //&:last-child{
        //  border-bottom: none;
        //}

        &:nth-child(even) {
          background: #2d2d2d;
        }
      }
    }

    mark {
      background: #f3c156;
    }
  }

  &__item-title {
    display: flex;
    align-items: center;

    &._title {
      font-weight: 700;
    }
  }

  &__item-description {
    &._title {
      font-weight: 700;
    }
  }
}
</style>