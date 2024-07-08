import { defineStore } from "pinia";
import { ref } from "vue";
import { useAuthStore } from "@/stores/auth.js";
import { useMyProfileStore } from "@/stores/profile.js";
import { usePreloaderStore } from "@/stores/preloader.js";
import { useGlobalPopupStore } from "@/stores/popup.js";
import { useHostFunctionalStore, useSelectedGame } from "@/stores/game.js";
import { adminSocket, userSocket } from "@/socket/sockets.js";
import router from "@/router/index.js";
import { switchError } from "@/logics/socketLogic.js";

export const useAdminSocketStore = defineStore('adminSocket', () => {
  const connected = ref(false)
  
  const authStore = useAuthStore()
  const myProfile = useMyProfileStore()
  const globalPreloader = usePreloaderStore()
  const globalPopup = useGlobalPopupStore()
  const selectedGame = useSelectedGame()
  
  function bindEvents() {
    adminSocket.on('setError', async data => {
      await switchError(data,adminSocket)
      globalPreloader.deactivate()
    })
    adminSocket.on('sendMessage', data => {
      const title = data.title
      const message = data.message
      const color = data.color
      globalPopup.activate(title || 'Сообщение от сервера', message || '', color)
    })
    adminSocket.on('sendMessage:timer', data => {
      const title = data.title
      const message = data.message
      const color = data.color
      globalPopup.activate(title || 'Сообщение от сервера', message || '', color,true)
    })
  }
  
  function _connect() {
    adminSocket.auth = {
      token: myProfile.token,
      idRoom: router.currentRoute.value.path.split('=')[1],
      _retry: false,
    }
    adminSocket.connect()
    connected.value = adminSocket.connected
    console.log('Подключились к функционалу админа')
  }
  
  function close() {
    adminSocket.close()
    adminSocket.removeAllListeners()
    connected.value = adminSocket.connected
    console.log('Разрываем с админом SOCKET.IO')
  }
  
  function emit(funcName, ...args) {
    adminSocket.emit(funcName,...args)
  }
  
  function on(funcName,functionStr) {
    adminSocket.on(funcName,functionStr)
  }
  
  function removeListener(funcName) {
    adminSocket.removeListener(funcName)
  }
  
  function setConnect() {
    if(myProfile.isAdmin) {
      if(!connected.value) {
        console.log('Соединяем с админом SOCKET.IO')
        bindEvents()
        _connect()
      }
    }
  }
  
  return {
    connected,
    bindEvents,
    _connect,
    setConnect,
    close,
    emit,
    on,
    removeListener,
  }
})