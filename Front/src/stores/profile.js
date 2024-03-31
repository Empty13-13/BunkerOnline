import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import axiosInstance from "@/api.js";
import router from "@/router/index.js";
import { usePreloaderStore } from "@/stores/preloader.js";
import { useAuthStore } from "@/stores/auth.js";
import FingerprintJS from "@fingerprintjs/fingerprintjs";

export const useMyProfileStore = defineStore('myProfile', () => {
  const token = ref(null)
  const id = ref(0)
  const nickname = ref("Загрузка...")
  const access = ref("noreg")
  const avatarName = ref('')
  const fingerPrint = ref('')
  const isAdmin = computed(() => {
    return access.value==='admin'
  })
  const isDefault = computed(() => {
    return access.value==='default'
  })
  const isReg = computed(() => {
    return access.value && access.value!=='noreg'
  })
  const isNoReg = computed(() => {
    return !!fingerPrint && !token.value
  })
  const isHigherThanDefault = computed(() => {
    return !isDefault.value && !isReg.value
  })
  const actionsProfile = useActionsProfileStore()
  
  async function setMyProfileInfo() {
    const preloader = usePreloaderStore()
    preloader.activate()
    if (id.value && token.value) {
      try {
        let response = await actionsProfile.getUserInfo(id.value)
        if (!response) {
          return
        }
        nickname.value = response.data.nickname
        access.value = response.data.accsessLevel
        avatarName.value = response.data.avatar
      } catch(e) {
        clearUserInfo()
        preloader.deactivate()
        console.log(e.message)
      }
    }
    else {
      clearUserInfo()
      // await router.push('/login')
      
      const authStore = useAuthStore()
      if (!authStore.getLocalData('fingerPrint')) {
        const fpPromise = FingerprintJS.load()
        
        console.log('получаем новый')
        const fp = await fpPromise
        if (fp) {
          const result = await fp.get()
          if (result) {
            authStore.setLocalData('fingerPrint', result.visitorId)
            fingerPrint.value = result.visitorId
            console.log('Новый fingerPrint')
          }
        }
      }
      else {
        fingerPrint.value = authStore.getLocalData('fingerPrint')
      }
    }
    
    preloader.deactivate()
  }
  
  function clearUserInfo() {
    token.value = ''
    id.value = 0
    nickname.value = ''
    access.value = 'noreg'
    avatarName.value = ''
    
    localStorage.removeItem('userTokens')
    localStorage.removeItem('userId')
  }
  
  return {
    setMyProfileInfo,
    clearUserInfo,
    token,
    id,
    nickname,
    access,
    isAdmin,
    isDefault,
    avatarName,
    isReg,
    fingerPrint,
    isNoReg,
    isHigherThanDefault
  }
})

export const useActionsProfileStore = defineStore('actionsProfile', () => {
  async function getUserInfo(id) {
    try {
      return await axiosInstance.get(`/user=${id}`, {withCredentials: true})
    } catch(e) {
      console.log(e.message)
    }
  }
  
  async function uploadAvatar(id, formData) {
    try {
      return await axiosInstance.post(`/uploadAvatar=${id}`, formData, {
        withCredentials: true
      })
    } catch(e) {
      console.log(e.message)
    }
  }
  
  async function deleteAvatar(id) {
    try {
      return await axiosInstance.post(`/deleteAvatar=${id}`, {}, {
        withCredentials: true
      })
    } catch(e) {
      console.log(e.message)
    }
  }
  
  async function updateNickname(id, payload) {
    try {
      return await axiosInstance.post(`/updateNickname=${id}`, {...payload},
        {
          withCredentials: true
        })
    } catch(e) {
      console.log(e.message)
      return Promise.reject(e);
    }
  }
  
  return {
    getUserInfo,
    uploadAvatar,
    updateNickname,
    deleteAvatar
  }
})