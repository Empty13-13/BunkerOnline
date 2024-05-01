const UserModel = require('../model/models')
const tokenService = require('./token-service')
const ApiError = require('../exceptions/api-error')
require('dotenv').config()
const path = require('path')
const {Op} = require('sequelize')

function objIsEmpty(obj) {
  for (let key in obj) {
    return false;
  }
  return true;
}

function startGame() {
  let basePack = []
  let priorityPack = []
  let advancePack = []
  let usedPack = null
  
  function getRandomData() {
    usedPack = advancePack
    //usedPack.....
    
  }
}

class playerDataService {
  
  constructor() {
    this.basePack = null
    this.advancePack = null
    this.advanceBasePack = null
  }
  
  async getSystemSettingsData() {
    const systemData = {}
    const systemSettings = await UserModel.SystemSettings.findAll()
    for (let item of systemSettings) {
      systemData[item.nameSetting] = item.value
      
    }
    return systemData
  }
  
  async createDataGame(idRoom) {
    const systemData = await this.getSystemSettingsData()
    const gameRoomData = await UserModel.GameRooms.findOne({where: {idRoom: idRoom}})
    const hostPack = await this.hostUsePack(gameRoomData.hostId, systemData)
    
    const players = await UserModel.RoomSession.findAll({where: {gameRoomId: gameRoomData.id, isPlayer: 1}})
    const data = {
      players: {},
      userData: {},
      bunkerData: {}
    }
    let {hostBaseDataPacksData, hostAdvanceDataPacksData, systemDataPacksData} = await this.dataForPlayer(hostPack,
      systemData, players)
   // console.log('aaaaaaaaaaaaaaaaaaaaaaaaaa',hostBaseDataPacksData, hostAdvanceDataPacksData, systemDataPacksData)
    let childFreeCount = 0
    let perfectHealthCount = 0
    for (let player of players) {
      
      let usePack = await this.playerUsePack(hostPack, player.userId, systemData, gameRoomData.id)
      let resultPlayerData = await this.createDataPlayer(hostBaseDataPacksData, hostAdvanceDataPacksData,
        systemDataPacksData, usePack, player.userId, gameRoomData.id, childFreeCount, perfectHealthCount, systemData)
      childFreeCount = resultPlayerData.childFreeCount
      perfectHealthCount = resultPlayerData.perfectHealthCount
      hostBaseDataPacksData =resultPlayerData.hostBaseDataPacksData
      hostAdvanceDataPacksData =resultPlayerData.hostAdvanceDataPacksData
      systemDataPacksData =resultPlayerData.systemDataPacksData
      data.players = Object.assign(data.players, resultPlayerData.result)
    }
    
    let userData = await this.getAvailablePlayerData(idRoom)
    const {hostBaseDataPacksBunker, hostAdvanceDataPacksBunker} = await this.dataForBunker(hostPack, systemData)
    const bunkerData = await this.createDataBunker(players, systemData, hostBaseDataPacksBunker,
      hostAdvanceDataPacksBunker)
    data.userData = Object.assign(data.userData, userData)
    data.bunkerData = Object.assign(data.bunkerData, bunkerData)
    return data
  }
  
  
  async createDataBunker(players, systemData, pack1, priorityPack1) {
    let bunkerTime = null
    let bunkerLocation = null
    let bunkerCreated = null
    let bunkerBedroom = null
    let bunkerItems = null
    let bunkerFood = null
    let catastrophe = null
    let imageId = null
    let imageName = null
    let bunkerSize = null
    let maxSurvivor = null
    bunkerSize = +players.length
    maxSurvivor = Math.floor(+players.length / 2)
    
    bunkerTime = this.getRandomDataBunker(pack1, priorityPack1, 'bunkerTime', systemData)
    bunkerLocation = this.getRandomDataBunker(pack1, priorityPack1, 'bunkerLocation', systemData)
    bunkerCreated = this.getRandomDataBunker(pack1, priorityPack1, 'bunkerCreated', systemData)
    bunkerBedroom = this.getRandomDataBunker(pack1, priorityPack1, 'bunkerBedroom', systemData)
    bunkerItems = this.getRandomDataBunker(pack1, priorityPack1, 'bunkerItems', systemData)
    bunkerFood = this.getRandomDataBunker(pack1, priorityPack1, 'bunkerFood', systemData)
    catastrophe = this.getRandomDataBunker(pack1, priorityPack1, 'catastrophe', systemData)
    //console.log('catastrophe', catastrophe)
    let allImageId = await UserModel.CatastropheImage.findAll({where: {catastropheId: catastrophe.id}})
    // console.log('allImageId', allImageId)
    if (allImageId.length===1) {
      imageId = allImageId[0].id
      imageName = allImageId[0].imageName
    }
    else {
      let index = this.getRandomInt(0, allImageId.length - 1)
      let image = allImageId[index]
      imageId = image.id
      imageName = image.imageName
    }
    return {
      bunkerTime: bunkerTime.text,
      bunkerSize: bunkerSize,
      maxSurvivor: maxSurvivor,
      bunkerLocation: bunkerLocation.text,
      bunkerCreated: bunkerCreated.text,
      bunkerBedroom: bunkerBedroom.text,
      bunkerItems: bunkerItems.text,
      bunkerFood: bunkerFood.text,
      catastrophe: catastrophe.text,
      imageName: imageName
    }
    
  }
  
  
  async getAvailablePlayerData(idRoom) {
    const gameRoomData = await UserModel.GameRooms.findOne({where: {idRoom: idRoom}})
    const players = await UserModel.RoomSession.findAll({where: {gameRoomId: gameRoomData.id}})
    
    let data = []
    for (let player of players) {
      let userData = {}
      if (player.userId>0) {
        let user = await UserModel.User.findOne({where: {id: player.userId}})
        userData.id = player.userId
        userData.nickname = user.nickname
        userData.avatar = user.avatar
        userData.isPlayer = player.isPlayer
      }
      else {
        userData.id = player.userId
        userData.nickname = `Гость#${Math.abs(player.userId)}`
        userData.avatar = null
        userData.isPlayer = player.isPlayer
        
      }
      data.push(userData)
    }
    return data
    
    
  }
  
