import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import axiosInstance from '../api.js'
import router from "@/router/index.js";
import { useActionsProfileStore, useMyProfileStore } from "@/stores/profile.js";

export const useAuthStore = defineStore('auth', () => {
  const errors = ref({
    message: '',
    input: '',
  })
  const isLoader = ref(false)
  const myProfile = useMyProfileStore()
  
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
        myProfile.token = response.data.accessToken
        myProfile.id = response.data.user.id
        myProfile.nickname = response.data.user.nickname
        myProfile.access = response.data.accsessLevel
        
        localStorage.setItem('userTokens', JSON.stringify({
          token: myProfile.token,
        }))
        
        localStorage.setItem('userId', myProfile.id.toString())
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
      
      myProfile.token = newTokens.data.accessToken
      
      localStorage.setItem('userTokens', JSON.stringify({
        token: newTokens.data.accessToken,
      }))
    } catch(e) {
      console.log("Refresh Error: ", e)
      myProfile.clearUserInfo()
      await router.push('/login')
    }
  }
  
  async function logoutUser() {
    try {
      await axiosInstance.post('/logout', {}, {
        withCredentials: true
      })
    } catch(e) {
      console.log('Error logout: ', e.message)
    }
    
    const clearUser = () => myProfile.clearUserInfo()
    await router.push('/login')
  }
  
  //========================================================================================================================================================
  
  async function updateProfileInfo(id, payload) {
    console.log(id,payload,`/updateUser=${id}`)
    try {
      return await axiosInstance.post(`/updateUser=${id}`, {...payload},
        {
          withCredentials: true
        })
    } catch(e) {
      console.log(e.message)
      return Promise.reject(e);
    }
  }
  
  
  return {
    auth,
    errors,
    isLoader,
    logoutUser,
    refreshToken,
    updateProfileInfo
  }
})