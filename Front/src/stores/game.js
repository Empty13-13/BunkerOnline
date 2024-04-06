import { ref, computed, reactive } from 'vue'
import { defineStore } from 'pinia'
import axiosInstance from "@/api.js";
import { useMyProfileStore } from "@/stores/profile.js";
import { isObject } from "@vueuse/core";
import { objIsEmpty } from "@/plugins/functions.js";

export const useUserGames = defineStore('userGames', () => {
  const myGameIds = ref([])

  const isHost = computed(() => {

  })

  return {
    myGameIds
  }
})

export const useSelectedGame = defineStore('selectedGame', () => {
  const isStarted = ref(false)
  const isNewGame = ref(false)
  const gameId = ref(null)
  const data = reactive({})
  
  const myProfile = useMyProfileStore()

  const isHost = computed(() => {
    if(!data || !data.value){
      return false
    }
    return data.value?.idHost === myProfile.id
  })
  const isGameExist = computed(() => {
    console.log('isGameExist',data.value,isObject(data.value),!!data.value)
    if(isObject(data.value)) {
      return !objIsEmpty(data.value)
    } else {
      return !!data.value
    }
  })
  
  async function generateGameId() {
    try {
      gameId.value = (await axiosInstance.post('/generateRoomId')).data.link
      isNewGame.value = true
    } catch(e) {
      gameId.value = null
      console.log(e.message)
      return 'Error generate Id Room'
    } finally {
      isStarted.value = false
    }
  }

  function clear() {
    isStarted.value = false
    gameId.value = null
    isNewGame.value = false
    data.value = {}
  }

  return {
    isStarted,
    gameId,
    isHost,
    isNewGame,
    data,
    isGameExist,
    clear,
    generateGameId
  }
})