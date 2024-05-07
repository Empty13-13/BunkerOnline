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
  const players = ref([{id: 'asd'}])
  const userId = ref(0)
  const isHidden = ref(false)
  const isHostPlayer = ref(true)
  const gameLoadText = ref('Идет загрузка данных игры...')
  const maxPlayers = ref(15)
  const minPlayers = ref(6)
  const isCreateCustomGame = ref(false)
  
  const hostFunctional = useHostFunctionalStore()
  
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
    if (data.hasOwnProperty('hostId')) {
      hostId.value = data.hostId
    }
    if (data.hasOwnProperty('isStarted')) {
      isStarted.value = data.isStarted
    }
    if (data.hasOwnProperty('watchersCount')) {
      watchersCount.value = data.watchersCount
    }
    if (data.players) {
      players.value.length = 0
      players.value = players.value.concat(data.players)
    }
    if (data.hasOwnProperty('userId')) {
      userId.value = data.userId
    }
    if (data.hasOwnProperty('isHidden')) {
      isHidden.value = data.isHidden
    }
    if (data.hasOwnProperty('isHostPlayer')) {
      isHostPlayer.value = data.isHostPlayer
      hostFunctional.isPlayerToo = data.isHostPlayer
    }
  }
  
  function clear() {
    gameId.value = null
    isNewGame.value = false
    isCreateCustomGame.value = false
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
    minPlayers,
    maxPlayers,
    isCreateCustomGame,
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
    return selectedGame.hostId===selectedGame.userId
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

export const useSelectedGameData = defineStore('selectedGameData', () => {
  const bunkerData = ref({
    bunkerBedroom: "",
    bunkerCreated: "",
    bunkerFood: "",
    bunkerItems: [],
    bunkerLocation: "",
    bunkerSize: 0,
    bunkerTime: "",
    catastrophe: "",
    imageName: "",
    maxSurvivor: 0
  })
  const playersData = ref({})
  const userData = ref({})
  
  const getAlivePlayers = computed(() => {
    let players = []
    for(let key in userData.value) {
      userData.value[key].isAlive?players.push(userData.value[key]):''
    }
    return players
  })
  
  function setData(data) {
    if(!data || objIsEmpty(data)) {
      return
    }
    if(data.hasOwnProperty('bunkerData')) {
      console.log(data.bunkerData)
      for(let key in data.bunkerData) {
        bunkerData.value[key] = data.bunkerData[key]
      }
    }
    if(data.hasOwnProperty('players')) {
      for(let key in data.players) {
        playersData.value[key] = data.players[key]
      }
    }
    if(data.hasOwnProperty('userData')) {
      for(let key in data.userData) {
        userData.value[key] = data.userData[key]
      }
    }
  }
  
  function getCharForPlayer(id,item) {
    if(playersData.value[id] && playersData.value[id][item] && playersData.value[id][item].text && playersData.value[id][item].isOpen){
      return playersData.value[id][item].text
    } else {
      return null
    }
  }
  
  function getDescriptionForChar(id,item) {
    if(playersData.value[id] && playersData.value[id][item] && playersData.value[id][item].text && playersData.value[id][item].isOpen && playersData.value[id][item].description){
      return playersData.value[id][item].description 
    } else {
      return null
    }
  }
  
  return {
    bunkerData,
    playersData,
    userData,
    getAlivePlayers,
    setData,
    getCharForPlayer,
    getDescriptionForChar,
  }
})