  async createDataPlayer(hostBaseDataPacksData, hostAdvanceDataPacksData, systemDataPacksData, usePack, playerId,
    gameRoomDataId, childFreeCount, perfectHealthCount, systemData) {
    if (!usePack.includes(systemData.advancePack)) {
      systemDataPacksData = []
    }
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
    age = this.getRandomInt(systemData.minAge, systemData.maxAge)
    sex = !!this.getRandomInt(0, 1)
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
    sex = `${sex? maleSexText[0]:femaleSexText[0]} ${age} ${this.getAgeText(
      age)} ${sex? maleSexText[1]:femaleSexText[1]}`
    
    if (!((childFreeCount + 1) / 6 * 100>25) && this.getRandomInt(0, 100)<=systemData.childFreePercentage) {
      sex += ' | чайлдфри'
      childFreeCount += 1
    }
        let dataRandom
        dataRandom = this.getRandomData(hostBaseDataPacksData, hostAdvanceDataPacksData, systemDataPacksData, 'body', age,
          systemData)
          body = dataRandom.result
          hostBaseDataPacksData = dataRandom.pack1
          hostAdvanceDataPacksData = dataRandom.priorityPack1
          systemDataPacksData = dataRandom.priorityPack2
        dataRandom = this.getRandomData(hostBaseDataPacksData, hostAdvanceDataPacksData, systemDataPacksData, 'trait', age,
          systemData)
          trait = dataRandom.result
                hostBaseDataPacksData = dataRandom.pack1
                hostAdvanceDataPacksData = dataRandom.priorityPack1
                systemDataPacksData = dataRandom.priorityPack2
        if (!((perfectHealthCount + 1) / 8 * 100>30) && this.getRandomInt(0, 100)<=systemData.perfectHealthPercentage) {
          health = {id: 0, text: 'Идеально здоров', isOpen: false}
          perfectHealthCount += 1
        }
        else {
          dataRandom = this.getRandomData(hostBaseDataPacksData, hostAdvanceDataPacksData, systemDataPacksData, 'health', age,
            systemData)
            health = dataRandom.result
                  hostBaseDataPacksData = dataRandom.pack1
                  hostAdvanceDataPacksData = dataRandom.priorityPack1
                  systemDataPacksData = dataRandom.priorityPack2
        }
        dataRandom = this.getRandomData(hostBaseDataPacksData, hostAdvanceDataPacksData, systemDataPacksData, 'hobby', age,
          systemData)
          hobbies = dataRandom.result
                hostBaseDataPacksData = dataRandom.pack1
                hostAdvanceDataPacksData = dataRandom.priorityPack1
                systemDataPacksData = dataRandom.priorityPack2
        dataRandom = this.getRandomData(hostBaseDataPacksData, hostAdvanceDataPacksData, systemDataPacksData, 'phobia', age,
          systemData)
          phobia = dataRandom.result
                hostBaseDataPacksData = dataRandom.pack1
                hostAdvanceDataPacksData = dataRandom.priorityPack1
                systemDataPacksData = dataRandom.priorityPack2
        dataRandom = this.getRandomData(hostBaseDataPacksData, hostAdvanceDataPacksData, systemDataPacksData, 'inventory',
          age, systemData)
          inventory = dataRandom.result
                hostBaseDataPacksData = dataRandom.pack1
                hostAdvanceDataPacksData = dataRandom.priorityPack1
                systemDataPacksData = dataRandom.priorityPack2
        dataRandom = this.getRandomData(hostBaseDataPacksData, hostAdvanceDataPacksData, systemDataPacksData, 'backpack', age,
          systemData)
          backpack = dataRandom.result
                hostBaseDataPacksData = dataRandom.pack1
                hostAdvanceDataPacksData = dataRandom.priorityPack1
                systemDataPacksData = dataRandom.priorityPack2
        dataRandom = this.getRandomData(hostBaseDataPacksData, hostAdvanceDataPacksData, systemDataPacksData, 'addInfo', age,
          systemData)
          addInfo = dataRandom.result
                hostBaseDataPacksData = dataRandom.pack1
                hostAdvanceDataPacksData = dataRandom.priorityPack1
                systemDataPacksData = dataRandom.priorityPack2
        dataRandom = this.getRandomData(hostBaseDataPacksData, hostAdvanceDataPacksData, systemDataPacksData, 'spec1', age,
          systemData)
          spec1 = dataRandom.result
                hostBaseDataPacksData = dataRandom.pack1
                hostAdvanceDataPacksData = dataRandom.priorityPack1
                systemDataPacksData = dataRandom.priorityPack2
        dataRandom = this.getRandomData(hostBaseDataPacksData, hostAdvanceDataPacksData, systemDataPacksData, 'spec2', age,
          systemData)
          spec2 = dataRandom.result
                hostBaseDataPacksData = dataRandom.pack1
                hostAdvanceDataPacksData = dataRandom.priorityPack1
                systemDataPacksData = dataRandom.priorityPack2
        dataRandom = this.getRandomData(hostBaseDataPacksData, hostAdvanceDataPacksData, systemDataPacksData, 'profession',
          age, systemData)
          profession = dataRandom.result
                hostBaseDataPacksData = dataRandom.pack1
                hostAdvanceDataPacksData = dataRandom.priorityPack1
                systemDataPacksData = dataRandom.priorityPack2

    let result = {}
    result[playerId] = {
      age: {text: age, isOpen: false},
      sex: {text: sex, isOpen: false},
      body: body,
      trait: trait,
      health: health,
      hobbies: hobbies,
      phobia: phobia,
      inventory: inventory,
      backpack: backpack,
      addInfo: addInfo,
      spec1: spec1,
      spec2: spec2,
      profession: profession
    }
    return {
      result, perfectHealthCount, childFreeCount,hostBaseDataPacksData,hostAdvanceDataPacksData,systemDataPacksData
    }
    
    
  }
  
