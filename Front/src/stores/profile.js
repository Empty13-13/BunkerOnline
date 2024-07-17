import { computed, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import axiosInstance from "@/api.js";
import router from "@/router/index.js";
import { usePreloaderStore } from "@/stores/preloader.js";
import { useAuthStore } from "@/stores/auth.js";
import { useGlobalPopupStore } from "@/stores/popup.js";

export const useMyProfileStore = defineStore('myProfile', () => {
  const actionsProfile = useActionsProfileStore()
  const globalPopup = useGlobalPopupStore()
  
  const token = ref(null)
  const id = ref(0)
  const nickname = ref("Загрузка...")
  const access = ref("noreg")
  const avatarName = ref('')
  const noregToken = ref(null)
  const basePacks = ref([])
  const advancePacks = ref([])
  const showLoaderForPacks = ref(false)
  const isAdmin = computed(() => {
    return access.value==='admin'
  })
  const isDefault = computed(() => {
    return access.value==='default'
  })
  const isMVP = computed(() => {
    return access.value.toLowerCase()==='mvp'
  })
  const isVIP = computed(() => {
    return access.value.toLowerCase()==='vip'
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
  const isStreamer = computed(() => {
    return false
  })
  
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
        if (noregToken) {
          noregToken.value = noregTokenLocal
        }
        
        await setMyPacks()
      } catch(e) {
        clearUserInfo()
        console.log(e.message)
      } finally {
        preloader.deactivate()
      }
    }
    else {
      clearUserInfo()
      // await router.push('/login')
    }
    
    preloader.deactivate()
  }
  async function setMyPacks() {
    try {
      showLoaderForPacks.value = true
      let packs = await axiosInstance.post(`/allPacks`)
      if (packs && packs.data && packs.data.length) {
        basePacks.value = []
        advancePacks.value = []
        
        for (let i = 0; i<packs.data.length; i++) {
          let pack = packs.data[i]
          // if(!isHigherThanDefault.value) {
          //   pack.disabled=true
          // }
          if(!!pack.status) {
            advancePacks.value.push(pack)
          } else {
            basePacks.value.push(pack)
          }
        }
      }
    } catch(e) {
      console.log(e.message)
    } finally {
      showLoaderForPacks.value = false
    }
  }
  
  async function changePacks(pack) {
    if(pack.status===0 && !pack.isUse && basePacks.value.filter(item => item.isUse).length<1) {
      pack.isUse=true
      globalPopup.activate('Информация','У вас должен быть включен хотя бы один базовый пак')
      return
    }
    if(isDefault.value) {
      pack.isUse=!pack.isUse
      globalPopup.activate('Информация','Чтобы изменять паки, вам нужно пробрести подписку','gold')
      return
    } else if(isVIP.value) {
      if(pack.status===0) {
        basePacks.value.forEach(item => item.isUse=false)
        pack.isUse=true
      } else {
        if(pack.isUse) {
          advancePacks.value.forEach(item => item.isUse = false)
          pack.isUse=true
        }
      }
    }
    
    
    try {
      await axiosInstance.post('/changePack',{id:pack.id,isUse:pack.isUse})
      if(pack.isUse && pack.ageRestriction) {
        globalPopup.activate('Внимание','Используя пак из категории 18+ вы подтверждаете, что вы достигли совершеннолетнего возраста','red')
      }
    } catch(e) {
      await setMyPacks()
      console.log(e)
      globalPopup.activate('Ошибка изменения паков',e.response.data.message)
    }
  }
  
  function setNoregToken(token) {
    const authStore = useAuthStore()
    noregToken.value = token
    authStore.setLocalData('noregToken', token)
  }
  
  function clearUserInfo() {
    token.value = ''
    id.value = 0
    nickname.value = ''
    access.value = 'noreg'
    avatarName.value = ''
    basePacks.value = []
    advancePacks.value = []
    
    localStorage.removeItem('userTokens')
    localStorage.removeItem('userId')
  }
  
  return {
    setMyProfileInfo,
    clearUserInfo,
    setNoregToken,
    setMyPacks,
    changePacks,
    showLoaderForPacks,
    token,
    id,
    nickname,
    access,
    isAdmin,
    isMVP,
    isDefault,
    avatarName,
    basePacks,
    advancePacks,
    isVIP,
    isReg,
    noregToken,
    isNoReg,
    isHigherThanDefault,
    isStreamer,
  }
})

export const useActionsProfileStore = defineStore('actionsProfile', () => {
  const isLoadingNewToken = ref(false)
  
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
        withCredentials: true,
        timeout: 60000,
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
    isLoadingNewToken,
    getUserInfo,
    uploadAvatar,
    updateNickname,
    deleteAvatar,
  }
})