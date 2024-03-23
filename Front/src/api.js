import axios from "axios";
import { useAuthStore } from "@/stores/auth.js";
import { useMyProfileStore } from "@/stores/profile.js";
import router from "@/router/index.js";

const apiLink = import.meta.env.VITE_SERVER_API_LINK
const axiosInstance = axios.create({
  baseURL: apiLink
})

axiosInstance.interceptors.request.use((config) => {
  if (useMyProfileStore().token) {
    let headers = config.headers
    headers.Authorization = 'Bearer ' + useMyProfileStore().token
    config.headers = headers
  }
  return config
})

axiosInstance.interceptors.response.use((response) => {
  return response
}, async function(error) {
  const myProfileStore = useMyProfileStore()
  const originalRequest = error.config
  
  if (error.response.status===401 && !originalRequest._retry) {
    originalRequest._retry = true
    try {
      const newTokens = await axios.post('/refresh', {},{
        withCredentials: true
      })
      console.log("New tokens: ", newTokens.data)
      
      myProfileStore.token = newTokens.data.token
      localStorage.setItem('userTokens', JSON.stringify({
        token: myProfileStore.token,
      }))
    } catch(e) {
      console.log(e)
      myProfileStore.clearUserInfo()
      await router.push('/login')
    }
  }
  
  return Promise.reject(error);
})

export default axiosInstance