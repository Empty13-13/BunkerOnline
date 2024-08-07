import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import axiosInstance from "@/api.js";
import { objIsEmpty, setLocalData } from "@/plugins/functions.js";
import { useGlobalPopupStore } from "@/stores/popup.js";
import { useUserSocketStore } from "@/stores/socket/userSocket.js";
import { showConfirmBlock } from "@/plugins/confirmBlockPlugin.js";
import { usePreloaderStore } from "@/stores/preloader.js";
import { useHostSocketStore } from "@/stores/socket/hostSocket.js";
import router from "@/router/index.js";
import { useMetaStore } from "@/stores/meta.js";

export const useSelectedGame = defineStore('selectedGame', () => {
  const hostFunctional = useHostFunctionalStore()
  const globalPopup = useGlobalPopupStore()
  const selectedGameData = useSelectedGameData()
  const globalPreloader = useGlobalPopupStore()
  const metaStore = useMetaStore()
  
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
  const agreeToAccess = ref(true)
  const agreeTitle = ref('Внимание!')
  const agreeText = ref('Вы уверены, что хотите подключиться к игре?<br><br>Для продолжения нажмите кнопку "подключиться"')
  const isGameExist = computed(() => {
    return !!(hostId.value && players.value && userId.value);
  })
  const imWatcher = computed(() => {
    return !selectedGameData.userData[userId.value] || !selectedGameData.userData[userId.value].isPlayer
  })
  
  
  async function generateGameId(token) {
    try {
      gameId.value = (await axiosInstance.post('/generateRoomId', {recaptchaToken: token})).data.link
      isNewGame.value = true
    } catch(e) {
      gameId.value = null
      console.log(e.response.data.message)
      return e.response
    } finally {
      isStarted.value = false
    }
  }
  
  
  function setInitialData(data) {
    if(data.hasOwnProperty('agreeToAccess')) {
      if(!data.agreeToAccess) {
        agreeToAccess.value = false
        agreeTitle.value = data.title
        agreeText.value = data.text
        globalPreloader.deactivate()
      }
    }
    if (data.hasOwnProperty('hostId')) {
      hostId.value = data.hostId
    }
    if (data.hasOwnProperty('isStarted')) {
      isStarted.value = data.isStarted
      if(!!data.isStarted) {
        metaStore.setTitle(`Игра началась`)
      } else {
        metaStore.setTitle(`Ожидание игроков`)
      }
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
        'В данной игре присутствуют паки 18+.<br>Подключаясь к игре вы подтверждаете, что вам есть 18 лет',
        'red')
    }
  }
  
  function clear() {
    gameId.value = null
    isNewGame.value = false
    isCreateCustomGame.value = false
    clearData()
  }
  function clearData() {
    hostId.value = 0
    isStarted.value = false
    watchersCount.value = 0
    players.value = []
    userId.value = 0
    isHidden.value = false
    agreeTitle.value = 'Внимание!'
    agreeText.value = 'Вы уверены, что хотите подключиться к игре?<br><br>Для продолжения нажмите кнопку "подключиться"'
  }
  
  
  return {
    isHidden,
    isStarted,
    hostId,
    watchersCount,
    agreeTitle,
    agreeText,
    players,
    userId,
    gameId,
    isNewGame,
    isGameExist,
    gameLoadText,
    minPlayers,
    maxPlayers,
    isCreateCustomGame,
    agreeToAccess,
    imWatcher,
    clearData,
    clear,
    generateGameId,
    setInitialData,
  }
})

