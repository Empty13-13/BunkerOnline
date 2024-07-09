import { defineStore } from "pinia";
import { ref } from "vue";
import { useAuthStore } from "@/stores/auth.js";
import { useMyProfileStore } from "@/stores/profile.js";
import { usePreloaderStore } from "@/stores/preloader.js";
import { useGlobalPopupStore } from "@/stores/popup.js";
import { useHostFunctionalStore, useSelectedGame } from "@/stores/game.js";
import { authSocket } from "@/socket/sockets.js";
import router from "@/router/index.js";
import { switchError } from "@/logics/socketLogic.js";

export const useAuthSocketStore = defineStore('authSocket', () => {
  const connected = ref(false)
  
  const authStore = useAuthStore()
  const myProfile = useMyProfileStore()
  const globalPreloader = usePreloaderStore()
  const globalPopup = useGlobalPopupStore()
  
  function bindEvents() {
    authSocket.on('setError', async data => {
      await switchError(data, authSocket)
      globalPreloader.deactivate()
    })
    authSocket.on('sendMessage', data => {
      const title = data.title
      const message = data.message
      const color = data.color
      globalPopup.activate(title || 'Сообщение от сервера', message || '', color)
    })
    authSocket.on('sendMessage:timer', data => {
      const title = data.title
      const message = data.message
      const color = data.color
      globalPopup.activate(title || 'Сообщение от сервера', message || '', color, true)
    })
    authSocket.on('logout',() => {
      location.reload()
    })
  }
  
  function _connect() {
    authSocket.auth = {
      token: myProfile.token,
      _retry: false,
    }
    authSocket.connect()
    connected.value = authSocket.connected
    console.log('Подключились к функционалу AUTH')
  }
  
  function close() {
    authSocket.close()
    authSocket.removeAllListeners()
    connected.value = authSocket.connected
    console.log('Разрываем с AUTH SOCKET.IO')
  }
  
  function emit(funcName, ...args) {
    authSocket.emit(funcName, ...args)
  }
  
  function on(funcName, functionStr) {
    authSocket.on(funcName, functionStr)
  }
  
  function removeListener(funcName) {
    authSocket.removeListener(funcName)
  }
  
  function setConnect() {
    if (!connected.value) {
      console.log('Соединяем с AUTH SOCKET.IO')
      bindEvents()
      _connect()
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