<script setup="">
import { computed, onMounted, ref } from "vue";

const data = [
  {
    id: 1,
    title: 'Версия 4.0.1',
    text: "На страницу игры было внедрено описание профессиональных возможностей всех участников, включая вашего игрового персонажа.",
    date: new Date()
  },
  {
    id: 2,
    title: 'Версия 4.0.2',
    text: "На страницу игры было внедрено описание профессиональных возможностей всех участников, включая вашего игрового персонажа.",
    date: new Date()
  },
  {
    id: 3,
    title: 'Версия 4.0.3',
    text: "На страницу игры было внедрено описание профессиональных возможностей всех участников, включая вашего игрового персонажа.",
    date: new Date()
  },
  {
    id: 4,
    title: 'Версия 4.0.4',
    text: "На страницу игры было внедрено описание профессиональных возможностей всех участников, включая вашего игрового персонажа.",
    date: new Date()
  },
  {
    id: 5,
    title: 'Версия 4.0.5',
    text: "На страницу игры было внедрено описание профессиональных возможностей всех участников, включая вашего игрового персонажа.",
    date: new Date()
  },
  {
    id: 6,
    title: 'Версия 4.0.6',
    text: "На страницу игры было внедрено описание профессиональных возможностей всех участников, включая вашего игрового персонажа.",
    date: new Date()
  },
  {
    id: 7,
    title: 'Версия 4.0.7',
    text: "На страницу игры было внедрено описание профессиональных возможностей всех участников, включая вашего игрового персонажа.",
    date: new Date()
  },
  {
    id: 8,
    title: 'Версия 4.0.8',
    text: "На страницу игры было внедрено описание профессиональных возможностей всех участников, включая вашего игрового персонажа.",
    date: new Date()
  },
  {
    id: 9,
    title: 'Версия 4.0.9',
    text: "На страницу игры было внедрено описание профессиональных возможностей всех участников, включая вашего игрового персонажа.",
    date: new Date()
  },
  {
    id: 10,
    title: 'Версия 4.0.10',
    text: "На страницу игры было внедрено описание профессиональных возможностей всех участников, включая вашего игрового персонажа.",
    date: new Date()
  },
  {
    id: 11,
    title: 'Версия 4.0.11',
    text: "На страницу игры было внедрено описание профессиональных возможностей всех участников, включая вашего игрового персонажа.",
    date: new Date()
  },
  {
    id: 12,
    title: 'Версия 4.0.12',
    text: "На страницу игры было внедрено описание профессиональных возможностей всех участников, включая вашего игрового персонажа.",
    date: new Date()
  },
  {
    id: 13,
    title: 'Версия 4.0.13',
    text: "На страницу игры было внедрено описание профессиональных возможностей всех участников, включая вашего игрового персонажа.",
    date: new Date()
  },
  {
    id: 14,
    title: 'Версия 4.0.14',
    text: "На страницу игры было внедрено описание профессиональных возможностей всех участников, включая вашего игрового персонажа.",
    date: new Date()
  },
  {
    id: 15,
    title: 'Версия 4.0.15',
    text: "На страницу игры было внедрено описание профессиональных возможностей всех участников, включая вашего игрового персонажа.",
    date: new Date()
  },
  {
    id: 16,
    title: 'Версия 4.0.16',
    text: "На страницу игры было внедрено описание профессиональных возможностей всех участников, включая вашего игрового персонажа.",
    date: new Date()
  },
  {
    id: 17,
    title: 'Версия 4.0.17',
    text: "На страницу игры было внедрено описание профессиональных возможностей всех участников, включая вашего игрового персонажа.",
    date: new Date()
  },
  {
    id: 18,
    title: 'Версия 4.0.18',
    text: "На страницу игры было внедрено описание профессиональных возможностей всех участников, включая вашего игрового персонажа.",
    date: new Date()
  },
  {
    id: 19,
    title: 'Версия 4.0.19',
    text: "На страницу игры было внедрено описание профессиональных возможностей всех участников, включая вашего игрового персонажа.",
    date: new Date()
  },
  {
    id: 20,
    title: 'Версия 4.0.20',
    text: "На страницу игры было внедрено описание профессиональных возможностей всех участников, включая вашего игрового персонажа.",
    date: new Date()
  },
  {
    id: 21,
    title: 'Версия 4.0.21',
    text: "На страницу игры было внедрено описание профессиональных возможностей всех участников, включая вашего игрового персонажа.",
    date: new Date()
  },
  {
    id: 22,
    title: 'Версия 4.0.22',
    text: "На страницу игры было внедрено описание профессиональных возможностей всех участников, включая вашего игрового персонажа.",
    date: new Date()
  },
  {
    id: 23,
    title: 'Версия 4.0.23',
    text: "На страницу игры было внедрено описание профессиональных возможностей всех участников, включая вашего игрового персонажа.",
    date: new Date()
  },
  {
    id: 24,
    title: 'Версия 4.0.24',
    text: "На страницу игры было внедрено описание профессиональных возможностей всех участников, включая вашего игрового персонажа.",
    date: new Date()
  },
  {
    id: 25,
    title: 'Версия 4.0.25',
    text: "На страницу игры было внедрено описание профессиональных возможностей всех участников, включая вашего игрового персонажа.",
    date: new Date()
  },
  {
    id: 26,
    title: 'Версия 4.0.26',
    text: "На страницу игры было внедрено описание профессиональных возможностей всех участников, включая вашего игрового персонажа.",
    date: new Date()
  },
  {
    id: 27,
    title: 'Версия 4.0.27',
    text: "На страницу игры было внедрено описание профессиональных возможностей всех участников, включая вашего игрового персонажа.",
    date: new Date()
  },
  {
    id: 28,
    title: 'Версия 4.0.28',
    text: "На страницу игры было внедрено описание профессиональных возможностей всех участников, включая вашего игрового персонажа.",
    date: new Date()
  },
  {
    id: 29,
    title: 'Версия 4.0.29',
    text: "На страницу игры было внедрено описание профессиональных возможностей всех участников, включая вашего игрового персонажа.",
    date: new Date()
  },
  {
    id: 30,
    title: 'Версия 4.0.30',
    text: "На страницу игры было внедрено описание профессиональных возможностей всех участников, включая вашего игрового персонажа.",
    date: new Date()
  },
  {
    id: 31,
    title: 'Версия 4.0.31',
    text: "На страницу игры было внедрено описание профессиональных возможностей всех участников, включая вашего игрового персонажа.",
    date: new Date()
  },
  {
    id: 32,
    title: 'Версия 4.0.32',
    text: "На страницу игры было внедрено описание профессиональных возможностей всех участников, включая вашего игрового персонажа.",
    date: new Date()
  },
  {
    id: 33,
    title: 'Версия 4.0.33',
    text: "На страницу игры было внедрено описание профессиональных возможностей всех участников, включая вашего игрового персонажа.",
    date: new Date()
  },
  {
    id: 34,
    title: 'Версия 4.0.34',
    text: "На страницу игры было внедрено описание профессиональных возможностей всех участников, включая вашего игрового персонажа.",
    date: new Date()
  },
  {
    id: 35,
    title: 'Версия 4.0.35',
    text: "На страницу игры было внедрено описание профессиональных возможностей всех участников, включая вашего игрового персонажа.",
    date: new Date()
  },
  {
    id: 36,
    title: 'Версия 4.0.36',
    text: "На страницу игры было внедрено описание профессиональных возможностей всех участников, включая вашего игрового персонажа.",
    date: new Date()
  },
  {
    id: 37,
    title: 'Версия 4.0.37',
    text: "На страницу игры было внедрено описание профессиональных возможностей всех участников, включая вашего игрового персонажа.",
    date: new Date()
  },
  {
    id: 38,
    title: 'Версия 4.0.38',
    text: "На страницу игры было внедрено описание профессиональных возможностей всех участников, включая вашего игрового персонажа.",
    date: new Date()
  },
  {
    id: 39,
    title: 'Версия 4.0.39',
    text: "На страницу игры было внедрено описание профессиональных возможностей всех участников, включая вашего игрового персонажа.",
    date: new Date()
  },
  {
    id: 40,
    title: 'Версия 4.0.40',
    text: "На страницу игры было внедрено описание профессиональных возможностей всех участников, включая вашего игрового персонажа.",
    date: new Date()
  },
  {
    id: 41,
    title: 'Версия 4.0.41',
    text: "На страницу игры было внедрено описание профессиональных возможностей всех участников, включая вашего игрового персонажа.",
    date: new Date()
  },
  {
    id: 42,
    title: 'Версия 4.0.42',
    text: "На страницу игры было внедрено описание профессиональных возможностей всех участников, включая вашего игрового персонажа.",
    date: new Date()
  },
  {
    id: 43,
    title: 'Версия 4.0.43',
    text: "На страницу игры было внедрено описание профессиональных возможностей всех участников, включая вашего игрового персонажа.",
    date: new Date()
  },
  {
    id: 44,
    title: 'Версия 4.0.44',
    text: "На страницу игры было внедрено описание профессиональных возможностей всех участников, включая вашего игрового персонажа.",
    date: new Date()
  },
  {
    id: 45,
    title: 'Версия 4.0.45',
    text: "На страницу игры было внедрено описание профессиональных возможностей всех участников, включая вашего игрового персонажа.",
    date: new Date()
  },
  {
    id: 46,
    title: 'Версия 4.0.46',
    text: "На страницу игры было внедрено описание профессиональных возможностей всех участников, включая вашего игрового персонажа.",
    date: new Date()
  },
  {
    id: 47,
    title: 'Версия 4.0.47',
    text: "На страницу игры было внедрено описание профессиональных возможностей всех участников, включая вашего игрового персонажа.",
    date: new Date()
  },
  {
    id: 48,
    title: 'Версия 4.0.48',
    text: "На страницу игры было внедрено описание профессиональных возможностей всех участников, включая вашего игрового персонажа.",
    date: new Date()
  },
  {
    id: 49,
    title: 'Версия 4.0.49',
    text: "На страницу игры было внедрено описание профессиональных возможностей всех участников, включая вашего игрового персонажа.",
    date: new Date()
  },
  {
    id: 50,
    title: 'Версия 4.0.50',
    text: "На страницу игры было внедрено описание профессиональных возможностей всех участников, включая вашего игрового персонажа.",
    date: new Date()
  },
]