export const useHostFunctionalStore = defineStore('hostPrivileges', () => {
  const selectedGame = useSelectedGame()
  const hostSocket = useHostSocketStore()
  const userSocket = useUserSocketStore()
  const selectedGameData = useSelectedGameData()
  const globalPopup = useGlobalPopupStore()
  
  const isPlayerToo = ref(true)
  const haveAccess = computed(() => {
    return !!selectedGame.hostId && selectedGame.hostId===selectedGame.userId
  })
  
  function startVoiting(e) {
    showConfirmBlock(e.target, () => {
      hostSocket.emit('voiting:start')
      // selectedGameData.isVoiting = true
    })
  }
  
  function endVoiting(e) {
    showConfirmBlock(e.target, () => {
      hostSocket.emit('voiting:finished')
      // selectedGameData.isVoiting = false
    })
  }
  
  function clearData() {
    isPlayerToo.value = true
  }
  
  function activateTimer(second) {
    hostSocket.emit('timer:start', second)
  }
  
  function refreshBunkerData(e) {
    showConfirmBlock(e.target, () => {
      hostSocket.emit('refresh:bunkerData', 5)
    })
  }
  
  function professionRotate(e) {
    showConfirmBlock(e.target, () => {
      hostSocket.emit('refresh:professionByHour')
      hostSocket.on('refresh:professionByHour:bad', () => {
        globalPopup.activate('Ошибка', 'Не удалось поменять профессии по часовой стрелке', 'red')
        hostSocket.removeListener('refresh:professionByHour:bad')
      })
    })
  }
  
  function setAllProfessionToNull(e) {
    showConfirmBlock(e.target, () => {
      hostSocket.emit('refresh:professionSetNull')
    })
  }
  
  function rotateChangeDelete(e, array, obj) {
    showConfirmBlock(e.target, () => {
      if (obj.value===10) {
        hostSocket.emit('refresh:SetNull', 0)
      }
      else if (obj.value===11) {
        hostSocket.emit('refresh:SetNull', 1)
      }
      else {
        hostSocket.emit('refresh:ByHour', obj.value, array.find(item => item.text===obj.text).rotate)
      }
    })
  }
  
  function transferHost(e, id) {
    showConfirmBlock(e.target, () => {
      hostSocket.emit('transferHost', id)
    }, 'Вы действительно хотите передать права ведущего другому игроку?')
  }
  
  function stealChart(e, id1, id2, idChart) {
    showConfirmBlock(e.target, () => {
      hostSocket.emit('stealChart', id1, id2, idChart)
    })
  }
  
  function addChart(e, idPlayer, idChart, text) {
    showConfirmBlock(e.target, () => {
      if (idChart<4) {
        text = null
      }
      hostSocket.emit('addChart', idPlayer, idChart, text)
    })
  }
  
  function changeBunker(e, idAction) {
    showConfirmBlock(e.target, () => {
      hostSocket.emit('refresh:bunkerData', idAction)
    })
  }
  
  function swapCharacter(e, idPlayer1, idPlayer2, idChart) {
    showConfirmBlock(e.target, () => {
      hostSocket.emit('exchangeChart', idPlayer1, idPlayer2, idChart)
    })
  }
  
  function changeCharacteristics(e, playersId, chartId, chartText) {
    showConfirmBlock(e.target, () => {
      hostSocket.emit('refresh:chartName', playersId, chartId, chartText)
    })
  }
  
  function deleteRelocate(e, playerId, funcId) {
    showConfirmBlock(e.target, () => {
      hostSocket.emit('deleteRelocate', playerId, funcId)
    })
  }
  
  function changeRelocate(e, playerId, funcId) {
    showConfirmBlock(e.target, () => {
      hostSocket.emit('deleteRelocate', playerId, funcId)
    })
  }
  
  function healthOrDo(e, playerId, chartId) {
    showConfirmBlock(e.target, () => {
      hostSocket.emit('refresh:cureMake', playerId, chartId)
    })
  }
  
  function sexOpposite(e, playerId) {
    showConfirmBlock(e.target, () => {
      hostSocket.emit('refresh:sexOpposite', playerId)
    })
  }
  
  function degreeOfSick(e, playerId, chartId) {
    showConfirmBlock(e.target, () => {
      hostSocket.emit('refresh:degreeOfSick', playerId, chartId)
    })
  }
  
  function professionExp(e, playerId, chartId) {
    showConfirmBlock(e.target, () => {
      hostSocket.emit('refresh:professionExp', playerId, chartId)
    })
  }
  
  //========================================================================================================================================================
  
  function changeSpaceNum(isPlus, e) {
    showConfirmBlock(e.target, () => {
      hostSocket.emit('refresh:maxSurvivor', isPlus)
    }, `Вы уверены, что хотите ${isPlus? 'увеличить':'уменьшить'} количество мест?`)
  }
  
  function rollTheDice(e, num) {
    showConfirmBlock(e.target, () => {
      hostSocket.emit('rollTheDice', num)
    })
  }
  
  return {
    haveAccess,
    isPlayerToo,
    healthOrDo,
    professionExp,
    degreeOfSick,
    sexOpposite,
    clearData,
    startVoiting,
    endVoiting,
    activateTimer,
    changeSpaceNum,
    refreshBunkerData,
    rollTheDice,
    professionRotate,
    setAllProfessionToNull,
    rotateChangeDelete,
    transferHost,
    stealChart,
    addChart,
    changeBunker,
    swapCharacter,
    changeCharacteristics,
    deleteRelocate,
    changeRelocate,
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
  const userData = ref({
    sortedPlayers: []
  })
  const showCancelButton = ref(false)
  const voitingData = ref({})
  const isVoiting = ref(false)
  const userVoitingChoice = ref("")
  const timerStart = ref(false)
  const timerSeconds = ref(0)
  const isPauseTimer = ref(false)
  const activeTimers = ref([false, false, false])
  const logs = ref([])
  const diceNum = ref(0)
  const showDice6 = ref(false)
  const showDice20 = ref(false)
  const votedPlayerID = ref(0)
  const showPlayVoiceButton = ref(true)
  const playedAudio = ref(false)
  const dateNow = ref(new Date())
  const nowDateTimer = ref(new Date())
  const timerEndDate = ref(new Date())
  const deltaDateTimer = ref(new Date(0))
  
  const getAlivePlayers = computed(() => {
    let players = []
    for (let i = 0; i<getActivePlayersFromUserData.value.length; i++) {
      let player = getActivePlayersFromUserData.value[i]
      if(player.data.isAlive) {
        player.nicknameWithNum = `${i + 1} | ${player.data.nickname}`
        players.push(player)
      }
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
    let indexPlayer = 0
    userData.value.sortedPlayers.forEach((id,index) => {
      if (!!userData.value[id].isPlayer) {
        resultArr.push({id: id, data: userData.value[id],index:indexPlayer++})
      }
    })
    return resultArr
  })
  const getPlayerForSelect = computed(() => {
    return getAlivePlayers.value.map((item,index) => {
      return {value: item.id, text: item.nicknameWithNum}
    })
  })
  const getPlayerForSelectAndAll = computed(() => {
    let players = [{value: 0, text: 'Для всех'}]
    players = players.concat(getAlivePlayers.value.map((item,index) => {
      return {value: item.id, text: item.nicknameWithNum}
    }))
    return players
  })
  const getAllPlayersSelectToChangeAdmin = computed(() => {
    let resultArr = []
    // let index = 0
    // for (let id in userData.value) {
    //   if(Number.isFinite(+id)) {
    //     if (userData.value[id] && +id!==+selectedGame.hostId) {
    //       resultArr.push({value: id, text: (index + 1)+ " | " +  userData.value[id].nickname})
    //     }
    //     index++
    //   }
    // }
    
    let lastIndex = -1
    userData.value.sortedPlayers.forEach((id,index) => {
      if (userData.value[id] && +id!==+selectedGame.hostId) {
        resultArr.push({value: id, text: (index + 1)+ " | " +  userData.value[id].nickname})
        lastIndex = index + 1
      }
    })
    for (let id in userData.value) {
      if (
        Number.isFinite(+id) &&
        !!userData.value[id] && !resultArr.find(item => +item.value === +id) &&
        userData.value[id] && +id!==+selectedGame.hostId
      ) {
        resultArr.push({value: id, text: (lastIndex + 1)+ " | " +  userData.value[id].nickname})
        lastIndex++
      }
    }
    return resultArr
  })
  const getAllPlayersSelectToAdminFunctionsAndAll = computed(() => {
    let resultArr = []
    let lastIndex = -1
    userData.value.sortedPlayers.forEach((id,index) => {
      if (userData.value[id] && +id!==+selectedGame.hostId) {
        resultArr.push({value: id, text: (index + 1)+ " | " +  userData.value[id].nickname})
        lastIndex = index + 1
      }
    })
    for (let id in userData.value) {
      if (
        Number.isFinite(+id) &&
        !!userData.value[id] && !resultArr.find(item => +item.value === +id)
      ) {
        resultArr.push({value: id, text: (lastIndex + 1)+ " | " +  userData.value[id].nickname})
        lastIndex++
      }
    }
    resultArr.unshift({value: 0, text: 'Для всех'})
    return resultArr
  })
  
  const getCatastropheEndSeconds = computed(() => {
    return (new Date(bunkerData.value.endOfTime) - dateNow.value) / 1000
  })
  const getPlayerEndSeconds = computed(() => {
    let seconds = Math.floor((new Date(timerEndDate.value) - dateNow.value) / 1000)
    return seconds>0?seconds:0
  })
  let timerCatastrophe = null
  setInterval(() => {
    dateNow.value = new Date()
  }, 1000)
  
  function setData(data) {
    if (!data || objIsEmpty(data)) {
      return
    }
    if (data.hasOwnProperty('bunkerData')) {
      for (let key in data.bunkerData) {
        if (key==='endOfTime') {
          clearInterval(timerCatastrophe)
          if(data.bunkerData.endOfTime) {
            if (+(new Date(data.bunkerData.endOfTime)) - +(dateNow.value)>0) {
              timerCatastrophe = setInterval(() => {
                if (+(new Date(data.bunkerData.endOfTime)) - +(dateNow.value)<=0) {
                  clearInterval(timerCatastrophe)
                  useGlobalPopupStore().activate('Таймер истек', 'Таймер для катаклизма истек', 'red')
                }
              }, 1000)
            }
          }
        }
        
        bunkerData.value[key] = data.bunkerData[key]
        
        if (key==='endOfTime') {
          if (+(new Date(bunkerData.value.endOfTime)) - +(dateNow.value)>0) {
            clearInterval(timerCatastrophe)
            timerCatastrophe = setInterval(() => {
              if (+(new Date(bunkerData.value.endOfTime)) - +(dateNow.value)<=0) {
                clearInterval(timerCatastrophe)
                useGlobalPopupStore().activate('Таймер истек', 'Таймер для катаклизма истек', 'red')
              }
            }, 1000)
          }
        }
        if (key==='soundName') {
          showPlayVoiceButton.value = true
          playedAudio.value = false
          if(data.bunkerData.soundName) {
          
          } else {
          
          }
        }
      }
    }
    if (data.hasOwnProperty('players')) {
      for (let playerId in data.players) {
        playersData.value[playerId] = playersData.value[playerId] || {}
        for (let chartName in data.players[playerId]) {
          playersData.value[playerId][chartName] = playersData.value[playerId][chartName] || {}
          if (objIsEmpty(data.players[playerId][chartName])) {
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
        if (userId==='sortedPlayers') {
          userData.value[userId] = data.userData[userId]
        }
        else {
          userData.value[userId] = userData.value[userId] || {}
          for (let key in data.userData[userId]) {
            userData.value[userId][key] = data.userData[userId][key]
          }
        }
      }
    }
    if (data.hasOwnProperty('voitingData')) {
      voitingData.value = data.voitingData
      isVoiting.value = !data.voitingData.status
      if (data.voitingData.hasOwnProperty('userChoise')) {
        if (data.voitingData.userChoise) {
          userVoitingChoice.value = userData.value[data.voitingData.userChoise].nickname
        }
        else {
          userVoitingChoice.value = ''
        }
      }
    }
    if (data.hasOwnProperty('logsData')) {
      logs.value = logs.value.concat(data.logsData)
    }
    if (data.hasOwnProperty('showPlayVoiceButton')) {
      showPlayVoiceButton.value = data.showPlayVoiceButton
    }
    if (data.hasOwnProperty('showCancelButton')) {
      showCancelButton.value = data.showCancelButton
    }
    if (data.hasOwnProperty('timer')) {
      if (data.timer.nowSeconds) {
        useSelectedGameGameplay().startTimer(data.timer.nowSeconds)
      }
      else if (data.timer.seconds) {
        timerEndDate.value = new Date(+(new Date()) + (+data.timer.seconds * 1000))
        timerSeconds.value = +data.timer.seconds
        timerStart.value = true
        isPauseTimer.value = true
      }
    }
  }
  
  function getNonVoitingUsersNicknames(voitingData) {
    let votedData = {}
    let votedList = []
    let abstainedList = []
    let allVoteNum = 0
    let votedPlayerIds = []
    
    for (let choiceIdPlayer in voitingData.voitingPull) {
      let choicePlayerNickname = userData.value[choiceIdPlayer].nickname
      let localVotedListNicknames = []
      for (let index in voitingData.voitingPull[choiceIdPlayer]) {
        let votedPlayerNickname = (userData.value.sortedPlayers.indexOf(
          voitingData.voitingPull[choiceIdPlayer][index]) + 1) + ' | ' + userData.value[voitingData.voitingPull[choiceIdPlayer][index]].nickname
        votedPlayerIds.push(voitingData.voitingPull[choiceIdPlayer][index])
        localVotedListNicknames.push(votedPlayerNickname)
        allVoteNum++
      }
      votedList.push({nickname: choicePlayerNickname, whoVote: localVotedListNicknames, index:userData.value.sortedPlayers.indexOf(+choiceIdPlayer)+1})
    }
    
    for (let dataKey in userData.value) {
      if (userData.value[dataKey].isPlayer && userData.value[dataKey].isAlive && !votedPlayerIds.includes(+dataKey)) {
        abstainedList.push(`${userData.value.sortedPlayers.indexOf(+dataKey) + 1} | ${userData.value[dataKey].nickname}`)
      }
    }
    
    votedData.votedList = votedList
    votedData.allVoteNum = allVoteNum
    votedData.abstainedList = abstainedList
    
    return votedData
  }
  
  function getCharForPlayer(id, item) {
    if (!id || !item) {
      return
    }
    if (playersData.value[id] && playersData.value[id][item] && playersData.value[id][item].text && playersData.value[id][item].isOpen) {
      let textArray = playersData.value[id][item].text.split(' ')
      let resultArray = []
      textArray.forEach((word, index) => {
        // if (index===textArray.length - 1) {
        //   resultArray.push(word.replaceAll('/', "$&&shy;/$&&shy;"))
        // }
        if (word.length>9) {
          let resultWord = word.replace(/...../g, "$&&shy;").replace(/\/$/g, "")
          if (resultWord[resultWord.length - 1]===';') {
            resultWord = resultWord.slice(0,-5)
          }
          resultArray.push(resultWord);
        }
        else {
          resultArray.push(word)
        }
      })
      return resultArray.join(' ')
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
  
  function getLogHtml(logData) {
    switch(logData.type) {
      case 'voiting': {
        
        break;
      }
      case 'rollDice': {
        logData.value = logData.value.trim().replace(/(\[(.|..)g\])/, '').replace(/\/$/g, "");
        break;
      }
    }
    return logData.value
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
    userData.value = {
      sortedPlayers: []
    }
    voitingData.value = {}
    isVoiting.value = false
    userVoitingChoice.value = ''
    timerStart.value = false
    timerSeconds.value = 0
    isPauseTimer.value = false
    activeTimers.value = [false, false, false]
    logs.value = []
    diceNum.value = 0
    showDice6.value = false
    showDice20.value = false
    votedPlayerID.value = 0
    showPlayVoiceButton.value = true
    dateNow.value = new Date()
    showCancelButton.value = false
    playedAudio.value = false
    timerEndDate.value = new Date()
    nowDateTimer.value = new Date()
    deltaDateTimer.value= new Date(0,0,0,0,0,0,0)
  }
  
  return {
    showPlayVoiceButton,
    showCancelButton,
    timerEndDate,
    nowDateTimer,
    deltaDateTimer,
    getPlayerEndSeconds,
    dateNow,
    votedPlayerID,
    playedAudio,
    bunkerData,
    playersData,
    userData,
    voitingData,
    isVoiting,
    userVoitingChoice,
    getAllPlayersSelectToChangeAdmin,
    getAlivePlayers,
    getMyPlayerData,
    getMyUserData,
    getActivePlayersFromUserData,
    timerStart,
    timerSeconds,
    isPauseTimer,
    activeTimers,
    getPlayerForSelect,
    getPlayerForSelectAndAll,
    logs,
    diceNum,
    showDice6,
    showDice20,
    getCatastropheEndSeconds,
    getAllPlayersSelectToAdminFunctionsAndAll,
    setData,
    getCharForPlayer,
    getDescriptionForChar,
    clearData,
    getLogHtml,
    getNonVoitingUsersNicknames,
  }
})

export const useSelectedGameGameplay = defineStore('selectedGameGameplay', () => {
  const selectedGameData = useSelectedGameData()
  const userSocket = useUserSocketStore()
  const globalPreloader = usePreloaderStore()
  const globalPopup = useGlobalPopupStore()
  
  let timerInterval = setInterval(() => {
  }, 1000)
  clearInterval(timerInterval)
  
  function openChart(el, charName) {
    showConfirmBlock(el.target, () => {
      if((charName==='spec1' || charName==='spec2') && selectedGameData.getMyPlayerData[charName].isOpen) {
        setLocalData(`game:${router.currentRoute.value.params.id}:${charName}`,{openedBefore:true,date: +(new Date())})
      }
      
      
      selectedGameData.getMyPlayerData[charName].isLoading = true
      userSocket.emit('openChart', charName)
      userSocket.on('openChart:good', (chartName) => {
        selectedGameData.getMyPlayerData[chartName].isLoading = false;
        userSocket.removeListener('openChart:good')
      })
    }, 'Открыть/Закрыть характеристику для всех игроков?')
  }
  
  function mvpReload(event, charName) {
    showConfirmBlock(event.target, () => {
      globalPreloader.activate()
      userSocket.emit('refreshChartMVP', charName)
      userSocket.on('refreshChartMVP:good', (chartName) => {
        globalPreloader.deactivate()
        selectedGameData.getMyPlayerData.isMVPRefresh = true;
        userSocket.removeListener('refreshChartMVP:good')
      })
    }, 'Вы уверены, что хотите поменять характеристику?')
  }
  
  function voteHandler(userId) {
    userSocket.on('voiting:choiseUser:good', () => {
      selectedGameData.userVoitingChoice = selectedGameData.userData[userId].nickname
      selectedGameData.voitingData.isLoading = false
      selectedGameData.votedPlayerID = 0
    })
    selectedGameData.voitingData.isLoading = true
    userSocket.emit('voiting:choiseUser', +userId)
  }
  
  function startTimer(second) {
    stopTimer()
    switch(second) {
      case 15: {
        selectedGameData.activeTimers[0] = true
        break;
      }
      case 30: {
        selectedGameData.activeTimers[1] = true
        break;
      }
      case 60: {
        selectedGameData.activeTimers[2] = true
        break;
      }
    }
    selectedGameData.timerSeconds = second
    selectedGameData.timerEndDate = new Date(+new Date() + second*1000)
    // selectedGameData.deltaDateTimer = new Date(new Date() - new Date(nowDate))
    selectedGameData.timerStart = true
    selectedGameData.isPauseTimer = false
    timerInterval = setInterval(() => {
      if (Math.floor((new Date(selectedGameData.timerEndDate) - selectedGameData.dateNow) / 1000)<1) {
        stopTimer()
      }
    }, 1000)
  }
  
  function pauseTimer() {
    selectedGameData.isPauseTimer = true
    selectedGameData.timerSeconds = selectedGameData.getPlayerEndSeconds
    clearInterval(timerInterval)
  }
  
  function resumeTimer(seconds) {
    startTimer(seconds)
  }
  
  function stopTimer() {
    selectedGameData.timerSeconds = 0
    selectedGameData.timerStart = false
    selectedGameData.isPauseTimer = false
    selectedGameData.timerEndDate = new Date()
    clearInterval(timerInterval)
    selectedGameData.activeTimers = selectedGameData.activeTimers.map(item => item = false)
  }
  
  function rollDice(type, num) {
    if (type===6) {
      selectedGameData.showDice6 = true
      selectedGameData.diceNum = 0
      setTimeout(() => {
        selectedGameData.diceNum = num
      }, 300)
      setTimeout(() => {
        // globalPopup.activate(`Бросили кубик с ${type} гранями`,`Выпало значение ${num}`)
        selectedGameData.showDice6 = false
      }, 3000)
    }
    else {
      selectedGameData.showDice20 = true
      selectedGameData.diceNum = 0
      setTimeout(() => {
        selectedGameData.diceNum = num
      }, 100)
      setTimeout(() => {
        // globalPopup.activate(`Бросили кубик с ${type} гранями`,`Выпало значение ${num}`)
        selectedGameData.showDice20 = false
      }, 2700)
    }
    
  }
  
  return {
    openChart,
    mvpReload,
    voteHandler,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    rollDice,
  }
})
