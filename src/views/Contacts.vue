<script setup="">

</script>

<template>
  <div class="contacts paddingTop">
    <div class="contacts__container">
      <h1 class="contacts__title titleH1">Контакты</h1>
      <div class="contacts__body">
        <a target="_blank" class="block-contacts linear-border gold">
          <div class="block-contacts__img">
            <img src="/img/icons/telegram.png" alt="">
          </div>
          <div class="block-contacts__column">
            <h2 class="block-contacts__title">Telegram</h2>
            <p class="block-contacts__text">Перейти</p>
          </div>
        </a>
        <a target="_blank" class="block-contacts linear-border gold">
          <div class="block-contacts__img">
            <img src="/img/icons/discord.png" alt="">
          </div>
          <div class="block-contacts__column">
            <h2 class="block-contacts__title">Discord</h2>
            <p class="block-contacts__text">Перейти</p>
          </div>
        </a>
        <a target="_blank" class="block-contacts linear-border gold">
          <div class="block-contacts__img">
            <img src="/img/icons/email.png" alt="">
          </div>
          <div class="block-contacts__column">
            <h2 class="block-contacts__title">Электронная почта</h2>
            <p class="block-contacts__text">contact@bunker-online.com</p>
          </div>
        </a>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.contacts {

  &__container {
  }

  &__title {
    margin-bottom: 50px;
  }

  &__body {
    display: grid;
    grid-template-columns: 1fr 1fr 2fr;
    gap: 30px;

    @media (max-width: 1000px) {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      align-items: center;
    }
    @media (max-width: 550px) {
      flex-direction: column;
    }
  }
}
.block-contacts {
  padding: 35px 25px;
  display: flex;
  align-items: center;
  cursor: pointer;
  transition: background-filter 0.2s ease;

  @media (max-width:550px){
    width: 100%;
    justify-content: center;
  }

  &:hover{
    backdrop-filter: blur(110px);
  }

  &__img {
    width: 40px;
    display: flex;
    justify-content: center;
    align-items: center;
    margin-right: 15px;
  }

  &__column {
  }

  &__title {
    font-size: 14px;
    margin-bottom: 10px;
  }

  &__text {
    font-size: 20px;
    font-weight: 700;
    line-height: 1.5;

    @media (max-width:500px){
      font-size: 15px;
    }
  }
}

</style>