<script setup="">
import { computed, onBeforeMount, onMounted, ref } from "vue";
import AppBackground from "@/components/AppBackground.vue";
import AppButton from "@/components/AppButton.vue";
import axiosInstance from "@/api.js";
import { useMetaStore } from "@/stores/meta.js";
const metaStore = useMetaStore()
metaStore.setTitle('Обновления')

const data = ref([])

const pageNum = ref(0)
const numTabsInPage = ref(5)

const getDataInPage = computed(() => {
  let result = []

  for (let i = 0; i<numTabsInPage.value; i++) {
    const index = i + numTabsInPage.value * pageNum.value
    if (data.value.length>index) {
      result.push(data.value[index])
    }
  }

  return result
})

const getNumAllPages = computed(() => {
  return Math.ceil(data.value.length / numTabsInPage.value)
})

onBeforeMount(async () => {
  try {
    let updateInfoData = await axiosInstance.get('/getUpdateInfo')
    if(updateInfoData.data) {
      data.value = updateInfoData.data
    }
  } catch(e) {
    console.log(e)
  }
})

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
          <h2 class="tab-updates__title" v-html="item.title"></h2>
          <p class="tab-updates__text" v-html="item.text"></p>
          <small class="tab-updates__date" v-html="item.dateText"></small>
        </div>
      </div>
      <div class="pagination-updates" v-if="getNumAllPages>1">
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