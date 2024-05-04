const UserModel = require('../model/models')
const tokenService = require('./token-service')
const ApiError = require('../exceptions/api-error')
require('dotenv').config()
const path = require('path')
const {Op} = require('sequelize')
const {logger} = require("sequelize/lib/utils/logger");

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
    this.systemBasePack = null
    this.basePack = null
    this.systemAdvancePack = null
    this.advancePack = null
    this.usedPack = null
    this.systemSettings = null
    this.childFreeCount = 0
    this.perfectHealthCount = 0
  }
  
  async getSystemSettingsData() {
    const systemData = {}
    const systemSettings = await UserModel.SystemSettings.findAll()
    for (let item of systemSettings) {
      systemData[item.nameSetting] = item.value
      
    }
    return systemData
  }
  
  async createDataGame(idRoom, io) {
    this.systemSettings = await this.getSystemSettingsData()
    const gameRoomData = await UserModel.GameRooms.findOne({where: {idRoom: idRoom}})
    const hostPackIds = await this.hostUsePack(gameRoomData.hostId)
    
    const players = await UserModel.RoomSession.findAll({where: {gameRoomId: gameRoomData.id, isPlayer: 1}})
    const data = {
      players: {},
      userData: {},
      bunkerData: {}
    }
    await this.collectAndSetDataForPlayer(hostPackIds, players)
    
    for (let player of players) {
      let usePackIds = await this.playerUsePack(hostPackIds, player.userId, gameRoomData.id)
      let resultPlayerData = await this.createDataPlayer(usePackIds, player.userId, gameRoomData.id)
      data.players = Object.assign(data.players, resultPlayerData)
    }
    
    let userData = await this.getAvailablePlayerData(idRoom)
    
    const bunkerData = await this.createDataBunker(players)
    data.userData = Object.assign(data.userData, userData)
    data.bunkerData = Object.assign(data.bunkerData, bunkerData)
    return data
  }
  
  
  async createDataBunker(players) {
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
    bunkerTime = this.getRandomDataBunker('bunkerTime')
    bunkerLocation = this.getRandomDataBunker('bunkerLocation')
    bunkerCreated = this.getRandomDataBunker('bunkerCreated')
    bunkerBedroom = this.getRandomDataBunker('bunkerBedroom')
    bunkerItems = this.getRandomDataBunker('bunkerItems')
    bunkerFood = this.getRandomDataBunker('bunkerFood')
    catastrophe = this.getRandomDataBunker('catastrophe')
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
  
  async createDataPlayer(usePackIds, playerId, gameRoomDataId) {
    let isUsedSystemAdvancePack = false
    if (usePackIds.includes(this.systemSettings.advancePack)) {
      isUsedSystemAdvancePack = true
    }
    let age = null
    let sex = null
    let body = null
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
    age = this.getRandomInt(this.systemSettings.minAge, this.systemSettings.maxAge)
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
    
    if (!((this.childFreeCount + 1) / 6 * 100>25) &&
      this.getRandomInt(0, 100)<=this.systemSettings.childFreePercentage) {
      sex += ' | чайлдфри'
      this.childFreeCount += 1
    }
    body = this.getRandomData('body', isUsedSystemAdvancePack)
    trait = this.getRandomData('trait', isUsedSystemAdvancePack)
    if (!((this.perfectHealthCount + 1) / 8 * 100>30) && this.getRandomInt(0,
      100)<=this.systemSettings.perfectHealthPercentage) {
      health = {id: 0, text: 'Идеально здоров', isOpen: false}
      this.perfectHealthCount += 1
    }
    else {
      health = this.getRandomData('health', isUsedSystemAdvancePack)
    }
    hobbies = this.getRandomData('hobby', isUsedSystemAdvancePack)
    phobia = this.getRandomData('phobia', isUsedSystemAdvancePack)
    inventory = this.getRandomData('inventory', isUsedSystemAdvancePack)
    backpack = this.getRandomData('backpack', isUsedSystemAdvancePack)
    addInfo = this.getRandomData('addInfo', isUsedSystemAdvancePack)
    spec1 = this.getRandomData('spec1', isUsedSystemAdvancePack)
    spec2 = this.getRandomData('spec2', isUsedSystemAdvancePack)
    profession = this.getRandomData('profession', isUsedSystemAdvancePack, age)
    
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
    console.log('CreateDataPlayer',result)
    return result
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
  
  getRandomDataBunker(name) {
    let result = null
    
    let whileCount = 0
    while (!result) {
      if (whileCount>150) {
        throw ('Loop error')
      }
      this.getRandomPack(false,name)
      let nameArray = this.usedPack.chartBunkerData.filter(item => item.name===name)
      
      if (nameArray.length) {
        let index = this.getRandomInt(0, nameArray.length - 1)
        result = nameArray[index]
        delete result.name
      }
      whileCount += 1
    }
    return result
  }
  
  getRandomData(name, isUsedSystemAdvancePack, age = 0) {
    let result = {}
    let countWhile = 0
    age = +age
    
    if (name==='spec1' || name==='spec2') {
      name = 'card'
    }
    while (!result.text) {
      if (countWhile>1) {
        throw ('Loop throw')
      }
      this.getRandomPack(isUsedSystemAdvancePack,name)
      
      if (name==='profession') {
        // console.log('USED PACK',this.usedPack)
        let nameArray = this.usedPack.professionData.filter(item => {
          let resAge = +item.minAmateurAge || +this.systemSettings.minAmateurAge
          // console.log(resAge,resAge<=+age)
          return resAge<= +age
        })
        console.log('PROFESIA KURVA', nameArray.length)
        if (nameArray.length) {
          let index = this.getRandomInt(0, nameArray.length - 1)
          result = nameArray[index]
          result.isOpen = false
          result.text = result.name
          delete result.name
          index = this.usedPack.professionData.indexOf(nameArray[index])
          console.log(' ')
          console.log(' ')
          console.log(' ')
          console.log(' ')
          console.log(' ')
          console.log(' ')
          console.log(' ')
          console.log(' ')
          // console.log(index, this.usedPack.professionData[index], nameArray[index])
          this.usedPack.professionData.splice(index, 1)
          console.log(result.text,this.usedPack.professionData)
          // console.log(this.usedPack.professionData)
          // console.log(index, this.usedPack.professionData[index], nameArray[index])
          console.log(' ')
          console.log(' ')
          console.log(' ')
          console.log(' ')
          console.log(' ')
          console.log(' ')
        }
      }
      else {
        let nameArray = this.usedPack.chartPlayerData.filter(item => item.name===name)
        if (nameArray.length) {
          let index = this.getRandomInt(0, nameArray.length - 1)
          result = nameArray[index]
          delete result.name
          result.isOpen = false
          index = this.usedPack.chartPlayerData.indexOf(nameArray[index])
          this.usedPack.chartPlayerData.splice(index, 1)
        }
      }
      countWhile += 1
    }
    switch(name) {
      case 'body':
        result.text += ` (Рост: ${this.getRandomInt(this.systemSettings.minHeight, this.systemSettings.maxHeight)} см.)`
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
        const professionLevels = this.professionExp(result, age)
        result.text += ` (${professionLevels[this.getRandomInt(0, professionLevels.length - 1)]})`
        delete result.minAmateurAge
        delete result.minInternAge
        delete result.minMiddleAge
        delete result.minExperiencedAge
        delete result.minExpertAge
        
        
        break;
    }
    
    console.log(this.usedPack['usedPack'])
    return result
  }
  
  professionExp(result, age) {
    // let minAmateurAge = result.minAmateurAge || systemData.minAmateurAge
    let minInternAge = result.minInternAge || this.systemSettings.minInternAge
    let minMiddleAge = result.minMiddleAge || this.systemSettings.minMiddleAge
    let minExperiencedAge = result.minExperiencedAge || this.systemSettings.minExperiencedAge
    let minExpertAge = result.minExpertAge || this.systemSettings.minExpertAge
    let minProAge = result.minProAge || this.systemSettings.minProAge
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
  
  
  getRandomPack(isUsedSystemAdvancePack = false, name) {
    let packs = []
    let usedPacks = []

    // {chartPlayerData[{id,name,text},{id,name,text},{id,name,text},.....],chartBunkerData:[{id,name,text},{id,name,text},....],profession[{id,description,text,...},......]}

    if (isUsedSystemAdvancePack && this.systemAdvancePack) {
      usedPacks.push({status: 'advanceSystem', body: this.systemAdvancePack})
    }
    if (this.basePack) {
      usedPacks.push({status: 'base', body: this.basePack})
    }
    if (this.advancePack) {
      usedPacks.push({status: 'advance', body: this.advancePack})
    }
    
    for (let pack of usedPacks) {
      if (!objIsEmpty(pack.body)) {
        if (name==='profession' && !!pack.body.professionData) {
          packs.push(pack)
        }
        else if ((name.includes('bunker') || name.includes('catastrophe')) &&
          !!pack.body.chartBunkerData &&
          !!pack.body.chartBunkerData.find(item => item.name ===name)) {
          packs.push(pack)
        }
        else if (!!pack.body.chartPlayerData && !!pack.body.chartPlayerData.find(item => item.name ===name)) {
          packs.push(pack)
        }
      }
    }
    
    if (packs.length>0) {
      let advancePacks = packs.filter(pack => pack.status.includes('advance'))
      let basePacks = packs.filter(pack => pack.status==='base')
      if (advancePacks.length>0 && basePacks.length>0) {
        if (this.getRandomInt(0, advancePacks.length - 1)<=100 - this.systemSettings.priorityPackPercentage) {
          this.usedPack = this.basePack
          return
        }
        else {
          let advancePack = advancePacks[this.getRandomInt(0, advancePacks.length - 1)].body
          if(advancePack.status === 'advanceSystem'){
            this.usedPack = this.systemAdvancePack
            return
          } else {
            this.usedPack = this.advancePack
            return
          }
        }
      } else if(advancePacks.length>0) {
        let advancePack = advancePacks[this.getRandomInt(0, advancePacks.length - 1)].body
        if(advancePack.status === 'advanceSystem'){
          this.usedPack = this.systemAdvancePack
          return
        } else {
          this.usedPack = this.advancePack
          return
        }
      } else {
        this.usedPack = this.basePack
        return
      }
    }
    
    this.usedPack = this.systemBasePack
  }
  
  async dataForBunker(hostPack, systemData) {
    let {baseIdPack, advanceIdPack} = await this.howThisPack(hostPack)
    let dataBunker = {}
    
    
    let hostBaseDataPacksBunker = await this.getDataPackData(baseIdPack, 'bunker')
    let hostAdvanceDataPacksBunker = await this.getDataPackData(advanceIdPack, 'bunker')
    
    return {hostBaseDataPacksBunker, hostAdvanceDataPacksBunker}
    
  }
  
  async collectAndSetDataForPlayer(hostPack, players) {
    let {baseIdPack, advanceIdPack} = await this.howThisPack(hostPack)
    console.log('//////////////////')
    console.log(baseIdPack, advanceIdPack)
    console.log('//////////////////')
    
    console.log('!baseIdPack.includes(this.systemSettings.basePack)',!baseIdPack.includes(this.systemSettings.basePack))
    this.systemBasePack = await this.getDataPackData(this.systemSettings.basePack, 'all')
    if (!baseIdPack.includes(this.systemSettings.basePack)) {
      this.systemBasePack = await this.getDataPackData(this.systemSettings.basePack, 'all')
      console.log('Сделали системный пак')
    }
    let usePriorityAccess = false
    
    if (!advanceIdPack.includes(this.systemSettings.advancePack)) {
      for (let player of players) {
        console.log('playr.id', player.userId)
        if (player.userId>0) {
          let user = await UserModel.User.findOne({where: {id: player.userId}})
          console.log('/////////////////////////////////////////////////', user.isUsedSystemAdvancePack)
          if (user.isUsedSystemAdvancePack) {
            usePriorityAccess = true
            break;
          }
        }
      }
    }
    this.basePack = await this.getDataPackData(baseIdPack, 'all')
    this.advancePack = await this.getDataPackData(advanceIdPack, 'all')
    console.log('usePriorityAccess', usePriorityAccess)
    if (usePriorityAccess) {
      this.systemAdvancePack = await this.getDataPackData(this.systemSettings.advancePack, 'all')
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
      else {
        advanceIdPack.push(pack)
      }
    }
    return {baseIdPack, advanceIdPack}
    
  }
  
  async hostUsePack(hostId) {
    const dataPack = []
    
    
    if (hostId>0) {
      const user = await UserModel.User.findOne({where: {id: hostId}})
      if (user.isUsedSystemBasePack) {
        dataPack.push(this.systemSettings.basePack)
      }
      
      if (user.isUsedSystemAdvancePack) {
        dataPack.push(this.systemSettings.advancePack)
      }
      const packs = await UserModel.UserUsePack.findAll({where: {userId: hostId}})
      if (packs) {
        for (let pack of packs) {
          if (this.systemSettings.basePack!==pack.chartPackId && this.systemSettings.advancePack!==pack.chartPackId) {
            dataPack.push(pack.chartPackId)
          }
        }
      }
      return dataPack
    }
    
    dataPack.push(this.systemSettings.basePack)
    return dataPack
  }
  
  async playerUsePack(hostPack, playerId, gameRoomId) {
    
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
    if (!hostPack.includes(this.systemSettings.advancePack)) {
      hostPack.push(this.systemSettings.advancePack)
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
          {attributes: ['id', 'name', 'text'], where: {id: dataChartPlayerId}, raw: true})
        let professionData = await UserModel.Profession.findAll({
          attributes: ['id', 'name', 'description', 'minAmateurAge', 'minInternAge', 'minMiddleAge', 'minExperiencedAge', 'minExpertAge'],
          where: {id: dataProfessionId}, raw: true
        })
        let chartBunkerData = await UserModel.ChartBunker.findAll(
          {attributes: ['id', 'name', 'text'], where: {id: dataChartBunkerId}, raw: true})
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