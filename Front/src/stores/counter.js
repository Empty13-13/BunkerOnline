import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export const useCounterStore = defineStore('counter', () => {
  const count = ref(0)
  const doubleCount = computed(() => count.value * 2)
  
  function increment() {
    count.value++
  }
  
  return {count, doubleCount, increment}
})

export const useAccessStore = defineStore('access', () => {
  const level = ref('mvp')
  const id = ref(313)
  const isStarted = ref(true)
  const loginId = ref(313)
  
  return {level, id, isStarted,loginId}
})
