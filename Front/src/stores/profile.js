import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import axiosInstance from "@/api.js";
import router from "@/router/index.js";
import { usePreloaderStore } from "@/stores/preloader.js";
import { useAuthStore } from "@/stores/auth.js";

export const useMyProfileStore = defineStore('myProfile', () => {
  const token = ref(null)
  const id = ref(0)
  const nickname = ref("Загрузка...")
  const access = ref("noreg")
  const avatarName = ref('')
  const noregToken = ref(null)
  const isAdmin = computed(() => {
    return access.value==='admin'
  })
  const isDefault = computed(() => {
    return access.value==='default'
  })
  const isMVP = computed(() => {
    return access.value.toLowerCase() === 'mvp'
  })
  const isVIP = computed(() => {
    return access.value.toLowerCase() === 'vip'
  })
  const isReg = computed(() => {
    return access.value && access.value!=='noreg'
  })
  const isNoReg = computed(() => {
    return !!noregToken && !token.value
  })
  const isHigherThanDefault = computed(() => {
    return access.value==='vip' || access.value==='mvp' || access.value==='admin'
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
        access.value = response.data.accsessLevel.toLowerCase()
        avatarName.value = response.data.avatar
        
        const authStore = useAuthStore()
        let noregTokenLocal = authStore.getLocalData('noregToken')
        if(noregToken) {
          noregToken.value = noregTokenLocal
        }
      } catch(e) {
        clearUserInfo()
        preloader.deactivate()
        console.log(e.message)
      }
    }
    else {
      clearUserInfo()
      // await router.push('/login')
    }
    
    preloader.deactivate()
  }
  
  function setNoregToken(token) {
    const authStore = useAuthStore()
    noregToken.value = token
    authStore.setLocalData('noregToken',token)
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
    setNoregToken,
    token,
    id,
    nickname,
    access,
    isAdmin,
    isMVP,
    isDefault,
    avatarName,
    isVIP,
    isReg,
    noregToken,
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
    deleteAvatar,
  }
})