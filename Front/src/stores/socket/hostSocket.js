import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import router from "@/router/index.js";
import { useAuthStore } from "@/stores/auth.js";
import { useMyProfileStore } from "@/stores/profile.js";
import { usePreloaderStore } from "@/stores/preloader.js";
import { useGlobalPopupStore } from "@/stores/popup.js";
import { useHostFunctionalStore, useSelectedGame } from "@/stores/game.js";
import { hostSocket, userSocket } from "@/socket/sockets.js";
import { switchError } from "@/logics/socketLogic.js";

export const useHostSocketStore = defineStore('hostSocket', () => {
  const connected = ref(false)
  
  const authStore = useAuthStore()
  const myProfile = useMyProfileStore()
  const globalPreloader = usePreloaderStore()
  const globalPopup = useGlobalPopupStore()
  const selectedGame = useSelectedGame()
  const hostFunctional = useHostFunctionalStore()
  
  function bindEvents() {
    
    hostSocket.on('setError', async data => {
      await switchError(data,hostSocket) 
      
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
  function emit(funcName, ...args) {
    hostSocket.emit(funcName, ...args)
  }
  
  function on(funcName,functionStr) {
    hostSocket.on(funcName,functionStr)
  }
  function removeListener(funcName){
    hostSocket.removeListener(funcName)
  }
  
  function setConnect() {
    if (hostFunctional.haveAccess) {
      if (!hostSocket.connected) {
        console.log('Соединяем с хостом')
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
    on,
    removeListener,
    setConnect,
  }
})