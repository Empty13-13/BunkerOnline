import axios from "axios";
import { useAuthStore } from "@/stores/auth.js";
import { useActionsProfileStore, useMyProfileStore } from "@/stores/profile.js";
import { useGlobalPopupStore } from "@/stores/popup.js";
import axiosRetry from "axios-retry";
import router from "@/router/index.js";
import { getLocalData } from "@/plugins/functions.js";

const apiLink = import.meta.env.VITE_SERVER_API_LINK
const axiosInstance = axios.create({
  baseURL: apiLink,
  timeout: 15000,
  maxRedirects: 3,
})

axiosInstance.interceptors.request.use((config) => {
  const myProfile = useMyProfileStore()
  if (myProfile.token) {
    let headers = config.headers
    headers.Authorization = 'Bearer ' + myProfile.token
    config.headers = headers
  }
  else if (getLocalData('userTokens') && getLocalData('userTokens').token) {
    let headers = config.headers
    headers.Authorization = 'Bearer ' + getLocalData('userTokens').token
    config.headers = headers
  }
  return config
})

axiosInstance.interceptors.response.use((response) => {
  return response
}, async function(error) {
  const globalPopup = useGlobalPopupStore()
  const myProfile = useMyProfileStore()
  
  if (!error.response) {
    error.response = {message: 'Сервер не отвечает'}
    globalPopup.activate('Ошибка соединения с сервером',
      'Пожалуйста,проверьте интернет-соединение, либо попробуйте перезагрузить страницу', 'red')
  }
  
  console.log(error)
  
  
  if (error.response.status===429) {
    console.log('Слишком много попыток')
    const globalPopup = useGlobalPopupStore()
    globalPopup.activate('Слишком много запросов',
      'Вы использовали слишком много запросов. Пожалуйста, попробуйте ещё раз через 15 минут', 'red')
    
    error.response.data = {
      message: 'Вы превысили количество запросов, попробуйте позже',
      errors: [{input: '', type: 'To many requests'}]
    }
  }
  else if (error.response.status===469) {
    myProfile.clearUserInfo()
    await router.push({name: 'home'})
    globalPopup.activate('Сообщение от сервера',
      'Ваш аккаунт был забанен за нарушение правил. Для уточнения вопроса обратитесь к администрации сайта', 'red')
  }
  
  return Promise.reject(error);
})

axiosRetry(axiosInstance, {
  retries: 1,
  retryCondition: (error) => {
    return error.response.status===401;
  },
  retryDelay: () => {
    return 1000;
  },
  onRetry: async (retryCount, error, requestConfig) => {
    console.log(retryCount)
    console.log(error.response.status)
    console.log('Retry count:', retryCount)
    
    if (error.response.status===401) {
      const myProfile = useMyProfileStore()
      const actionsProfile = useActionsProfileStore()
      
      if (!myProfile.token && !getLocalData('userTokens')) {
        console.log('Не нашли ни того ни другого')
      }
      console.log("refresh token API (AXIOS RETRY)")
      console.log('actionsProfile.isLoadingNewToken',actionsProfile.isLoadingNewToken)
      if (!actionsProfile.isLoadingNewToken) {
        try {
          actionsProfile.isLoadingNewToken = true
          const newTokens = await axios.post(apiLink + "/refresh", {}, {
            withCredentials: true,
            headers: {Authorization: 'Bearer ' + myProfile.token}
          })
          
          myProfile.token = newTokens.data.accessToken
          
          localStorage.setItem('userTokens', JSON.stringify({
            token: newTokens.data.accessToken,
          }))
        } catch(e) {
          console.log("Refresh Error (AXIOS RETRY): ", e)
          myProfile.clearUserInfo()
          await router.push('/login')
        } finally {
          actionsProfile.isLoadingNewToken = false
        }
      }
    }
  }
})

export default axiosInstance