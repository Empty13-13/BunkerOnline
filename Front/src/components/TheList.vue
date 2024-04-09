<script setup="">
defineProps(['data','title'])
</script>

<template>
  <div v-if="data && data.length" class="list linear-border white smallBorder">
    <div class="list__body">
      <h3 class="list__title">{{ title }}</h3>
      <ul class="list__ul">
        <li v-for="item in data" class="list__item item-list">
          <div class="item-list__body">
            <div class="item-list__title">{{ item.nickname }}</div>
            <router-link v-if="item.idRoom" :to="`game=${item.idRoom}`" class="item-list__link">Смотреть</router-link>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>

<style lang="scss">
.list {
  position: relative;

  &__body {
    padding: 22px 18px;
    position: relative;
    z-index: 5;
  }

  &__title {
    font-weight: bold;
    margin-bottom: 25px;
  }

  &__ul {
    overflow-y: auto;
    max-height: 233px;
  }
}
.item-list {
  padding-bottom: 12px;
  margin-right: 23px;
  margin-bottom: 13px;
  position: relative;
  border-radius: 6px;

  &::before {
    content: '';
    position: absolute;
    left: 0;
    bottom: 0;
    width: 100%;
    height: 1px;
    background: #696969;
  }
  
  &:last-child{
    margin-bottom: 0;
    &::before {
      display: none;
    }
  }

  &__body {
    display: grid;
    grid-template-columns: 25fr 77fr;
    gap: 28px;
  }

  &__title {
    color: #b4b4b4;
  }

  &__link {
    color: #696969;

    &:hover{
      color: white;
    }
  }
}

</style>