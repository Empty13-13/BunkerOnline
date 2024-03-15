import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import axiosInstance from '../api.js'

const apiLink = import.meta.env.VITE_SERVER_API_LINK

export const useAuthStore = defineStore('auth', () => {
  const userInfo = ref({
    token: '',
    refreshToken: '',
    expiresIn: '',
    email: '',
    userId: '',
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
    console.log('LINK: ', apiLink)
    
    try {
      let response = await axiosInstance.post(`/${stringUrl}`, {
        ...payload
      })
      userInfo.value = {
        token: response.data.accessToken,
        refreshToken: response.data.refreshToken,
        email: response.data.user.email,
        userId: response.data.user.id,
        nickname: response.data.user.nickname,
      }
      localStorage.setItem('userTokens', JSON.stringify({
        token: userInfo.value.token,
        refreshToken: userInfo.value.refreshToken,
      }))
      
      console.log(response)
    } catch(e) {
      console.log('Auth error: ',e)
      errors.value.message = e.response.data.message
      errors.value.input = e.response.data.errors[0].input
      console.log('Error value:', errors.value)
      console.log("Error message: ", errors.value.message)
    } finally {
      isLoader.value = false
    }
  }
  return {auth, userInfo, errors, isLoader}
})