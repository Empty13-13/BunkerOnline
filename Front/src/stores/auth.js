import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import axiosInstance from '../api.js'
import router from "@/router/index.js";

const apiLink = import.meta.env.VITE_SERVER_API_LINK

export const useAuthStore = defineStore('auth', () => {
  const userInfo = ref({
    token: '',
    userId: '',
    nickname: ''
  })
  const errors = ref({
    message: '',
    input: '',
  })
  const isLoader = ref(false)
  
  const auth = async (payload, type) => {
    const stringUrl = type==='signUp'? 'registration':'login'
    isLoader.value = true
    errors.value = {
      message: '',
      input: '',
    }
    
    try {
      let response = await axiosInstance.post(`/${stringUrl}`, {...payload},
        {
          withCredentials: true
        })
      userInfo.value = {
        token: response.data.accessToken,
        userId: response.data.user.id,
        nickname: response.data.user.nickname,
      }
      localStorage.setItem('userTokens', JSON.stringify({
        token: userInfo.value.token,
      }))
      
    } catch(e) {
      errors.value.message = e.response.data.message
      errors.value.input = e.response.data.errors[0].input
    } finally {
      isLoader.value = false
    }
  }
  
  async function logoutUser() {
    try {
      let response = axiosInstance.post('/logout', {}, {
        withCredentials: true
      })
    } catch(e) {
      console.log('Error logout: ', e.message)
    }
    
    clearUserInfo()
    await router.push('/login')
  }
  
  function clearUserInfo() {
    userInfo.value.token = ''
    userInfo.value.refreshToken = ''
    userInfo.value.userId = ''
    userInfo.value.nickname = ''
    
    localStorage.removeItem('userTokens')
  }
  
  return {auth, userInfo, errors, isLoader, logoutUser, clearUserInfo}
})