  getAgeText(age) {
    let txt;
    let count = age % 100;
    if (count>=5 && count<=20) {
      txt = 'лет';
    }
    else {
      count = count % 10;
      if (count===1) {
        txt = 'год';
      }
      else if (count>=2 && count<=4) {
        txt = 'года';
      }
      else {
        txt = 'лет';
      }
    }
    return txt;
  }
  
  getRandomDataBunker(pack1, priorityPack1, name, systemData) {
    
    let result = null
    let priorityPack2 = []

    while (!result) {
      console.log(name)
      let dataPack = this.getRandomPack(pack1, priorityPack1, priorityPack2,
        systemData.priorityPackPercentage)
        let usedPack = dataPack.pack
        let trackPack = dataPack.index
      let nameArray = usedPack.filter(item => item.name===name)
      //console.log('222222222222222222222222222222222', name)
      if (nameArray.length) {
        let index = this.getRandomInt(0, nameArray.length - 1)
        result = nameArray[index]
        delete result.name
        
        // index = usedPack.indexOf(nameArray[index])
      }
    }
    return result
  }
  
  getRandomData(pack1, priorityPack1, priorityPack2, name, age, systemData) {
    let result = {}
    age = +age
    // console.log('//////////////////////////////////////////////////////////////////////////////////')
    // console.log(pack1)
    // console.log('///////')
          let usedPack = null
          let trackPack = null
    if (name==='spec1' || name==='spec2') {
      name = 'card'
    }
    while (!result.text) {
      console.log(name)
     let dataPack = this.getRandomPack(pack1, priorityPack1, priorityPack2,
                 systemData.priorityPackPercentage)
               usedPack = dataPack.pack
               trackPack = dataPack.index
      if (name==='profession') {
        let nameArray = usedPack.professionData.filter(item => {
          let resAge = +item.minAmateurAge || +systemData.minAmateurAge
          // console.log(resAge,resAge<=+age)
          return resAge<= +age
        })
        //console.log('PROFESIA KURVA',pack1)
        if (nameArray.length) {
          let index = this.getRandomInt(0, nameArray.length - 1)
          result = nameArray[index]
          // console.log('111111111111111111111111111111111111111111',result)
          result.isOpen = false
          result.text = result.name
          delete result.name
          index = usedPack.professionData.indexOf(nameArray[index])
          console.log(' ')
          console.log(' ')
          console.log(' ')
          console.log(' ')
          console.log(' ')
          console.log(' ')
          console.log(' ')
          console.log(' ')
         // console.log(index, usedPack.professionData[index], nameArray[index])
          usedPack.professionData.splice(index, 1)
         // console.log(usedPack.professionData)
         // console.log(index, usedPack.professionData[index], nameArray[index])
          console.log(' ')
          console.log(' ')
          console.log(' ')
          console.log(' ')
          console.log(' ')
          console.log(' ')
          
          
        }
      }
      else {
        let nameArray = usedPack.chartPlayerData.filter(item => item.name===name)
        if (nameArray.length) {
          let index = this.getRandomInt(0, nameArray.length - 1)
          result = nameArray[index]
          delete result.name
          result.isOpen = false
          index = usedPack.chartPlayerData.indexOf(nameArray[index])
          usedPack.chartPlayerData.splice(index, 1)
        }
      }
      switch(name) {
        case 'body':
          result.text += ` (Рост: ${this.getRandomInt(systemData.minHeight, systemData.maxHeight)} см.)`
          break;
        case 'health':
          if (result.text!=='Идеально здоров') {
            const diseaseLevels = ['Легкая степень', 'Средняя степень', 'Тяжелая степень', 'Критическая степень']
            result.text += ` (${diseaseLevels[this.getRandomInt(0, diseaseLevels.length - 1)]})`
          }
          break;
        case 'hobby':
          const hobbyLevels = ['Дилетант', 'Новичок', 'Любитель', 'Продвинутый', 'Мастер (гуру)']
          result.text += ` (${hobbyLevels[this.getRandomInt(0, hobbyLevels.length - 1)]})`
          break;
        case 'profession':
          const professionLevels = this.professionExp(result, systemData, age)
          result.text += ` (${professionLevels[this.getRandomInt(0, professionLevels.length - 1)]})`
          delete result.minAmateurAge
          delete result.minInternAge
          delete result.minMiddleAge
          delete result.minExperiencedAge
          delete result.minExpertAge
          
          
          break;
      }
      
    }
    if (trackPack===0) {
      pack1 = usedPack
    }
    else if (trackPack===1) {
      priorityPack1 = usedPack
    }
    else {
      priorityPack2 = usedPack
    }
    console.log(trackPack)
    return {result, pack1, priorityPack1, priorityPack2}
  }
  
