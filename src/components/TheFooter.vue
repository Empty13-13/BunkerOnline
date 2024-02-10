<script setup="">

</script>

<template>
  <footer class="footer">
    <div class="footer__wrapper">
      <img src="/img/backgrounds/footer.jpg" alt="">
      <img src="/img/backgrounds/up-shadow-footer.svg" alt="">
    </div>
    <div class="footer__upShadow">
    </div>
    <div class="footer__container">
      <h2 class="footer__title titleH2">Игра «Бункер Онлайн!»</h2>
      <div class="footer__body">
        <p class="footer__text">
          Игра «Бункер Онлайн!» - невероятно атмосферная игра с великолепной нарративной частью. Это уникальная
          возможность испытать на себе наступление апокалипсиса и проверить свои переговорные и дедуктивные навыки,
          чтобы выжить! Игра сразу же погружает вас и вашу компанию в игру "с головой".<br>
          Интересные катаклизмы и характеристики персонажей делают игровой процесс еще более насыщенным. Игра также
          производит определенный терапевтический эффект, ведь обсуждая как пережить катастрофу, мир за окном будет
          казаться относительно прекрасным. Игра способна тревожить душу, заставляя переживать и сочувствовать. Пройдя в
          бункер игроки получат невероятное удовольствие. Выжившие от того, что смогли проникнуть в бункер, а другие от
          общего процесса игры.<br>
          <br>
          С помощью нашего сайта вы можете играть в «Бункер Онлайн!» не выходя из дома, или же с друзьями за чашкой кофе
          в небольшом уютном кафе своего города! Наша цель — сделать игру еще более атмосферной, и максимально
          интересной для каждого игрока!
        </p>
        <div class="footer__images">
          <img src="/img/footer/12.jpg" alt="">
          <img src="/img/footer/online.jpg" alt="">
        </div>
      </div>
      <div class="footer__down down-footer ">
        <p class="down-footer__copy">© 2020-2023 Все права защищены. Копирование материалов сайта запрещено</p>
        <router-link class="down-footer__cookie" to="/cookie">Соглашение о cookie</router-link>
      </div>
    </div>
  </footer>
</template>

<style lang="scss">
@import "@/assets/scss/style";

.footer {
  position: relative;
  padding-bottom: 50px;
  padding-top: 150px;

  @media (max-width: $pc) {
    padding-top: 135px;
  }
  @media (max-width: $tablet) {
    padding-top: 115px;
  }
  @media (max-width: $mobile) {
    padding-top: 95px;
  }
  @media (max-width: $mobileSmall) {
    padding-top: 75px;
  }

  &__wrapper {
    position: absolute;
    left: 0;
    bottom: 0;
    width: 100%;
    height: 100%;
    z-index: -1;

    img {
      position: absolute;
      left: 0;
      bottom: 0;
      width: 100%;
      height: 1024px;
      object-fit: cover;

      @media (max-width: $mobile) {
        height: 1075px;
      }

      &:nth-child(2) {
        //height: 70% !important;
      }
    }
  }

  &__container {
    position: relative;
    z-index: 3;
  }

  &__title {
  }

  &__body {
  }

  &__text {
    font-size: 14px;
    line-height: 1.8;
    text-align: center;
    max-width: 1050px;
    margin: 0 auto;
    margin-bottom: 50px;
  }

  &__images {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 30px;
    margin-bottom: 100px;
    
    @media (max-width: $pc) {
      margin-bottom: 90px;
    }
    @media (max-width:$tablet){
       margin-bottom: 80px;
    }
    @media (max-width: $mobile) {
       margin-bottom: 60px;
    }
    @media (max-width: $mobileSmall) {
       margin-bottom: 50px;
    }
  }
}

.down-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  text-align: center;

  @media (max-width:760px){
    flex-direction: column;
    gap: 15px;
  }

  &__copy {
  }

  &__cookie {
    text-decoration: underline !important;

    &:hover{
      text-decoration: none !important;;
    }
  }
}

</style>