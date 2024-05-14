import { ref, computed, reactive } from 'vue'
import { defineStore } from 'pinia'
import axiosInstance from "@/api.js";
import { useMyProfileStore } from "@/stores/profile.js";
import { isObject } from "@vueuse/core";
import { objIsEmpty } from "@/plugins/functions.js";
import { useGlobalPopupStore } from "@/stores/popup.js";
import { useUserSocketStore } from "@/stores/socket/userSocket.js";
import { showConfirmBlock } from "@/plugins/confirmBlockPlugin.js";

export const useSelectedGame = defineStore('selectedGame', () => {
  const hostFunctional = useHostFunctionalStore()
  const globalPopup = useGlobalPopupStore()
  const selectedGameData = useSelectedGameData()
  
  const isNewGame = ref(false)
  const gameId = ref(null)
  const isStarted = ref(false)
  const hostId = ref(0)
  const watchersCount = ref(0)
  const players = ref([{id: 'asd'}])
  const userId = ref(-1)
  const isHidden = ref(false)
  const isHostPlayer = ref(true)
  const gameLoadText = ref('Идет загрузка данных игры...')
  const maxPlayers = ref(15)
  const minPlayers = ref(6)
  const isCreateCustomGame = ref(false)
  const isGameExist = computed(() => {
    return !!(hostId.value && players.value && userId.value);
  })
  const imWatcher = computed(() => {
    return !selectedGameData.userData[userId.value] || !selectedGameData.userData[userId.value].isPlayer
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
    if (data.hasOwnProperty('isAgeRestriction') && data.isAgeRestriction) {
      globalPopup.activate('Внимание',
        'В данной игре присутсвуют паки 18+. Подключаясь к игре, вы подтверждаете то что вам 18 или больше лет', 'red')
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
    imWatcher,
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
    return !!selectedGame.hostId && selectedGame.hostId===selectedGame.userId
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
  const selectedGame = useSelectedGame()
  
  
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
    for (let player of getActivePlayersFromUserData.value) {
      player.isAlive? players.push(player):null
    }
    return players
  })
  const getMyPlayerData = computed(() => {
    return playersData.value[selectedGame.userId]
  })
  const getMyUserData = computed(() => {
    return userData.value[selectedGame.userId]
  })
  const getActivePlayersFromUserData = computed(() => {
    let resultArr = []
    for (let id in userData.value) {
      if (!!userData.value[id].isPlayer) {
        resultArr.push({id, data: userData.value[id]})
      }
    }
    return resultArr
  })
  
  function setData(data) {
    if (!data || objIsEmpty(data)) {
      return
    }
    if (data.hasOwnProperty('bunkerData')) {
      for (let key in data.bunkerData) {
        bunkerData.value[key] = data.bunkerData[key]
      }
    }
    if (data.hasOwnProperty('players')) {
      for (let playerId in data.players) {
        playersData.value[playerId] = playersData.value[playerId] || {}
        for (let chartName in data.players[playerId]) {
          playersData.value[playerId][chartName] = playersData.value[playerId][chartName] || {}
          if(objIsEmpty(data.players[playerId][chartName])) {
            playersData.value[playerId][chartName] = data.players[playerId][chartName]
            continue
          }
          for (let key in data.players[playerId][chartName]) {
            playersData.value[playerId][chartName][key] = data.players[playerId][chartName][key]
          }
        }
      }
    }
    if (data.hasOwnProperty('userData')) {
      for (let userId in data.userData) {
        userData.value[userId] = userData.value[userId] || {}
        for (let key in data.userData[userId]) {
          userData.value[userId][key] = data.userData[userId][key]
        }
      }
    }
  }
  
  
  function getCharForPlayer(id, item) {
    if (!id || !item) {
      return
    }
    if (playersData.value[id] && playersData.value[id][item] && playersData.value[id][item].text && playersData.value[id][item].isOpen) {
      return playersData.value[id][item].text
    }
    else {
      return null
    }
  }
  
  function getDescriptionForChar(id, item) {
    if (!id || !item) {
      return
    }
    if (playersData.value[id] && playersData.value[id][item] && playersData.value[id][item].isOpen && playersData.value[id][item].description) {
      return playersData.value[id][item].description
    }
    else {
      return null
    }
  }
  
  function clearData() {
    bunkerData.value = {
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
    }
    playersData.value = {}
    userData.value = {}
  }
  
  return {
    bunkerData,
    playersData,
    userData,
    getAlivePlayers,
    getMyPlayerData,
    getMyUserData,
    getActivePlayersFromUserData,
    setData,
    getCharForPlayer,
    getDescriptionForChar,
    clearData,
  }
})

export const useSelectedGameGameplay = defineStore('selectedGameGameplay', () => {
  const selectedGameData = useSelectedGameData()
  const userSocket = useUserSocketStore()
  
  function openChart(el, charName) {
    showConfirmBlock(el.target, () => {
      selectedGameData.getMyPlayerData[charName].isLoading = true
      userSocket.emit('openChart', charName)
      userSocket.on('openChart:good', (chartName) => {
        selectedGameData.getMyPlayerData[chartName].isLoading = false;
        userSocket.removeListener('openChart:good')
      })
    }, 'Открыть характеристику для всех игроков?')
  }
  
  function mvpReload(event,charName) {
    showConfirmBlock(event.target, () => {
      selectedGameData.getMyPlayerData.isMVPRefreshLoading = true
      userSocket.emit('refreshChartMVP', charName)
      userSocket.on('refreshChartMVP:good', (chartName) => {
        selectedGameData.getMyPlayerData.isMVPRefreshLoading = false;
        userSocket.removeListener('refreshChartMVP:good')
      })
    }, 'Вы уверены что хотите поменять характеристику?')
  }
  
  return {
    openChart,
    mvpReload
  }
})