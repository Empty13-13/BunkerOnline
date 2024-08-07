import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import router from "@/router/index.js";
import { useAuthStore } from "@/stores/auth.js";
import { useMyProfileStore } from "@/stores/profile.js";
import { usePreloaderStore } from "@/stores/preloader.js";
import { useGlobalPopupStore } from "@/stores/popup.js";
import { useSelectedGame, useSelectedGameData, useSelectedGameGameplay } from "@/stores/game.js";
import { hostSocket, userSocket } from "@/socket/sockets.js";
import { useHostSocketStore } from "@/stores/socket/hostSocket.js";
import { switchError } from "@/logics/socketLogic.js";

export const useUserSocketStore = defineStore('userSocket', () => {
  const connected = ref(false)
  
  const authStore = useAuthStore()
  const myProfile = useMyProfileStore()
  const globalPreloader = usePreloaderStore()
  const globalPopup = useGlobalPopupStore()
  const selectedGame = useSelectedGame()
  const hostSocket = useHostSocketStore()
  const selectedGameData = useSelectedGameData()
  const selectedGameGameplay = useSelectedGameGameplay()
  
  
  function bindEvents() {
    userSocket.on('setError', async data => {
      await switchError(data, userSocket)
      
      globalPreloader.deactivate()
    })
    userSocket.on("connect_error", (err) => {
      globalPreloader.deactivate()
      // globalPopup.activate('Ошибка','Сервер перестал отвечать на запросы. Пожалуйста обновите страницу.')
    });
    userSocket.on('updateInitialInfo', () => {
      globalPreloader.activate()
      userSocket.emit('getAwaitRoomData')
    })
    userSocket.on('kickOut', async data => {
      globalPopup.activate('Сожалеем :(', 'Вас исключили из комнаты')
      await router.push({name: 'home'})
    })
    userSocket.on('setNoregToken', noRegToken => {
      console.log('setNoregToken', noRegToken)
      myProfile.setNoregToken(noRegToken)
    })
    userSocket.on('joinedRoom', data => {
      globalPreloader.activate()
      userSocket.emit('getAwaitRoomData')
    })
    userSocket.on('setAwaitRoomData', data => {
      if (!data) {
        selectedGame.gameLoadText.value = `Комната "${router.currentRoute.value.params.id}" не найдена`
      }
      else {
        if (data.hostId && data.userId) {
          globalPreloader.activate()
        }
        selectedGame.setInitialData(data)
        console.log('setAwaitRoomData', data)
        
        hostSocket.setConnect()
      }
      
      
      globalPreloader.deactivate()
    })
    userSocket.on('roomClosed', async (data) => {
      if(selectedGame.isStarted) {
        globalPopup.activate('Комната закрыта',
          'Для того чтобы узнать, остался ли ваш бункер в живых, вы можете пройти тест <a target="_blank" href="/test">Оценка выживаемости бункера</a>',
          'gold')
      } else {
        globalPopup.activate('Комната закрыта','','gold')
      }
      await router.push({name: 'home'})
    })
    userSocket.on('sendMessage', data => {
      const title = data.title
      const message = data.message
      const color = data.color
      globalPopup.activate(title || 'Сообщение от сервера', message || '', color)
    })
    userSocket.on('sendMessage:timer', data => {
      const title = data.title
      const message = data.message
      const color = data.color
      globalPopup.activate(title || 'Сообщение от сервера', message || '', color, true)
    })
    userSocket.on('startedGame', async data => {
      globalPreloader.activate()
      userSocket.emit('loadAllGameData')
      setTimeout(() => {
        window.scrollTo(0, 0);
      },0)
    })
    userSocket.on('setAllGameData', async data => {
      console.log('Приняли все данные по игре', data)
      if (!selectedGameData.getAlivePlayers) {
        setTimeout(() => {
          window.scrollTo(0, 0);
        },0)
      }
      selectedGameData.setData(data)
      selectedGame.isStarted = true
      globalPreloader.deactivate()
    })
    userSocket.on("connection:good", () => {
      console.log('Подключились по Socket.io')
      globalPreloader.activate()
      
      if (!userSocket.auth._retry) {
        if (selectedGame.isNewGame) {
          userSocket.emit('createRoom')
          selectedGame.isNewGame = false
        }
        else {
          userSocket.emit('joinRoom')
        }
      }
      else {
        userSocket.emit('joinRoom')
      }
    });
    
    
    userSocket.on('timer:start', ({seconds, nowDate}) => {
      selectedGameGameplay.startTimer(seconds)
    })
    userSocket.on('timer:pause', () => {
      selectedGameGameplay.pauseTimer()
    })
    userSocket.on('timer:resume', ({seconds, nowDate}) => {
      selectedGameGameplay.resumeTimer(seconds)
    })
    userSocket.on('timer:stop', () => {
      selectedGameGameplay.stopTimer()
    })
    userSocket.on('rollTheDice:6', (num) => {
      selectedGameGameplay.rollDice(6, num)
    })
    userSocket.on('rollTheDice:20', (num) => {
      selectedGameGameplay.rollDice(20, num)
    })
    
    userSocket.on('refresh:professionByHour:good', () => {
      globalPopup.activate('Сообщение от ведущего', 'Смена специальности по часовой стрелке', 'green', true)
    })
    userSocket.on('voiting:start', async () => {
      globalPopup.activate('Сообщение от ведущего', 'Голосование началось', 'green', true)
      await router.push('#voting')
    })
    
    
    userSocket.on('restartGame', () => {
      globalPreloader.activate()
      selectedGameData.logs = []
      globalPopup.activate('Сообщение от ведущего', 'Игра началась заново', 'green', true)
      globalPreloader.deactivate()
    })
  }
  
  function connect() {
    userSocket.auth = {
      noregToken: authStore.getLocalData('noregToken'),
      token: myProfile.token,
      idRoom: router.currentRoute.value.path.split('=')[1],
      _retry: false,
    }
    userSocket.connect()
    connected.value = userSocket.connected
  }
  
  function close() {
    userSocket.close()
    userSocket.off()
    userSocket.removeAllListeners();
    connected.value = userSocket.connected
  }
  
  /**
   * Обычный Emit через socket.io
   * @param {string} funcName
   * @param [args]
   */
  function emit(funcName, ...args) {
    userSocket.emit(funcName, ...args)
  }
  
  function on(funcName, functionStr) {
    userSocket.on(funcName, functionStr)
  }
  
  function removeListener(funcName) {
    userSocket.removeListener(funcName)
  }
  
  return {
    connected,
    bindEvents,
    connect,
    close,
    emit,
    on,
    removeListener,
  }
})