  professionExp(result, systemData, age) {
    // let minAmateurAge = result.minAmateurAge || systemData.minAmateurAge
    let minInternAge = result.minInternAge || systemData.minInternAge
    let minMiddleAge = result.minMiddleAge || systemData.minMiddleAge
    let minExperiencedAge = result.minExperiencedAge || systemData.minExperiencedAge
    let minExpertAge = result.minExpertAge || systemData.minExpertAge
    let minProAge = result.minProAge || systemData.minProAge
    let professionLevels = ['Дилетант']
    if (age>minInternAge) {
      professionLevels = ['Дилетант', 'Стажер']
      if (age>minMiddleAge) {
        professionLevels = ['Дилетант', 'Стажер', 'Любитель']
        if (age>minExperiencedAge) {
          professionLevels = ['Дилетант', 'Стажер', 'Любитель', 'Опытный']
          if (age>minExpertAge) {
            professionLevels = ['Дилетант', 'Стажер', 'Любитель', 'Опытный', 'Эксперт']
            if (age>minProAge) {
              professionLevels = ['Дилетант', 'Стажер', 'Любитель', 'Опытный', 'Эксперт', 'Профессионал']
            }
          }
        }
      }
    }
    
    
    return professionLevels
  }
  
  
  getRandomPack(pack1, priorityPack1, priorityPack2, percentagePriority) {
    let index = 0
    let pack = null
    if(objIsEmpty(priorityPack1) && objIsEmpty(priorityPack2)) {
      return {pack:pack1, index}
    }
    if (this.getRandomInt(0, 100)<=100 - percentagePriority) {
      return {pack:pack1, index}
    }
    else { 
      if (objIsEmpty(priorityPack1)) {
        index = 2
        return {pack:priorityPack2, index}
      }
      if (objIsEmpty(priorityPack2)) {
        index = 1
        return {pack:priorityPack1, index}
      }
      if (this.getRandomInt(0, 100)<=25) {
        index = 1
        return {pack:priorityPack1, index}
      }
      else {
        index = 2
        return {pack:priorityPack2, index}
      }
    }
  }
  