const pageNum = ref(0)
const numTabsInPage = ref(5)

const getDataInPage = computed(() => {
  let result = []

  for (let i = 0; i<numTabsInPage.value; i++) {
    const index = i + numTabsInPage.value * pageNum.value
    if (data.length>index) {
      result.push(data[index])
    }
  }

  return result
})

const getNumAllPages = computed(() => {
  return Math.ceil(data.length / numTabsInPage.value)
})

import AppBackground from "@/components/AppBackground.vue";
import AppButton from "@/components/AppButton.vue";
</script>

<template>
  <main class="updates paddingTop">
    <AppBackground img-name="updates.jpg" />

    <div class="updates__container">
      <h1 class="updates__title titleH1">Обновления</h1>
      <div class="updates__body">
        <div class="tab-updates linear-border gold"
             v-for="item in getDataInPage"
             :key="item.id"
        >
          <h2 class="tab-updates__title">{{ item.title }}</h2>
          <p class="tab-updates__text">{{ item.text }}</p>
          <small class="tab-updates__date">{{ item.date.toLocaleDateString() }}</small>
        </div>
      </div>
      <div class="pagination-updates">
        <AppButton
            color="gold"
            :border="index-1!==pageNum"
            v-for="index in getNumAllPages"
            :key="index"
            @click="pageNum=index-1"
        >
          {{ index }}
        </AppButton>
      </div>
    </div>
  </main>
</template>

<style scoped lang="scss">
.updates {
  position: relative;

  &__container {
  }

  &__title {
  }

  &__body {
  }
}
.tab-updates {
  margin-bottom: 40px;
  padding: 35px 30px;

  &__title {
    font-size: 20px;
    font-weight: 700;
    line-height: 1.5;
    margin-bottom: 20px;
  }

  &__text {
    font-size: 14px;
    line-height: 1.8;
    margin-bottom: 20px;
  }

  &__date {
    font-size: 11px;
    font-weight: 600;
  }
}
.pagination-updates {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;

  button {
    width: 40px;
    height: 40px;
    max-width: 40px;
    max-height: 40px;
  }
}

</style>