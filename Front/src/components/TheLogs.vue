<script setup="">

import { useSelectedGameData, useSelectedGameGameplay } from "@/stores/game.js";
import { getPercentForVote } from "@/plugins/functions.js";

const selectedGameData = useSelectedGameData()

</script>

<template>
  <div class="logs">
    <div class="logs__container">
      <div class="logs__wrapper">
        <h2 v-slide class="logs__title titleH2">Логи</h2>
        <div slideBody class="logs__body" hidden="">
          <ul class="list-logs">
            <li class="list-logs__item"
                v-for="log in selectedGameData.logs"
                :key="log.value"
            >
              <div v-if="log.type==='voiting'" class="">
                <h2 v-slide class="list-logs__text" style="cursor:pointer;">Голосование завершилось (нажмите чтобы увидеть результат)</h2>
                <div slidebody hidden>
                  <div class="results-voting__body" style="padding-top: 20px;">
                    <div
                        v-for="vote in selectedGameData.getNonVoitingUsersNicknames(log.value).votedList"
                        :key="vote.nickname"
                        class="results-voting__line line-results-voting"
                    >
                      <div class="line-results-voting__name">
                        {{ vote.nickname }} <span>{{ vote.whoVote.length }}</span>
                      </div>
                      <div class="line-results-voting__progress progress-result">
                        <div class="progress-result__backline"
                             :style="'width:'+getPercentForVote(vote,selectedGameData.getNonVoitingUsersNicknames(log.value).allVoteNum)+'%'"
                        >
                          <span></span>
                        </div>
                        <div class="progress-result__nickList">
                          {{ vote.whoVote.join(', ') }}
                        </div>
                      </div>
                      <div class="progress-result__percentages">
                        {{ getPercentForVote(vote,selectedGameData.getNonVoitingUsersNicknames(log.value).allVoteNum) }} %
                      </div>
                    </div>
                  </div>
                  <div v-if="selectedGameData.getNonVoitingUsersNicknames(log.value).abstainedList.length"
                       class="results-voting__listAbstained" style="padding-bottom: 10px !important;">
                    Игроки, которые не приняли участие в голосовании:
                    <span>{{ selectedGameData.getNonVoitingUsersNicknames(log.value).abstainedList.join(', ') }}</span>
                  </div>
                  <div v-else class="results-voting__listAbstained" style="padding-bottom: 10px !important;">
                    Все игроки приняли участие в голосовании
                  </div>
                </div>
              </div>
              <p v-else class="list-logs__text"
                 v-html="selectedGameData.getLogHtml(log)"
              ></p>
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
  max-height: 180px;
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