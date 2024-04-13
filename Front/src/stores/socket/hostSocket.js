import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import router from "@/router/index.js";
import { useAuthStore } from "@/stores/auth.js";
import { useMyProfileStore } from "@/stores/profile.js";
import { usePreloaderStore } from "@/stores/preloader.js";
import { useGlobalPopupStore } from "@/stores/popup.js";
import { useSelectedGame } from "@/stores/game.js";
import { hostSocket } from "@/socket/sockets.js";

export const useHostSocketStore = defineStore('hostSocket', () => {
  const connected = ref(false)
  
  const authStore = useAuthStore()
  const myProfile = useMyProfileStore()
  const globalPreloader = usePreloaderStore()
  const globalPopup = useGlobalPopupStore()
  const selectedGame = useSelectedGame()
  
  function bindEvents() {
    
    hostSocket.on('setError', async data => {
      const message = data.message
      const status = data.status
      const functionName = data.functionName
      const vars = data.vars
      const color = data.color
      console.log('setError KURVA HOSTSOCKET', data)
      
      switch(status) {
        case 403: {
          globalPreloader.activate()
          if (!hostSocket.auth._retry) {
            await authStore.refreshToken()
            hostSocket.close()
            hostSocket.auth._retry = true
            hostSocket.auth.token = myProfile.token
            hostSocket.connect()
            setTimeout(() => hostSocket.emit(functionName, vars || null), 1000)
          }
          else {
            await router.push({name: 'home'})
            globalPopup.activate('Ошибка подключения', message, 'red')
          }
          break;
        }
        case 404: {
          selectedGame.gameLoadText = `Комната "${router.currentRoute.value.params.id}" не найдена`
          selectedGame.clearData()
          break;
        }
        default: {
          globalPopup.activate('Ошибка', message, color || 'red')
        }
      }
      
      globalPreloader.deactivate()
    })
    
    hostSocket.on('connect', socket => {
      console.log('Подключились к функционалу хоста')
    })
    
    hostSocket.on('disconnect', socket => {
      console.log('Отключились от функционала хоста')
    })
  }
  
  function connect() {
    hostSocket.auth = {
      noregToken: authStore.getLocalData('noregToken'),
      token: myProfile.token,
      idRoom: router.currentRoute.value.path.split('=')[1],
      _retry: false,
    }
    hostSocket.connect()
    connected.value = hostSocket.connected
  }
  
  function close() {
    hostSocket.close()
    hostSocket.off()
    hostSocket.removeAllListeners();
    connected.value = hostSocket.connected
  }
  
  /**
   * Обычный Emit через socket.io
   * @param {string} funcName
   * @param [args]
   */
  function emit(funcName,...args) {
    hostSocket.emit(funcName,...args)
  }
  
  function setConnect() {
    if (selectedGame.isHost) {
      if (!hostSocket.connected) {
        connect()
      }
    }
    else {
      if (hostSocket.connected) {
        close()
      }
    }
  }
  
  return {
    connected,
    bindEvents,
    connect,
    close,
    emit,
    setConnect,
  }
})