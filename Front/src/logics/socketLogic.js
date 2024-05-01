import { userSocket } from "@/socket/sockets.js";
import router from "@/router/index.js";
import { usePreloaderStore } from "@/stores/preloader.js";
import { useGlobalPopupStore } from "@/stores/popup.js";
import { useAuthStore } from "@/stores/auth.js";
import { useMyProfileStore } from "@/stores/profile.js";
import { useSelectedGame } from "@/stores/game.js";
export async function switchError(data) {
  console.log('setError KURVA', data)
  const message = data.message
  const status = data.status
  const functionName = data.functionName
  const vars = data.vars
  const color = data.color
  console.log('setError KURVA', data)
  
  const globalPopup = useGlobalPopupStore()
  const globalPreloader = usePreloaderStore()
  const authStore = useAuthStore()
  const myProfile = useMyProfileStore()
  const selectedGame = useSelectedGame()
  
  switch(status) {
    case 403: {
      globalPreloader.activate()
      if (!userSocket.auth._retry) {
        await authStore.refreshToken()
        userSocket.close()
        userSocket.auth._retry = true
        userSocket.auth.token = myProfile.token
        userSocket.connect()
        if (vars) {
          userSocket.emit(functionName, ...vars)
        }
        else {
          userSocket.emit(functionName)
        }
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
    case 512: {
      selectedGame.isStarted = false
      globalPopup.activate('Ошибка создания данных', message, 'red')
      break;
    }
    default: {
      globalPopup.activate('Ошибка', message, color || 'red')
    }
  }
}