  async dataForBunker(hostPack, systemData) {
    let {baseIdPack, advanceIdPack} = await this.howThisPack(hostPack)
    let dataBunker = {}
    
    
    let hostBaseDataPacksBunker = await this.getDataPackData(baseIdPack, 'bunker')
    let hostAdvanceDataPacksBunker = await this.getDataPackData(advanceIdPack, 'bunker')
    
    return {hostBaseDataPacksBunker, hostAdvanceDataPacksBunker}
    
  }
  
  async dataForPlayer(hostPack, systemData, players) {
    let {baseIdPack, advanceIdPack} = await this.howThisPack(hostPack)
    let dataPlayers = {}
    
    let usePriorityAccess = false
    if (!advanceIdPack.includes(systemData.advancePack)) {
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
    let hostBaseDataPacksData = await this.getDataPackData(baseIdPack, 'playerData')
    let hostAdvanceDataPacksData = await this.getDataPackData(advanceIdPack, 'playerData')
    console.log('aaaaaaaaaaaaaassssssssssssssssssssssssssssssssssss',advanceIdPack)
    let systemDataPacksData = {}
    if (usePriorityAccess) {
      systemDataPacksData = await this.getDataPackData(systemData.advancePack, 'playerData')
    }
    return {hostBaseDataPacksData, hostAdvanceDataPacksData, systemDataPacksData}
    
  }
  
  
  async howThisPack(hostPack) {
    let baseIdPack = []
    let advanceIdPack = []
    console.log(hostPack)
    for (let pack of hostPack) {
      let thisPack = await UserModel.ChartPack.findOne({where: {id: pack}})
      if (thisPack.status===0) {
        baseIdPack.push(pack)
      }else{
      advanceIdPack.push(pack)}
    }
    return {baseIdPack, advanceIdPack}
    
  }
  
  async hostUsePack(hostId, systemData) {
    const dataPack = []
    
    
    if (hostId>0) {
      const user = await UserModel.User.findOne({where: {id: hostId}})
      if (user.isUsedSystemBasePack) {
        dataPack.push(systemData.basePack)
      }
      
      if (user.isUsedSystemAdvancePack) {
        dataPack.push(systemData.advancePack)
      }
      const packs = await UserModel.UserUsePack.findAll({where: {userId: hostId}})
      //console.log(packs)
      if (packs) {
        for (let pack of packs) {
          if (systemData.basePack!==pack.chartPackId && systemData.advancePack!==pack.chartPackId) {
            dataPack.push(pack.chartPackId)
          }
        }
      }
      return dataPack
    }
    
    dataPack.push(systemData.basePack)
    return dataPack
  }
  
  async playerUsePack(hostPack, playerId, systemData, gameRoomId) {
    
    let player = await UserModel.RoomSession.findOne({where: {userId: playerId, gameRoomId: gameRoomId}})
    if (playerId<0) {
      player.usePack = hostPack.toString()
      await player.save()
      return hostPack
    }
    const user = await UserModel.User.findOne({where: {id: playerId}})
    
    if (!user.isUsedSystemAdvancePack) {
      player.usePack = hostPack.toString()
      await player.save()
      return hostPack
    }
    if (!hostPack.includes(systemData.advancePack)) {
      hostPack.push(systemData.advancePack)
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
          {attributes: ['id', 'name', 'text'], where: {id: dataBunker}, raw: true})
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
          {attributes: ['id', 'name', 'text'], where: {id: dataChartPlayerIdPlayerData}, raw: true})
        let dataProfessionChartData = await UserModel.Profession.findAll({
          attributes: ['id', 'name', 'description', 'minAmateurAge', 'minInternAge', 'minMiddleAge', 'minExperiencedAge', 'minExpertAge'],
          where: {id: dataProfessionIdPlayerData}, raw: true
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
  
  getRandomInt(min, max) {
    max += 1
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min); // Максимум не включается, минимум включается
  }
  
  
}

module
  .exports = new playerDataService()