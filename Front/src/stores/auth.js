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
      console.log(e.message)
      if(e && e.response && e.response.data) {
        errors.value.message = e.response.data.message
        errors.value.input = e.response.data.errors[0].input
      } else {
        errors.value.message = e.response.message
      }
    } finally {
      isLoader.value = false
    }
  }
  
  async function resetPassword(email) {
    isLoader.value = true
    errors.value = {
      message: '',
      input: '',
    }
    try {
      await axiosInstance.post('/resetPassword', {
        email: email
      })
    } catch(e) {
      if(e && e.response && e.response.data) {
        errors.value.message = e.response.data.message
        errors.value.input = e.response.data.errors[0].input
      } else {
        errors.value.message = e.response.message
      }
    } finally {
      isLoader.value = false
    }
  }
  
  async function refreshToken() {
    try {
      const newTokens = await axiosInstance.post('/refresh', {}, {
        withCredentials: true,
      })
      console.log("Обратились за новым токеном: ", newTokens.data)
      
      myProfile.token = newTokens.data.accessToken
      
      localStorage.setItem('userTokens', JSON.stringify({
        token: newTokens.data.accessToken,
      }))
    } catch(e) {
      console.log("Refresh Error: ", e.message)
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
    
    myProfile.clearUserInfo()
    await router.push('/login')
  }
  
  function getLocalData(nameData) {
    try {
      let data = localStorage.getItem(nameData)
      if(data) {
        let json = JSON.parse(data)
        if(json) {
          return json
        }
      }
    } catch(e) {
      console.log(e.message)
    }
    
    return null
  }
  
  function setLocalData(nameData,data) {
    try {
      localStorage.setItem(nameData, JSON.stringify(data))
    } catch(e) {
      console.log(e.message)
    }
  }
  
  //========================================================================================================================================================
  
  async function updateProfileInfo(id, payload) {
    console.log(id, payload, `/updateUser=${id}`)
    try {
      return await axiosInstance.post(`/updateUser=${id}`, {...payload},
        {
          withCredentials: true
        })
    } catch(e) {
      console.log(e.message)
      return e;
    }
  }
  
  
  return {
    auth,
    errors,
    isLoader,
    logoutUser,
    refreshToken,
    updateProfileInfo,
    resetPassword,
    getLocalData,
    setLocalData
  }
})