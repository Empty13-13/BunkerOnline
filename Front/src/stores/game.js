import { ref, computed, reactive } from 'vue'
import { defineStore } from 'pinia'
import axiosInstance from "@/api.js";
import { useMyProfileStore } from "@/stores/profile.js";
import { isObject } from "@vueuse/core";
import { objIsEmpty } from "@/plugins/functions.js";
export const useSelectedGame = defineStore('selectedGame', () => {
  const isNewGame = ref(false)
  const gameId = ref(null)
  const isStarted = ref(false)
  const hostId = ref(0)
  const watchersCount = ref(0)
  const players = ref([{id:'asd'}])
  const userId = ref(0)
  const isHidden = ref(false)
  const gameLoadText =  ref('Идет загрузка данных игры...')
  
  const isGameExist = computed(() => {
    return !!(hostId.value && players.value && userId.value);
  })
  
  async function generateGameId() {
    try {
      gameId.value = (await axiosInstance.post('/generateRoomId')).data.link
      isNewGame.value = true
    } catch(e) {
      gameId.value = null
      console.log(e.message)
      return 'Error generate Id Room'
    } finally {
      isStarted.value = false
    }
  }
  function clearData() {
    hostId.value = 0
    isStarted.value = false
    watchersCount.value = 0
    players.value = []
    userId.value = 0
    isHidden.value = false
  }
  function setInitialData(data) {
    hostId.value = data.hostId || hostId.value
    isStarted.value = data.isStarted || isStarted.value
    watchersCount.value = data.watchersCount || watchersCount.value
    if(data.players) {
      players.value.length = 0
      players.value = players.value.concat(data.players)
    }
    userId.value = data.userId || userId.value
    isHidden.value = data.isHidden || isHidden.value
  }
  function clear() {
    gameId.value = null
    isNewGame.value = false
    clearData()
  }
  
  return {
    isHidden,
    isStarted,
    hostId,
    watchersCount,
    players,
    userId,
    gameId,
    isNewGame,
    isGameExist,
    gameLoadText,
    clearData,
    clear,
    generateGameId,
    setInitialData,
  }
})

export const useHostFunctionalStore = defineStore('hostPrivileges', () => {
  const selectedGame = useSelectedGame()
  
  
  const isPlayerToo = ref(true)
  const haveAccess = computed(() => {
    return selectedGame.hostId === selectedGame.userId
  })
  
  function clearData() {
    isPlayerToo.value = true
  }
  
  return {
    haveAccess,
    isPlayerToo,
    clearData
  }
})