import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import router from "@/router/index.js";
import { useAuthStore } from "@/stores/auth.js";
import { useMyProfileStore } from "@/stores/profile.js";
import { usePreloaderStore } from "@/stores/preloader.js";
import { useGlobalPopupStore } from "@/stores/popup.js";
import { useSelectedGame, useSelectedGameData } from "@/stores/game.js";
import { userSocket } from "@/socket/sockets.js";
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
  
  function bindEvents() {
    userSocket.on('setError', async data => {
      await switchError(data)
      
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
      globalPopup.activate('Сообщение от комнаты', 'Вас исключили из комнаты')
      await router.push({name: 'home'})
    })
    
    userSocket.on('setNoregToken', noRegToken => {
      console.log('setNoregToken', noRegToken)
      myProfile.setNoregToken(noRegToken)
    })
    
    userSocket.on('joinedRoom', data => {
      globalPreloader.activate()
      console.log('Делаем getAwaitRoomData')
      userSocket.emit('getAwaitRoomData')
    })
    
    userSocket.on('setAwaitRoomData', data => {
      if (!data) {
        selectedGame.gameLoadText.value = `Комната "${router.currentRoute.value.params.id}" не найдена`
      }
      else {
        if(data.hostId && data.userId) {
          globalPreloader.activate()
          console.log('Включаем прелоадер, т.к. обновляем глобальные данные')
        }
        selectedGame.setInitialData(data)
        console.log('setAwaitRoomData', data)
      }
      // hostSocket.setConnect()
      
      
      globalPreloader.deactivate()
    })
    
    userSocket.on('roomClosed', async (data) => {
      globalPopup.activate('Комната закрыта', '', 'gold')
      await router.push({name: 'home'})
    })
    
    userSocket.on('sendMessage', data => {
      const title = data.title
      const message = data.message
      const color = data.color
      globalPopup.activate(title || 'Сообщение от сервера', message || '', color)
    })
    
    userSocket.on('startedGame', data => {
      console.log('Игра началась')
      globalPreloader.activate()
      userSocket.emit('loadAllGameData')
    })
    
    userSocket.on('setAllGameData', data => {
      console.log('Приняли все данные по игре', data)
      selectedGameData.setData(data)
      selectedGame.isStarted = true
      globalPreloader.deactivate()
    })
    
    userSocket.on("connect", () => {
      console.log("userSocket",userSocket)
      console.log('Подключились по Socket.io')
      globalPreloader.activate()
      
      if (!userSocket.auth._retry) {
        if (selectedGame.isNewGame) {
          console.log('Создаем комнату')
          userSocket.emit('createRoom')
          selectedGame.isNewGame = false
        }
        else {
          console.log('joinRoom Присоединяемся к комнате, т.к. она уже создана')
          userSocket.emit('joinRoom')
        }
      }
    });
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
  function emit(funcName,...args) {
    userSocket.emit(funcName,...args)
  }
  
  return {
    connected,
    bindEvents,
    connect,
    close,
    emit
  }
})