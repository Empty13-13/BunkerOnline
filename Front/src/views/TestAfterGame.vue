<script setup="">
import AppButton from "@/components/AppButton.vue";
import { ref, watch } from "vue";

const testData = [
  [
    {
      title: 'У вас хватает еды на весь период (включая отыгрыш добычи еды)?',
      answers: ['Да', 'Нет'],
      badEnd: 'Со временем жители бункера умерли от голода.... <br>Возможно стоило иначе выбирать претендентов на проход в бункер'
    },
  ],
  [
    {
      title: 'Все опасные и заразные выжившие изолированы или есть человек/предмет, который может спасти остальных?',
      answers: ['Да', 'Нет'],
      badEnd: 'Со временем болезнь начала распространяться по бункеру, постепенно беспощадно пожиная жизни.... <br>Возможно стоило иначе выбирать претендентов на проход в бункер'
    },
  ],
  [
    {
      title: 'При наличии вражеского бункера есть  ли оружие или есть ли боеспособный человек (военный, знает боевые искусства или подобное)?',
      answers: ['Вражеских бункеров нет', 'Есть вражеский бункер, но есть оружие / боеспособный человек (военный / знает боевые искусства / подобное)', 'Есть вражеский бункер и нет возможности отбиться'],
      badEnd: 'Изначально дела шли на лад. Но со временем соседний вражеский лагерь узнал ваше расположение и пришел к вам с известными намерениями.<br><br>В результате жестокой битвы ваш лагерь по итогу проиграл. Почти все погибли, а ещё живых жителей после битвы захватили в рабство...'
    },
  ],
  [
    {
      title: 'Половина выживших от общего числа вошедших в бункер не инвалиды?',
      answers: ['Да, порядок', 'Увы, нет'],
      score: 3,
    },
    {
      title: 'Половина выживших от общего числа вошедших в бункер не хрупкие и без ожирения?',
      answers: ['Да, порядок', 'Увы, нет'],
      score: 3,
    },
    {
      title: 'Половина выживших от общего числа вошедших в бункер не пожилые?',
      answers: ['Да, порядок', 'Увы, нет'],
      score: 3,
    },
    {
      title: 'Половина выживших от общего числа вошедших в бункер не имеют отрицательной человеческой черты?',
      answers: ['Да, порядок', 'Увы, нет'],
      score: 1,
    },
    {
      title: 'Есть ли хотя бы 2 выживших от общего числа вошедших в бункер с полезной специальностью?',
      answers: ['Да, порядок', 'Увы, нет'],
      score: 2,
    },
    {
      title: 'Есть ли хотя бы 2 выживших от общего числа вошедших в бункер с полезным хобби?',
      answers: ['Да, порядок', 'Увы, нет'],
      score: 2,
    },
    {
      title: 'Есть ли хотя бы 2 выживших от общего числа вошедших в бункер с полезным инвентарём?',
      answers: ['Да, порядок', 'Увы, нет'],
      score: 1,
    },
    {
      title: 'Есть ли хотя бы 2 выживших от общего числа вошедших в бункер с полезными доп. сведениями?',
      answers: ['Да, порядок', 'Увы, нет'],
      score: 2,
    },
    {
      title: 'Есть ли хотя бы одна пара для продолжения рода или есть дети?',
      answers: ['Да, порядок', 'Увы, нет'],
      score: 2,
    },
    {
      title: 'Есть ли дружеский бункер (в том числе со строителями, медиками, женщинами, мужчинами)?',
      answers: ['Да, порядок', 'Увы, нет'],
      score: 3,
    },
    {
      title: 'Проблемы в бункере отсутствуют, решены (в том числе бомж)?',
      answers: ['Да, порядок', 'Увы, нет'],
      score: 3,
    },
  ],
]
const step = ref(0)
const badStep = ref('')

watch(step, (now, old) => {
  window.scrollTo(0, 0);
  if (old>now || now<0) {
    return
  }
  if (old<3) {
    let radios = document.querySelectorAll('input[type=radio]')
    if (radios) {
      let activeRadio = Array.from(radios).find(radio => radio.checked)
      if (activeRadio && (+activeRadio.value===1 && old!==2 || +activeRadio.value===2)) {
        badStep.value = testData[step.value - 1][0].badEnd
        step.value = -1
      }
    }
  } else {
    if(now>testData.length-1) {
      let radios = document.querySelectorAll('input[type=radio]')
      if(radios) {
        let finalSum = Array.from(radios).reduce((p,item) => {
          if(item.checked && +item.value===0) {
            p+=testData[3][+item.id.toString().split('_')[1]].score
          }
          return p
        },0)
        if(finalSum>=15) {
          badStep.value = 'Поздравляем! Всем жителям удалось выжить и возможно именно ваша база станет началом новой цивилизации в будущем'
        } else {
          badStep.value = 'Увы! Скорее всего ваш бункер в скором времени погибнет...'
        }
        step.value = -1
      }
    }
  }
})

