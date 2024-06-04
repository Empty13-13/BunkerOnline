import router from "@/router/index.js";
import { usePreloaderStore } from "@/stores/preloader.js";
import { useGlobalPopupStore } from "@/stores/popup.js";
import { useAuthStore } from "@/stores/auth.js";
import { useMyProfileStore } from "@/stores/profile.js";
import { useSelectedGame, useSelectedGameData } from "@/stores/game.js";


export async function switchError(data, socket) {
  console.log('setError KURVA', data)
  const message = data.message
  const status = data.status
  const functionName = data.functionName
  const vars = data.vars
  const color = data.color
  const wrongData = data.wrongData
  console.log('setError KURVA', data)
  
  const globalPopup = useGlobalPopupStore()
  const globalPreloader = usePreloaderStore()
  const authStore = useAuthStore()
  const myProfile = useMyProfileStore()
  const selectedGame = useSelectedGame()
  const selectedGameData = useSelectedGameData()
  
  switch(status) {
    case 403: {
      console.log('Ошибка 403')
      globalPreloader.activate()
      if (!socket.auth._retry) {
        await authStore.refreshToken()
        socket.close()
        socket.auth._retry = true
        socket.auth.token = myProfile.token
        socket.connect()
        let countReconnect = 1
        let tryReEmitInterval = setInterval(() => {
          console.log(functionName)
          
          if (socket.connected) {
            if (vars) {
              console.log('Пробуем ещё раз с vars', ...vars)
              socket.emit(functionName, ...vars)
            }
            else {
              console.log('Пробуем ещё раз БЕЗ vars')
              socket.emit(functionName)
            }
            
            socket.auth._retry = false
            clearInterval(tryReEmitInterval)
            globalPreloader.deactivate()
          }
          else {
            console.log('Счетчик Реконнекта',countReconnect)
            countReconnect++
            if (countReconnect>2) {
              clearInterval(tryReEmitInterval)
              globalPreloader.deactivate()
            }
          }
        }, 100)
      }
      else {
        console.log('Не смогли ничего сделать SOCKET LOGIC 403')
        await router.push({name: 'home'})
        socket.auth._retry = false
        globalPopup.activate('Ошибка подключения', message, 'red')
        globalPreloader.deactivate()
      }
      break;
    }
    case 404: {
      selectedGame.gameLoadText = `Комната "${router.currentRoute.value.params.id}" не найдена`
      selectedGame.clearData()
      break;
    }
    case 469: {
      myProfile.clearUserInfo()
      await router.push({name:'home'})
      globalPopup.activate('Сообщение от сервера','Ваш аккаунт был забанен за нарушение правил. Для уточнения вопроса обратитесь к администрации сайта','red')
      break;
    }
    case 512: {
      selectedGame.isStarted = false
      globalPopup.activate('Ошибка создания данных', message, 'red')
      break;
    }
    case 601: {
      globalPopup.activate('Ошибка открытия характеристики', message, 'red')
      selectedGameData.getMyPlayerData[wrongData.chartName].isLoading = false;
      break;
    }
    case 701: {
      globalPopup.activate('Ошибка', message + "<br>" + wrongData.join('<br>'), color || 'red')
      break;
    }
    
    default: {
      globalPopup.activate('Ошибка', message, color || 'red')
    }
  }
}