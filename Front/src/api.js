import axios from "axios";
import { useAuthStore } from "@/stores/auth.js";

const apiLink = import.meta.env.VITE_SERVER_API_LINK
const axiosInstance = axios.create({
  baseURL: apiLink
})

axiosInstance.interceptors.request.use((config) => {
  if (useAuthStore().userInfo.token) {
    let headers = config.headers
    headers.Authorization = 'Bearer ' + useAuthStore().userInfo.token
    config.headers = headers
  }
  return config
})

axiosInstance.interceptors.response.use((response) => {
  console.log('AXIOS RESPONSE: ', response)
  return response
}, async function(error) {
  console.log('AXIOS ERROR: ', Promise.reject(error))
  
  const authStore = useAuthStore()
  const originalRequest = error.config
  
  if (error.response.status===401 && !originalRequest._retry) {
    originalRequest._retry = true
    try {
      const newTokens = await axios.post('/refresh', {
        refreshToken: JSON.parse(localStorage.getItem('userTokens')).refreshToken
      })
      console.log("New tokens: ", newTokens.data)
      
      authStore.userInfo.token = newTokens.data.token
      authStore.userInfo.refreshToken = newTokens.data.refreshToken
      
      localStorage.setItem('userTokens', JSON.stringify({
        token: newTokens.data.token,
        refreshToken: newTokens.data.refreshToken,
      }))
    } catch(e) {
      console.log(e)
    }
  }
  
  return Promise.reject(error);
})

export default axiosInstance