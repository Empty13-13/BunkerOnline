<script setup="">
import { ref } from "vue";

defineProps([
  'index',
  'nickname',
  'value'
])
const isActive = defineModel('isActive')

const inputVote = ref(null)

function changeVote() {
  inputVote.value.click()
}

</script>

<template>
  <div @click="changeVote" class="voteBlock linear-border white">
    <div class="voteBlock__body" :class="inputVote && inputVote.checked?'_active':''">
      <div class="voteBlock__checkImg">
        <svg width="30.000000" height="30.000000" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <clipPath id="clip297_94">
              <rect id="1486395886-checkmark_80611 1" width="30.000000" height="30.000000" fill="white"
                    fill-opacity="0" />
            </clipPath>
          </defs>
          <rect id="1486395886-checkmark_80611 1" width="30.000000" height="30.000000" fill="#FFFFFF"
                fill-opacity="0" />
          <g clip-path="url(#clip297_94)">
            <path id="circle1"
                  d="M30 15C30 23.2842 23.2842 30 15 30C6.71582 30 0 23.2842 0 15C0 6.71582 6.71582 0 15 0C23.2842 0 30 6.71582 30 15Z"
                  fill="#434343" fill-opacity="1.000000" fill-rule="evenodd" />
            <path id="Vector"
                  d="M12.7266 22.7812L5.8125 15.8672C5.71875 15.7734 5.71875 15.6328 5.8125 15.5391L7.80469 13.5469C7.89844 13.4531 8.03906 13.4531 8.13281 13.5469L12.8906 18.3047L21.8438 9.35156C21.9375 9.25781 22.0781 9.25781 22.1719 9.35156L24.1641 11.3438C24.2578 11.4375 24.2578 11.5781 24.1641 11.6719L13.0547 22.7812C12.9609 22.875 12.8203 22.875 12.7266 22.7812Z"
                  fill="#060606" fill-opacity="1.000000" fill-rule="nonzero" />
          </g>
        </svg>
      </div>
      <div class="voteBlock__column">
        <div class="voteBlock__title">Игрок {{ index+1 }}</div>
        <div class="voteBlock__nickname">{{ nickname }}</div>
      </div>
      <input v-model="isActive" type="radio" name="voting" :value="value" ref="inputVote">
    </div>
  </div>
</template>

<style lang="scss">
.voteBlock {
  display: inline-flex;
  cursor: pointer;
  flex: 0 0 200px;

  &__body {
    padding: 25px 20px;
    display: flex;
    justify-content: center;
    align-items: center;

    &._active {
      #circle1 {
        fill: #138A00;
      }
    }
  }

  &__checkImg {
    display: flex;
    justify-content: center;
    align-items: center;
    margin-right: 15px;

    svg {

    }
  }

  &__column {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 13px;
  }

  &__title {
    font-size: 11px;
    font-weight: 600;
    color: #b4b4b4;
  }

  &__nickname {
    font-size: 12px;
    font-weight: 700;
  }

  input {
    display: none;
  }
}
</style>