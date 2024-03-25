import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import axiosInstance from "@/api.js";
import router from "@/router/index.js";
import { usePreloaderStore } from "@/stores/preloader.js";

export const useMyProfileStore = defineStore('myProfile', () => {
  const token = ref()
  const id = ref(0)
  const nickname = ref("Загрузка...")
  const access = ref("noreg")
  const avatarName = ref('')
  const isAdmin = computed(() => {
    return access.value==='admin'
  })
  const isDefault = computed(() => {
    return access.value==='default'
  })
  const isReg = computed(() => {
    return !access.value && access.value!=='noreg'
  })
  const actionsProfile = useActionsProfileStore()
  
  async function setMyProfileInfo() {
    const preloader = usePreloaderStore()
    preloader.activate()
    console.log(id.value)
    if (id.value) {
      try {
        let response = await actionsProfile.getUserInfo(id.value)
        nickname.value = response.data.nickname
        access.value = response.data.accsessLevel
        avatarName.value = response.data.avatar
      } catch(e) {
        console.log(e.message)
      }
    }
    else {
      // clearUserInfo()
      // await router.push('/login')
    }
    
    preloader.deactivate()
  }
  
  function clearUserInfo() {
    token.value = ''
    id.value = 0
    nickname.value = ''
    access.value = 'noreg'
    avatarName.value = ''
    
    localStorage.clear()
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
    isReg
  }
})

export const useActionsProfileStore = defineStore('actionsProfile', () => {
  async function getUserInfo(id) {
    try {
      return await axiosInstance.get(`/user=${id}`, {withCredentials: true}).catch((error)=> {
        console.log('getUserInfo Error',error)
      })
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
      console.log(e)
    }
  }
  
  async function deleteAvatar(id) {
    try {
      return await axiosInstance.post(`/deleteAvatar=${id}`, {}, {
        withCredentials: true
      })
    } catch(e) {
      console.log(e)
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