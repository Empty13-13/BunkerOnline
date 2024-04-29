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
    const {hostBaseDataPacksData, hostAdvanceDataPacksData, systemDataPacksData} = await this.dataForPlayer(hostPack,
      advanceSystemPack.value, players)
    let childFreeCount = 0
    for (let player of players) {
      let usePack = this.playerUsePack(hostPack, player.userId, advanceSystemPack.value, gameRoomData.id)
      
    }
    
  }

  async createDataPlayer(usePack, playerId, advanceSystemPackId, gameRoomDataId, childFreeCount, minAge, maxAge) {
    let age = null
    let sex = null
    let body = null
    let height = null
    let trait = null
    let health = null
    let hobbies = null
    let phobia = null
    let inventory = null
    let backpack = null
    let addInfo = null
    let spec1 = null
    let spec2 = null
    let profession = null
    age = getRandomInt(minAge, maxAge)
    sex = !!getRandomInt(0, 1)
    let maleSexText = ['Мужчина', '(Молодой)']
    let femaleSexText = ['Женщина', '(Молодая)']
    if (age>=36 && age<=59) {
      maleSexText[1] = '(Взрослый)'
      femaleSexText[1] = '(Взрослая)'
    }
    else if (age>=60) {
      maleSexText[1] = '(Пожилой)'
      femaleSexText[1] = '(Пожилая)'
    }
    sex += sex? maleSexText[0]:femaleSexText[0] + ' ' + `${age} ${getAgeText(
      age)} ` + sex? maleSexText[1]:femaleSexText[1]
    if (!((childFreeCount + 1) / users.length * 100>25) && getRandomInt(0, 100)<=25) {
      sex += ' | чайлдфри'
      childFreeCount += 1
    }

  }

  getRandomData(pack1, priorityPack1, priorityPack2, name,age,minHeight,maxHeight) {
    let result = {}
    if (name==='spec1' || name==='spec2') {
      name = 'card'
    }
    while (!resultText) {
      let usedPack = getRandomPack(pack1,priorityPack1,priorityPack2)
      if(name==='profession') {
        let nameArray = usedPack.professionData.filter(item => item.minAmateurAge>=age)
        if(nameArray.length){
          let index=getRandomInt(0,nameArray.length-1)
          result = nameArray[index]
          result.isOpen = false
          index = usedPack.professionData.indexOf(nameArray[index])
          usedPack.professionData.splice(index,1)

        }
      }
      else{
        let nameArray = usedPack.chartPlayerData.filter(item => item.name===name)
        if(nameArray.length) {
          let index=getRandomInt(0,nameArray.length-1)
          result = nameArray[index]
          delete result.name
          result.isOpen = false
          index = usedPack.chartPlayerData.indexOf(nameArray[index])
          usedPack.chartPlayerData.splice(index,1)

        }

      }
      switch(name){
          case 'body':
            result.text +=` (Рост: ${getRandomInt(minHeight,maxHeight)} см.)`
            break;
          case 'health':
            const diseaseLevels = ['Легкая степень','Средняя степень','Тяжелая степень','Критическая степень']
            result.text += ` ${diseaseLevels[getRandomInt(0,diseaseLevels.length-1)]}`
            break;
          case 'hobby':
            const hobbyLevels = ['Дилетант','Новичок','Любитель','Продвинутый','Мастер (гуру)']
            result.text += ` ${hobbyLevels[getRandomInt(0,hobbyLevels.length-1)]}`
            break;
          case 'profession':
            if(result.minAmateurAge)


            break;
        }

    }
  }





  getRandomPack(pack1, priorityPack1, priorityPack2,percentage) {
    if (getRandomInt(0, 100)<=percentage) {
      return pack1
    }
    else {
      if (!priorityPack1) {
        return priorityPack2
      }
      if (!priorityPack2) {
        return priorityPack1
      }
      if (getRandomInt(0, 100)<=25) {
        return priorityPack1
      }
      else {
        return priorityPack2
      }
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
    let hostBaseDataPacksData = this.getDataPackData(baseIdPack, 'playerData')
    let hostAdvanceDataPacksData = this.getDataPackData(advanceIdPack, 'playerData')
    let systemDataPacksData = {}
    if (usePriorityAccess) {
      systemDataPacksData = this.getDataPackData(advanceSystemPackId, 'playerData')
    }
    return {hostBaseDataPacksData, hostAdvanceDataPacksData, systemDataPacksData}
    
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
  
  
  async getDataPackData(dataPackId, track = null) {

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
        let dataPlayerChart = await UserModel.ChartPlayer.findAll(
          {attributes: ['id', 'name', 'text'], where: {id: dataPlayer}})
        console.log(dataPlayer)
        return dataPlayerChart
      case 'bunker':
        let bunkerChart = await UserModel.BunkerChartPack.findAll(
          {attributes: ['chartBunkerId'], where: {chartPackId: dataPackId}})
        let dataBunker = []
        for (let chartId of bunkerChart) {
          
          dataBunker.push(chartId.chartBunkerId)
        }
        let dataBunkerChart = await UserModel.ChartBunker.findAll(
          {attributes: ['id', 'name', 'text'], where: {id: dataBunker}})
        return dataBunkerChart
      case 'profession':
        let professionChart = await UserModel.ProfessionChartPack.findAll(
          {attributes: ['professionId'], where: {chartPackId: dataPackId}})
        let dataProfession = []
        for (let chartId of professionChart) {
          
          dataProfession.push(chartId.professionId)
        }
        let dataProfessionChart = await UserModel.Profession.findAll({
          attributes: ['id', 'name', 'description', 'minAmateurAge', 'minInternAge', 'minMiddleAge', 'minExperiencedAge', 'minExpertAge'],
          where: {id: dataProfession}
        })
        return dataProfessionChart
      case 'playerData' :
        //console.log('SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS')
        let chartPlayerIdPlayerData = await UserModel.PlayerChartPack.findAll(
          {attributes: ['chartPlayerId'], where: {chartPackId: dataPackId}})
        let professionIdPlayerData = await UserModel.ProfessionChartPack.findAll(
          {attributes: ['professionId'], where: {chartPackId: dataPackId}})
        let dataProfessionIdPlayerData = []
        let dataChartPlayerIdPlayerData = []
        for (let chartId of chartPlayerIdPlayerData) {
          
          dataChartPlayerIdPlayerData.push(chartId.chartPlayerId)
        }
        for (let chartId of professionIdPlayerData) {
          
          dataProfessionIdPlayerData.push(chartId.professionId)
        }
        let dataPlayerChartData = await UserModel.ChartPlayer.findAll(
          {attributes: ['id', 'name', 'text'], where: {id: dataChartPlayerIdPlayerData}})
        let dataProfessionChartData = await UserModel.Profession.findAll({
          attributes: ['id', 'name', 'description', 'minAmateurAge', 'minInternAge', 'minMiddleAge', 'minExperiencedAge', 'minExpertAge'],
          where: {id: dataProfessionIdPlayerData}
        })
        return {chartPlayerData: dataPlayerChartData, professionData: dataProfessionChartData}
      case 'all' || null:
        //   console.log('SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS')
        let chartPlayerId = await UserModel.PlayerChartPack.findAll(
          {attributes: ['chartPlayerId'], where: {chartPackId: dataPackId}})
        let chartBunkerId = await UserModel.BunkerChartPack.findAll(
          {attributes: ['chartBunkerId'], where: {chartPackId: dataPackId}})
        //  console.log('chartBunkerIds', chartBunkerId)
        let professionId = await UserModel.ProfessionChartPack.findAll(
          {attributes: ['professionId'], where: {chartPackId: dataPackId}})
        let dataChartPlayerId = []
        for (let chartId of chartPlayerId) {
          
          dataChartPlayerId.push(chartId.chartPlayerId)
        }
        for (let chartId of chartBunkerId) {
          
          dataChartPlayerId.push(chartId.chartBunkerId)
        }
        let dataChartBunkerId = []
        for (let chartId of chartBunkerId) {
          
          dataChartBunkerId.push(chartId.chartBunkerId)
        }
        let dataProfessionId = []
        for (let chartId of professionId) {
          
          dataProfessionId.push(chartId.professionId)
        }
        let chartPlayerData = await UserModel.ChartPlayer.findAll(
          {attributes: ['id', 'name', 'text'], where: {id: dataChartPlayerId}})
        let professionData = await UserModel.Profession.findAll({
          attributes: ['id', 'name', 'description', 'minAmateurAge', 'minInternAge', 'minMiddleAge', 'minExperiencedAge', 'minExpertAge'],
          where: {id: dataProfessionId}
        })
        let chartBunkerData = await UserModel.ChartBunker.findAll(
          {attributes: ['id', 'name', 'text'], where: {id: dataChartBunkerId}})
        return {chartPlayerData: chartPlayerData, chartBunkerData: chartBunkerData, professionData: professionData}
    }
    
  }
  
  
}

module.exports = new playerDataService()