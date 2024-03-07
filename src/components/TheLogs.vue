<script setup="">

</script>

<template>
  <div class="logs">
    <div class="logs__container">
      <div class="logs__wrapper">
        <h2 v-slide class="logs__title titleH2">Логи</h2>
        <div slideBody class="logs__body">
          <ul class="list-logs">
            <li class="list-logs__item">
              <p class="list-logs__text">
                Ведущий изменил телосложение игрока ДжоДжо с "Крепкое (Рост: 182 см.)" на "Вялое
                (Рост: 155 см.)
              </p>
            </li>
            <li class="list-logs__item">
              <p class="list-logs__text">
                Ведущий сделал действие "аннулировать специальность"
              </p>
            </li>
            <li class="list-logs__item">
              <p class="list-logs__text">
                Ведущий бросил кубик с 6 гранями и выпало 5
              </p>
            </li>
            <li class="list-logs__item">
              <p class="list-logs__text">
                Ведущий изменил телосложение игрока ДжоДжо с "Крепкое (Рост: 182 см.)" на "Вялое
                (Рост: 155 см.)
              </p>
            </li>
            <li class="list-logs__item">
              <p class="list-logs__text">
                Ведущий сделал действие "аннулировать специальность"
              </p>
            </li>
            <li class="list-logs__item">
              <p class="list-logs__text">
                Ведущий бросил кубик с 6 гранями и выпало 5
              </p>
            </li>
            <li class="list-logs__item">
              <p class="list-logs__text">
                Ведущий изменил телосложение игрока ДжоДжо с "Крепкое (Рост: 182 см.)" на "Вялое
                (Рост: 155 см.)
              </p>
            </li>
            <li class="list-logs__item">
              <p class="list-logs__text">
                Ведущий сделал действие "аннулировать специальность"
              </p>
            </li>
            <li class="list-logs__item">
              <p class="list-logs__text">
                Ведущий бросил кубик с 6 гранями и выпало 5
              </p>
            </li>
            <li class="list-logs__item">
              <p class="list-logs__text">
                Ведущий изменил телосложение игрока ДжоДжо с "Крепкое (Рост: 182 см.)" на "Вялое
                (Рост: 155 см.)
              </p>
            </li>
            <li class="list-logs__item">
              <p class="list-logs__text">
                Ведущий сделал действие "аннулировать специальность"
              </p>
            </li>
            <li class="list-logs__item">
              <p class="list-logs__text">
                Ведущий бросил кубик с 6 гранями и выпало 5
              </p>
            </li>
            <li class="list-logs__item">
              <p class="list-logs__text">
                Ведущий изменил телосложение игрока ДжоДжо с "Крепкое (Рост: 182 см.)" на "Вялое
                (Рост: 155 см.)
              </p>
            </li>
            <li class="list-logs__item">
              <p class="list-logs__text">
                Ведущий сделал действие "аннулировать специальность"
              </p>
            </li>
            <li class="list-logs__item">
              <p class="list-logs__text">
                Ведущий бросил кубик с 6 гранями и выпало 5
              </p>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@import "@/assets/scss/style";

.logs {
  margin-bottom: 150px;
  margin-top: 80px;

  &__container {
  }

  &__wrapper {
    display: flex;
    flex-direction: column;
  }

  &__body {
  }
}

.list-logs {
  margin-left: 60px;
  max-height: 137px;
  overflow: auto;
  font-size: 15px;

  list-style-type: none;
  counter-reset: item;

  & > li {
    position: relative;

    &:before {
      counter-increment: item;
      content: counter(item) ")";
      margin-right: 5px;
    }
  }

  @media (max-width: $tablet) {
    margin: 0;
  }

  &__item {
    margin-bottom: 15px;
    display: flex;
  }

  &__text {
  }
}

</style>