</script>

<template>
  <div class="testAfterGame paddingTop">
    <div class="testAfterGame__container">
      <div class="testAfterGame__block">
        <h1 class="testAfterGame__title titleH1">Оценка выживаемости бункера</h1>
        <div v-if="step>-1" class="testAfterGame__body">
          <div class="testAfterGame__wrapper">
            <div class="testAfterGame__checkBlock checkBlock-testAfterGame linear-border white"
                 v-for="(data,index) in testData[step]"
                 :key="step.toString()+index.toString()"
            >
              <h3 class="checkBlock-testAfterGame__question">
                {{ data.title }}
              </h3>
              <div class="options">
                <div class="options__item"
                     v-for="(answer,answerIndex) in data.answers"
                     :key="answer.toString() + step.toString() + index.toString()"
                >
                  <input hidden :id="`${step}_${index}_${answerIndex}`" class="options__input" checked type="radio"
                         :value="answerIndex" :name="`${step}_${index}`">
                  <label :for="`${step}_${index}_${answerIndex}`" class="options__label"><span
                      class="options__text">{{ answer }}</span></label>
                </div>
              </div>
            </div>
          </div>
          <div class="testAfterGame__buttons">
            <AppButton v-if="step>0" @click="step--" color="gold" border="true">Назад</AppButton>
            <AppButton @click="step++" :color="step===testData.length-1?'green':'gold'">{{step===testData.length-1?'Узнать результат':'Далее'}}</AppButton>
          </div>
        </div>
        <div v-else class="testAfterGame__badText ">
          <div class="linear-border gold">
            <p v-html="badStep"></p>
          </div>
          <AppButton @click="step=0" color="gold">Пройти заново</AppButton>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss">
@import "@/assets/scss/style.scss";

.testAfterGame {
  &__container {
  }

  &__block {
  }

  &__title {
    text-align: center;
    line-height: 1.2;
  }

  &__body {
    margin-top: 40px;
  }

  &__wrapper {
    //padding: 20px;
    margin-bottom: 20px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  }

  &__buttons {
    max-width: 800px;
    margin: 0 auto;
    display: flex;
    gap: 20px;

    @media (max-width: 850px) {
      width: 100%;
      max-width: 100%;
    }

    button {
      height: 40px;
      font-size: 14px;
    }
  }

  &__badText {
    font-size: 16px;
    text-align: center;
    margin-top: 40px;
    line-height: 1.2;

    > .linear-border {
      padding: 20px 40px;

      @media (max-width: $mobile) {
        padding: 20px 30px;
      }
    }

    button {
      margin: 0 auto;
      margin-top: 20px;
      width: 300px;
      height: 40px;

      @media (max-width: $mobileSmall) {
        width: 100%;
      }
    }
  }
}

.checkBlock-testAfterGame {
  display: flex;
  flex-direction: column;
  justify-content: center;
  width: 800px;
  max-width: 800px;
  padding: 20px;
  flex: 1 1 auto;
  margin-bottom: 20px;

  &:last-child {
    margin-bottom: 0;
  }

  @media (max-width: 850px) {
    width: 100%;
    max-width: 100%;
  }

  &__question {
    font-size: 18px;
    font-weight: 700;
    margin-bottom: 15px;
    line-height: 1.2;
  }
}

.options {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  // .options__item
  &__item {
    position: relative;
    cursor: pointer;
    width: 100%;

    &:not(:last-child) {
      margin-bottom: 10px;
    }
  }

  // .options__input
  &__input {
    width: 0;
    height: 0;
    opacity: 0;
    position: absolute;

    &:focus + .options__label:before {
      box-shadow: 0 0 5px #000;
    }

    &:checked + .options__label:before {
    }

    &:checked + .options__label:after {
      transform: scale(1);
    }
  }

  // .options__label
  &__label {
    display: inline-flex;
    align-items: center;
    cursor: pointer;
    gap: 10px;
    width: 100%;

    &:before {
      content: "";
      align-self: flex-start;
      width: 20px;
      height: 20px;
      flex: 0 0 20px;
      border-radius: 50%;
      border: 1px solid #a7a9ac;
    }

    &:after {
      content: "";
      transition: all 0.3s ease 0s;
      transform: scale(0);
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background-color: #D96613FF;
      position: absolute;
      left: 5px;
      top: 5px;
    }
  }

  // .options__text
  &__text {
    font-size: 13px;
    line-height: 1.2;
  }
}
</style>