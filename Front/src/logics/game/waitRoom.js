import router from "@/router/index.js";
import { showConfirmBlock } from "@/plugins/confirmBlockPlugin.js";

function closeRoom(e) {
  showConfirmBlock(e.target,async () => {
    await router.push('/')
  },'Вы уверены, что хотите закрыть комнату?')
}

function startGame(e) {
  showConfirmBlock(e.target,async () => {
    gameData.isStarted=true
  })
}