const UserModel = require('../model/models')
const tokenService = require('./token-service')
const ApiError = require('../exceptions/api-error')
require('dotenv').config()
const path = require('path')
const {Op} = require('sequelize')

class playerDataService {
  
  async createDataGame(idRoom) {
    const gameRoomData = await UserModel.GameRooms.findOne({where: {idRoom: idRoom}})
    const hostPack = this.hostUsePack(gameRoomData.hostId)
    const advanceSystemPack = await UserModel.SystemSettings.findOne({where: {nameSetting: 'advancePack'}})
    const players = await UserModel.RoomSession.findAll({where: {gameRoomId: gameRoomData.id}})
    const Data = []
    for (let player of players) {
      let usePack = this.playerUsePack(hostPack, player.userId, advanceSystemPack.value, gameRoomData.id)
      
    }
    
  }
  
  async dataForPlayer(hostPack, advanceSystemPackId, players) {
    let {baseIdPack, advanceIdPack} = this.howThisPack(hostPack)
    let dataPlayers = {}
    
    let usePriorityAccess = false
    if (!advanceIdPack.includes(advanceSystemPackId)) {
      for (let player in players) {
        if (player.userId>0) {
          let user = await UserModel.User.findOne({where: {id: player.userId}})
          if (user.isUsedSystemAdvancePack) {
            usePriorityAccess = true
            break;
            
          }
        }
      }
    }
    let hostBaseDataPacksId = this.getDataPackId(baseIdPack, 'playerData')
    let hostAdvanceDataPacksId = this.getDataPackId(advanceIdPack, 'playerData')
    let systemDataPacksId = {}
    if (usePriorityAccess) {
      systemDataPacksId = this.getDataPackId(advanceSystemPackId, 'playerData')
    }
    
  }
  
  
  async howThisPack(hostPack) {
    let baseIdPack = []
    let advanceIdPack = []
    for (let pack of hostPack) {
      let thisPack = await UserModel.ChartPack.findOne({where: {id: pack}})
      if (thisPack.status===0) {
        baseIdPack.push(pack)
      }
      advanceIdPack.push(pack)
    }
    return {baseIdPack, advanceIdPack}
    
  }
  
  async hostUsePack(hostId) {
    const dataPack = []
    const basePack = await UserModel.SystemSettings.findOne({where: {nameSetting: 'basePack'}})
    
    if (hostId>0) {
      const user = UserModel.User.findOne({where: {id: hostId}})
      if (user.isUsedSystemBasePack) {
        dataPack.push(basePack.value)
      }
      const advancePack = await UserModel.SystemSettings.findOne({where: {nameSetting: 'advancePack'}})
      if (user.isUsedSystemAdvancePack) {
        dataPack.push(advancePack.value)
      }
      const packs = await UserModel.UserUsePack.findAll({where: {userId: hostId, isHidden: 0}})
      //console.log(packs)
      if (packs) {
        for (let pack of packs) {
          if (basePack.value!==pack.chartPackId && advancePack.value!==pack.chartPackId) {
            dataPack.push(pack.chartPackId)
          }
        }
      }
      return dataPack
    }
    
    dataPack.push(basePack.value)
    return dataPack
  }
  
  async playerUsePack(hostPack, playerId, advancePackId, gameRoomId) {
    
    let player = await UserModel.RoomSession.findOne({where: {userId: playerId, gameRoomId: gameRoomId}})
    if (playerId<0) {
      player.usePack = hostPack.toString()
      await player.save()
      return hostPack
    }
    const user = await UserModel.User.findOne({where: {userId: playerId}})
    
    if (!user.isUsedSystemAdvancePack) {
      player.usePack = hostPack.toString()
      await player.save()
      return hostPack
    }
    if (!hostPack.includes(advancePackId)) {
      hostPack.push(advancePackId)
    }
    
    player.usePack = hostPack.toString()
    await player.save()
    return hostPack
    
    
  }
  
  
  async getDataPackId(dataPackId, track = null) {

//  let chartPlayerId = await UserModel.PlayerChartPack.findAll({where: {chartPackId:{[Op.or]: dataPackId, }}})
    console.log('TRACK', track)
    switch(track) {
      case 'player':
        let playersChart = await UserModel.PlayerChartPack.findAll(
          {attributes: ['chartPlayerId'], where: {chartPackId: dataPackId}})
        let dataPlayer = []
        for (let chartId of playersChart) {

          dataPlayer.push(chartId.chartPlayerId)
        }
        console.log(dataPlayer)
        return dataPlayer
      case 'bunker':
        let bunkerChart = await UserModel.BunkerChartPack.findAll(
                                    {attributes: ['chartBunkerId'], where: {chartPackId: dataPackId}})
        let dataBunker = []
        for (let chartId of bunkerChart) {

                  dataBunker.push(chartId.chartBunkerId)
                }
        console.log(dataBunker)
        return dataBunker
      case 'profession':
        let professionChart = await UserModel.ProfessionChartPack.findAll(
                                        {attributes: ['professionId'], where: {chartPackId: dataPackId}})
        let dataProfession = []
        for (let chartId of professionChart) {

                          dataProfession.push(chartId.professionId)
                        }
        return dataProfession
      case 'playerData' :
        console.log('SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS')
        let chartPlayerIdPlayerData = await UserModel.PlayerChartPack.findAll(
          {attributes: ['chartPlayerId'], where: {chartPackId: dataPackId}})
        let professionIdPlayerData = await UserModel.ProfessionChartPack.findAll(
          {attributes: ['professionId'], where: {chartPackId: dataPackId}})
        let dataProfessionIdPlayerData =[]
        let dataChartPlayerIdPlayerData =[]
         for (let chartId of chartPlayerIdPlayerData) {
        
                                  dataProfession.push(chartId.professionId)
                                }
        return {chartPlayerId: chartPlayerIdPlayerData, professionId: professionIdPlayerData}
      case 'all' || null:
        console.log('SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS')
        let chartPlayerId = await UserModel.PlayerChartPack.findAll(
          {attributes: ['chartPlayerId'], where: {chartPackId: dataPackId}})
        let chartBunkerId = await UserModel.BunkerChartPack.findAll(
          {attributes: ['chartBunkerId'], where: {chartPackId: dataPackId}})
        console.log('chartBunkerIds', chartBunkerId)
        let professionId = await UserModel.ProfessionChartPack.findAll(
          {attributes: ['professionId'], where: {chartPackId: dataPackId}})
        return {chartPlayerId, chartBunkerId, professionId}
    }
    
  }
  
  
}

module.exports = new playerDataService()