import { defineStore } from "pinia";
import { useHostSocketStore } from "@/stores/socket/hostSocket.js";
import { useUserSocketStore } from "@/stores/socket/userSocket.js";
import { useGlobalPopupStore } from "@/stores/popup.js";
import { computed, ref } from "vue";
import { showConfirmBlock } from "@/plugins/confirmBlockPlugin.js";
import { useSelectedGame, useSelectedGameData } from "@/stores/game.js";

export const useStaticPagesStore = defineStore('staticPagesStpre', () => {
  const wikiListLinks = ref([])
  const rulesPagesHTML = ref('')
  
  return {
    wikiListLinks,
    rulesPagesHTML,
  }
})
