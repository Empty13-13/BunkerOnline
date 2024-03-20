import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import axiosInstance from '../api.js'
import router from "@/router/index.js";
import axios from "axios";

const apiLink = import.meta.env.VITE_SERVER_API_LINK

export const useAuthStore = defineStore('auth', () => {
  const userInfo = ref({
    token: '',
    userId: 0,
    nickname: 'Загрузка...',
    access: 'noreg',
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
    
    function isLogin() {
      return type==='login'
    }
    
    try {
      let response = await axiosInstance.post(`/${stringUrl}`, {...payload},
        {
          withCredentials: isLogin()
        })
      console.log(response)
      
      if (isLogin()) {
        userInfo.value = {
          token: response.data.accessToken,
          userId: response.data.user.id,
          nickname: response.data.user.nickname,
          access: response.data.accsessLevel
        }
        
        localStorage.setItem('userTokens', JSON.stringify({
          token: userInfo.value.token,
        }))
        
        localStorage.setItem('userId', userInfo.value.userId.toString())
      }
      else {
        return response.data.message
      }
      
    } catch(e) {
      errors.value.message = e.response.data.message
      errors.value.input = e.response.data.errors[0].input
    } finally {
      isLoader.value = false
    }
  }
  
  async function refreshToken() {
    try {
      const newTokens = await axiosInstance.post('/refresh', {}, {
        withCredentials: true
      })
      console.log("Обратились за новым токеном: ", newTokens.data)
      
      userInfo.value.token = newTokens.data.accessToken
      
      localStorage.setItem('userTokens', JSON.stringify({
        token: newTokens.data.accessToken,
      }))
    } catch(e) {
      console.log("Refresh Error: ", e)
      clearUserInfo()
      await router.push('/login')
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
    userInfo.value.userId = 0
    userInfo.value.nickname = ''
    userInfo.value.access = 'noreg'
    
    localStorage.clear()
  }
  
  //========================================================================================================================================================
  
  async function getUserInfo(id) {
    try {
      let response = await axiosInstance.get(`/user=${id}`)
      return response
    } catch(e) {
      console.log(e.message)
    }
    
  }
  
  async function setMyProfileInfo() {
    if (userInfo.value.userId) {
      try {
        let response = await getUserInfo(userInfo.value.userId)
        console.log('setMyProfileInfo: ', response)
        userInfo.value.nickname = response.data.nickname
        userInfo.value.access = response.data.accsessLevel
      } catch(e) {
        console.log(e.message)
        await logoutUser()
      }
    }
    else {
      await clearUserInfo()
    }
  }
  
  async function updateProfileInfo(id, payload) {
    let response = await axiosInstance.post(`/updateUser=${id}`, {...payload},
      {
        withCredentials: true
      })
    console.log(response)
    return response
  }
  
  
  return {
    auth,
    userInfo,
    errors,
    isLoader,
    logoutUser,
    clearUserInfo,
    refreshToken,
    getUserInfo,
    setMyProfileInfo,
    updateProfileInfo
  }
})