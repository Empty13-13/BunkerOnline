import axios from "axios";
import { useAuthStore } from "@/stores/auth.js";
import { useMyProfileStore } from "@/stores/profile.js";
import { useGlobalPopupStore } from "@/stores/popup.js";
import axiosRetry from "axios-retry";
import router from "@/router/index.js";

const apiLink = import.meta.env.VITE_SERVER_API_LINK
const axiosInstance = axios.create({
  baseURL: apiLink,
  timeout: 3500,
  maxRedirects: 3,
})

axiosInstance.interceptors.request.use((config) => {
  const myProfile = useMyProfileStore()
  console.log(config['axios-retry'])
  if (myProfile.token) {
    let headers = config.headers
    headers.Authorization = 'Bearer ' + myProfile.token
    config.headers = headers
  }
  return config
})

axiosInstance.interceptors.response.use((response) => {
  return response
}, async function(error) {
  const globalPopup = useGlobalPopupStore()
  
  if(!error.response) {
    error.response = {message: 'Сервер не отвечает'}
    globalPopup.activate('Ошибка соединения с сервером','Пожалуйста,проверьте интернет-соединением, либо попробуйте перезагрузить страницу')
  }
  
  console.log(error)
  
  
  if(error.response.status===429) {
    console.log('Слишком много попыток')
    const globalPopup = useGlobalPopupStore()
    globalPopup.activate('Слишком много запросов','Вы использовали слишком много запросов. Пожалуйста, попробуйте ещё раз через 15 минут')
    
    error.response.data = {message:'Вы превысили количество запросов, попробуйте позже',errors:[{input: '',type:'To many requests'}]}
  }
  
  return Promise.reject(error);
})

axiosRetry(axiosInstance, {
  retries: 1,
  retryCondition: (error) => {
    return error.response.status===401;
  },
  retryDelay: () => {return 1000;},
  onRetry: async (retryCount, error, requestConfig) => {
    console.log(retryCount)
    console.log(error.response.status)
    
    if (error.response.status===401) {
      console.log("refresh token API (AXIOS RETRY)")
      const myProfile = useMyProfileStore()
      
      try {
        const newTokens = await axios.post(apiLink+"/refresh",{},{
          withCredentials: true
        })
        
        myProfile.token = newTokens.data.accessToken
        
        localStorage.setItem('userTokens', JSON.stringify({
          token: newTokens.data.accessToken,
        }))
      } catch(e) {
        console.log("Refresh Error (AXIOS RETRY): ", e)
        myProfile.clearUserInfo()
        await router.push('/login')
      }
    }
  }
})

export default axiosInstance