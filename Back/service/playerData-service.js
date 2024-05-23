const UserModel = require('../model/models')
const tokenService = require('./token-service')
const ApiError = require('../exceptions/api-error')
require('dotenv').config()
const path = require('path')
const {Op} = require('sequelize')
const {logger} = require("sequelize/lib/utils/logger");
const sequelize = require('../db')

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
    this.systemSettings = systemData
    return systemData
  }

  async howStepLog(idRoom){
    let log = await UserModel.Logi.findAll({attributes:[sequelize.fn('MAX', sequelize.col('step'))],where:{idRoom:idRoom},raw:true})
    return (+log[0]['MAX(`step`)'])+1
  }
  
  async refreshChartBunker(chartName = null, idRoom, userId) {
    this.systemSettings = await this.getSystemSettingsData()
    let gameRoom = await UserModel.GameRooms.findOne({
      attributes: ['id', 'bunkerSize', 'maxSurvivor', 'catastrophe', 'bunkerTime', 'bunkerLocation', 'bunkerCreated', 'bunkerBedroom', 'bunkerItems1', 'bunkerItems2', 'bunkerItems3', 'imageId'],
      where: {idRoom: idRoom}
    })
   // console.log('ONE', gameRoom.id)
    let host = await UserModel.RoomSession.findOne({where: {userId: userId, gameRoomId: gameRoom.id}})
   // console.log('2', gameRoom.id)
    let usePack = JSON.parse(host.usePack)
   // console.log('ONE')
    await this.collectAndSetDataForBunkerRefresh(usePack, gameRoom, chartName)
   // console.log('TWO')
    let data = await this.refreshDataBunker(usePack, chartName, gameRoom, idRoom)
   // console.log('Three')
    if (chartName && chartName!=='catastrophe') {
      gameRoom[chartName] = data.id
      data = {[chartName]: data.text}
      
    }
    else if (chartName==='bunkerSize') {
      gameRoom[chartName] = data.bunkerSize
      data.bunkerSize = `${data.bunkerSize} кв.м`
    }
    else if (chartName==='catastrophe') {
      gameRoom[chartName] = data.newChart.id
      gameRoom[chartName] = data.imageId
      data = {[chartName]: data.newChart.text, imageName: data.imageName}
      
    }
   // console.log(data)
    return data
    
    
  }
  
  async refreshChartMvp(player, chartName, gameRoomId) {
    this.systemSettings = await this.getSystemSettingsData()
    console.log(this.systemSettings)
    let data = JSON.parse(player[chartName])
    let usePack = JSON.parse(player.usePack)
    let dataPack = null
    
    await this.collectAndSetDataForPlayerRefresh(usePack, gameRoomId, chartName)
    data = await this.refreshDataPlayer(usePack, chartName, data, gameRoomId, player)
    return data
  }
  
  async createDataGame(idRoom, playersData) {
    this.systemSettings = await this.getSystemSettingsData()
    const gameRoomData = await UserModel.GameRooms.findOne({where: {idRoom: idRoom}})
    const hostPackIds = await this.hostUsePack(gameRoomData.hostId)
    // console.log('hostPackIds!!!!!!!!!!', hostPackIds)
    const players = await UserModel.RoomSession.findAll({where: {gameRoomId: gameRoomData.id, isPlayer: 1}})
    const data = {
      players: {},
      userData: {},
      bunkerData: {},
      logsData: {}
    }
    await this.collectAndSetDataForPlayer(hostPackIds, players)
    
    for (let player of players) {
      let usePackIds = await this.playerUsePack(hostPackIds, player.userId, gameRoomData.id)
      let resultPlayerData = null
      if (playersData) {
        resultPlayerData = await this.createDataPlayer(usePackIds, player.userId, gameRoomData.id,
          playersData[player.userId])
      }
      else {
        resultPlayerData = await this.createDataPlayer(usePackIds, player.userId, gameRoomData.id)
      }
      if (resultPlayerData.isMVPRefresh===null) {
        delete resultPlayerData.isMVPRefresh
      }
      data.players = Object.assign(data.players, resultPlayerData)
    }
    
    let userData = await this.getAvailablePlayerData(idRoom)
    
    const bunkerData = await this.createDataBunker(idRoom, null, false, players)
    data.userData = Object.assign(data.userData, userData)
    data.bunkerData = Object.assign(data.bunkerData, bunkerData)
    await UserModel.Logi.create({idRoom: idRoom, funcName: 'StartGame', text: 'Игра началась', step: 0})
    data.logsData = {type:'text',value: 'Игра началась'}
    // console.log(data)
    return data
  }
  
  async createDataBunker(idRoom, maxSurvivor = null, isCatastrophe = false, players = null) {
    let bunkerTime = null
    let bunkerLocation = null
    let bunkerCreated = null
    let bunkerBedroom = null
    let bunkerItems = []
    let bunkerFood = null
    let catastrophe = null
    let imageId = null
    let imageName = null
    let bunkerSize = null
    bunkerSize = this.getRandomInt(20, 200)
    
    if (players!==null) {
      bunkerSize = this.getRandomInt(20, 200)
      maxSurvivor = Math.floor(+players.length / 2)
    }
    bunkerTime = this.getRandomDataBunker('bunkerTime')
    bunkerLocation = this.getRandomDataBunker('bunkerLocation')
    bunkerCreated = this.getRandomDataBunker('bunkerCreated')
    bunkerBedroom = this.getRandomDataBunker('bunkerBedroom')
    let itemId = []
    for (let i = 0; i<3; i++) {
      let item = this.getRandomDataBunker('bunkerItems')
      itemId.push(item.id)
      bunkerItems.push(item.text)
    }
    // bunkerItems = this.getRandomDataBunker('bunkerItems')
    bunkerFood = this.getRandomDataBunker('bunkerFood')
    if (!isCatastrophe) {
      catastrophe = this.getRandomDataBunker('catastrophe')
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
    }
    //console.log('catastrophe', catastrophe)

    
    let thisGame = await UserModel.GameRooms.findOne({where: {idRoom: idRoom}})
    if (players!==null) {
      thisGame.bunkerSize = bunkerSize
      thisGame.maxSurvivor = maxSurvivor
    }
    
    thisGame.bunkerSize = bunkerSize
    thisGame.maxSurvivor = maxSurvivor
    thisGame.bunkerLocation = bunkerLocation.id
    thisGame.bunkerCreated = bunkerCreated.id
    thisGame.bunkerBedroom = bunkerBedroom.id
    thisGame.bunkerFood = bunkerFood.id
    
    if (!isCatastrophe) {
      thisGame.catastrophe = catastrophe.id
      thisGame.imageId = imageId
    }
    thisGame.bunkerItems1 = itemId[0]
    thisGame.bunkerItems2 = itemId[1]
    thisGame.bunkerItems3 = itemId[2]
    thisGame.bunkerTime = bunkerTime.id
    await thisGame.save()
    
    if (!isCatastrophe) {
      return {
        bunkerTime: bunkerTime.text,
        bunkerSize: `${bunkerSize} кв.м` || null,
        maxSurvivor: maxSurvivor || null,
        bunkerLocation: bunkerLocation.text,
        bunkerCreated: bunkerCreated.text,
        bunkerBedroom: bunkerBedroom.text,
        bunkerItems: bunkerItems,
        bunkerFood: bunkerFood.text,
        catastrophe: catastrophe.text,
        imageName: imageName
      }
    }
    else {
      return {
        bunkerTime: bunkerTime.text,
        bunkerSize: `${bunkerSize} кв.м` || null,
        maxSurvivor: maxSurvivor || null,
        bunkerLocation: bunkerLocation.text,
        bunkerCreated: bunkerCreated.text,
        bunkerBedroom: bunkerBedroom.text,
        bunkerItems: bunkerItems,
        bunkerFood: bunkerFood.text
        
      }
    }
    
  }
  
  async getAvailableVoitingData(gameRoom, playerId) {
    
    if (gameRoom.voitingStatus===null) {
      return null
    }
    console.log(gameRoom.voitingStatus)
    let voitingPull = {}
    // voitingPull.status = gameRoom.voitingStatus
    if (gameRoom.voitingStatus===1) {
      let players = await UserModel.RoomSession.findAll({where: {gameRoomId: gameRoom.id, isPlayer: 1}})
      for (let player of players) {
        if (player.votedFor!==null) {
          if (!voitingPull[player.votedFor]) {
            voitingPull[player.votedFor] = []
          }
          voitingPull[player.votedFor].push(player.userId)
        }
      }
      return {status: gameRoom.voitingStatus, voitingPull: voitingPull}
    }
    else {
      let player = await UserModel.RoomSession.findOne(
        {where: {gameRoomId: gameRoom.id, isPlayer: 1, userId: playerId}})
      if (player) {
        if (player.votedFor===null) {
          voitingPull.userChoise = null
        }
        else {
          voitingPull.userChoise = player.votedFor
        }
      }
      return {status: gameRoom.voitingStatus, userChoise: voitingPull.userChoise}
      
      
    }
    console.log(voitingPull)
  }
  
  
  async joinGameData(idRoom, playerId, isWatcher = false) {
    let gameRoom = await UserModel.GameRooms.findOne({
      attributes: ['id', 'bunkerSize', 'bunkerCreated', 'maxSurvivor', 'catastrophe', 'bunkerTime', 'bunkerLocation', 'bunkerBedroom', 'bunkerItems1', 'bunkerItems2', 'bunkerItems3', 'bunkerFood', 'imageId', 'voitingStatus'],
      where: {idRoom: idRoom},
      raw: true
    })
    let bunkerData = {}
    let logsData = []
    let logs = await UserModel.Logi.findAll({where: {idRoom: idRoom}})
    
    if (!objIsEmpty(logs)) {

      for (let log of logs) {
        let obLog = {}

        if(log.funcName==='rollTheDice'){
          obLog.type='rollDice'
          obLog.value = log.text
        }else if(log.funcName==='voitingFinished'){
          let data = JSON.parse(log.lastVar)
          obLog.value = data
          obLog.type='voiting'
        }else{
          obLog.type='text'
          obLog.value = log.text
        }
        console.log(obLog)
        logsData.push(obLog)
      }
    }
    console.log(objIsEmpty(logs))
    bunkerData.bunkerSize = `${gameRoom.bunkerSize}кв.м`
    bunkerData.maxSurvivor = gameRoom.maxSurvivor
    let bunkerItems = []
    for (let key in gameRoom) {
      if (key.toString()!=='id' && key.toString()!=='bunkerSize' && key.toString()!=='maxSurvivor' && key.toString()!=='imageId' && key.toString()!=='bunkerItems1' && key.toString()!=='bunkerItems2' && key.toString()!=='bunkerItems3' && key.toString()!=='voitingStatus') {
        let chartBunker = await UserModel.ChartBunker.findOne({where: {id: gameRoom[key]}})
        bunkerData[key] = chartBunker.text
        
      }
      else if (key.toString()==='imageId') {
        let image = await UserModel.CatastropheImage.findOne({where: {id: gameRoom[key]}})
        bunkerData.imageName = image.imageName
      }
      else if (key.toString()==='bunkerItems1' || key.toString()==='bunkerItems2' || key.toString()==='bunkerItems3') {
        let chartBunker = await UserModel.ChartBunker.findOne({where: {id: gameRoom[key]}})
        bunkerItems.push(chartBunker.text)
      }
    }
    bunkerData.bunkerItems = bunkerItems
    
    let userData = await this.getAvailablePlayerData(idRoom)
    let voitingData = null
    if (!isWatcher || gameRoom.voitingStatus===1) {
      voitingData = await this.getAvailableVoitingData(gameRoom, playerId)
    }
    let players = {}
    let allPlayers = await UserModel.RoomSession.findAll({
      attributes: ['userId', 'sex', 'body', 'trait', 'profession', 'health', 'hobbies', 'phobia', 'inventory', 'backpack', 'addInfo', 'spec1', 'spec2', 'isMVPRefresh'],
      where: {gameRoomId: gameRoom.id, isPlayer: 1},
      raw: true
    })
    
    for (let player in allPlayers) {
      let playerData = {}
      if (allPlayers[player].userId===playerId && !isWatcher) {
        for (let key in allPlayers[player]) {
          if (key.toString()!=='isMVPRefresh') {
            playerData[key] = JSON.parse(allPlayers[player][key])
          }
          else if (key.toString()==='isMVPRefresh' && allPlayers[player][key]!==null) {
            playerData[key] = !!allPlayers[player][key]
          }
        }
      }
      else {
        for (let key in allPlayers[player]) {
          if (key.toString()!=='isMVPRefresh') {
            let data = JSON.parse(allPlayers[player][key])
            if (data && data.isOpen) {
              playerData[key] = data
            }
          }
        }
      }
      if (!objIsEmpty(playerData)) {
        players[allPlayers[player].userId] = playerData
      }
    }
    
    if (voitingData===null) {
      return {players: players, userData: userData, bunkerData: bunkerData, logsData: logsData}
    }
    else {
      return {
        players: players,
        userData: userData,
        bunkerData: bunkerData,
        voitingData: voitingData,
        logsData: logsData
      }
    }//{id:1}
    //key = id
    //gameRoom[key]=1
    
  }
  
  
  async getAvailablePlayerData(idRoom) {
    const gameRoomData = await UserModel.GameRooms.findOne({where: {idRoom: idRoom}})
    const players = await UserModel.RoomSession.findAll({where: {gameRoomId: gameRoomData.id}})
    
    let data = {}
    for (let player of players) {
      let userData = {}
      if (player.userId>0) {
        let user = await UserModel.User.findOne({where: {id: player.userId}})
        
        userData.nickname = user.nickname
        userData.avatar = user.avatar
        userData.isPlayer = player.isPlayer
        userData.accessLevel = user.accsessLevel
        // userData.
      }
      else {
        // userData.id = player.userId
        userData.nickname = `Гость#${Math.abs(player.userId)}`
        userData.avatar = null
        userData.isPlayer = player.isPlayer
        userData.accessLevel = 'noreg'
        
        
      }
      if (player.isAlive) {
        userData.isAlive = true
      }
      else {
        userData.isAlive = false
      }
      data[player.userId] = userData
    }
    return data
    
    
  }
  
  async refreshDataBunker(usePack, chartName = null, gameRoom, idRoom) {
    let isUsedSystemAdvancePack = false
    if (usePack.includes(this.systemSettings.advancePack)) {
      isUsedSystemAdvancePack = true
    }
    if (chartName===null) {
      return await this.createDataBunker(idRoom, gameRoom.maxSurvivor, true)
    }
    else if (chartName==='bunkerItems2' || chartName==='bunkerItems1' || chartName==='bunkerItems3') {
      return this.getRandomDataBunker('bunkerItems', isUsedSystemAdvancePack)
    }
    else if (chartName==='catastrophe') {
      let newChart = this.getRandomDataBunker(chartName, isUsedSystemAdvancePack)
      let allImageId = await UserModel.CatastropheImage.findAll({where: {catastropheId: newChart.id}})
      // console.log('allImageId', allImageId)
      let imageId = null
      let imageName = null
      if (allImageId.length===1) {
        imageId = allImageId[0].id
        imageName = allImageId[0].imageName
      }
      else if (chartName==='bunkerSize') {
        let bunkerSize = this.getRandomInt(20, 200)
        return {bunkerSize: bunkerSize}
      }
      else {
        let index = this.getRandomInt(0, allImageId.length - 1)
        let image = allImageId[index]
        imageId = image.id
        imageName = image.imageName
      }
      return {newChart, imageName, imageId}
      
    }
    else {
      return this.getRandomDataBunker(chartName, isUsedSystemAdvancePack)
    }
  }
  
  async refreshDataPlayer(usePack, chartName, data, gameRoomId, user) {
    let isUsedSystemAdvancePack = false
    if (usePack.includes(this.systemSettings.advancePack)) {
      isUsedSystemAdvancePack = true
    } 
    
    let players = await UserModel.RoomSession.findAll(
      {attributes: [chartName], where: {gameRoomId: gameRoomId, isPlayer: 1}})
    if (chartName==='sex') {
      for (let player of players) {
        let playerData = JSON.parse(player[chartName])
        if (playerData.text.includes('чайлдфри')) {
          this.childFreeCount += 1
        }
      }
    }
    if (chartName==='health') {
      for (let player of players) {
        let playerData = JSON.parse(player[chartName])
        if (playerData.text.includes('Идеально здоров')) {
          this.perfectHealthCount += 1
          
        }
      }
    }
    let age = 41
    let isGood = false
    while (!isGood) {
      
      if (chartName==='sex') {
        let age = this.getRandomInt(this.systemSettings.minAge, this.systemSettings.maxAge)
        let sex = !!this.getRandomInt(0, 1)
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
        if (sex!==data.text) {
          isGood = true
          data.text = sex
          
        }
      }
      else if (chartName==='health') {
        
        let health = null
        
        if (!((this.perfectHealthCount + 1) / 8 * 100>30) && this.getRandomInt(0,
          100)<=this.systemSettings.perfectHealthPercentage) {
          health = {id: 0, text: 'Идеально здоров', isOpen: false}
          this.perfectHealthCount += 1
        }
        else {
          health = this.getRandomData('health', isUsedSystemAdvancePack)
        }
        
        if (health!==data.text) {
          isGood = true
          data.text = health.text
          data.id = health.id
          
        }
      }
      else if (chartName==='profession') {
        let datas = JSON.parse(user.sex).text
        let newAge = parseInt(datas.match(/\d+/))
        if (newAge) {
          if (newAge>16) {
            age = newAge
          }
          else {
            age = 16
          }
        }
        console.log(newAge, age)
        let profession = this.getRandomData(
          'profession',
          isUsedSystemAdvancePack, age)
        if (profession.text!==data.text) {
          isGood = true
          data.text = profession.text
          data.id = profession.id
          data.description = profession.description
          
        }
      }
      else {
        
        let newChart = this.getRandomData(chartName, isUsedSystemAdvancePack)
        //console.log(newChart)
        if (newChart.text!==data.text) {
          isGood = true
          data.text = newChart.text
          data.id = newChart.id
          
        }
      }
      
    }
    return data
    
  }
  
  async createDataPlayer(usePackIds, playerId, gameRoomId, playerData) {
    let isUsedSystemAdvancePack = false
    if (usePackIds.includes(this.systemSettings.advancePack)) {
      isUsedSystemAdvancePack = true
    }
    let age = playerData?.age || null
    let sex = playerData?.sex || null
    let body = playerData?.body || null
    let trait = playerData?.trait || null
    let health = playerData?.health || null
    let hobbies = playerData?.hobbies || null
    let phobia = playerData?.phobia || null
    let inventory = playerData?.inventory || null
    let backpack = playerData?.backpack || null
    let addInfo = playerData?.addInfo || null
    let spec1 = playerData?.spec1 || null
    let spec2 = playerData?.spec2 || null
    let profession = playerData?.profession || null
    let isMVPRefresh = null
    if (sex===null) {
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
    }
    else {
      
      age = 41
    }
    
    body = body? {id: 0, text: body, isOpen: false}:this.getRandomData('body', isUsedSystemAdvancePack)
    
    trait = trait? {id: 0, text: trait, isOpen: false}:this.getRandomData('trait', isUsedSystemAdvancePack)
    
    if (health===null) {
      if (!((this.perfectHealthCount + 1) / 8 * 100>30) && this.getRandomInt(0,
        100)<=this.systemSettings.perfectHealthPercentage) {
        health = {id: 0, text: 'Идеально здоров', isOpen: false}
        this.perfectHealthCount += 1
      }
      else {
        health = this.getRandomData('health', isUsedSystemAdvancePack)
      }
    }
    else {
      health = {id: 0, text: health, isOpen: false}
    }
    hobbies = hobbies? {id: 0, text: hobbies, isOpen: false}:this.getRandomData('hobbies', isUsedSystemAdvancePack)
    
    
    phobia = phobia? {id: 0, text: phobia, isOpen: false}:this.getRandomData('phobia', isUsedSystemAdvancePack)
    
    
    inventory = inventory? {id: 0, text: inventory, isOpen: false}:this.getRandomData('inventory',
      isUsedSystemAdvancePack)
    
    
    backpack = backpack? {id: 0, text: backpack, isOpen: false}:this.getRandomData('backpack',
      isUsedSystemAdvancePack)
    
    
    addInfo = addInfo? {id: 0, text: addInfo, isOpen: false}:this.getRandomData('addInfo', isUsedSystemAdvancePack)
    
    
    spec1 = spec1? {id: 0, text: spec1, isOpen: false}:this.getRandomData('spec1', isUsedSystemAdvancePack)
    
    
    spec2 = spec2? {id: 0, text: spec2, isOpen: false}:this.getRandomData('spec2', isUsedSystemAdvancePack)
    
    
    profession = profession? {id: 0, text: profession, description: '', isOpen: false}:this.getRandomData(
      'profession',
      isUsedSystemAdvancePack, age)
    
    
    let thisPlayer = await UserModel.RoomSession.findOne({where: {userId: playerId, gameRoomId: gameRoomId}})
    if (playerId>0) {
      let thisUser = await UserModel.User.findOne({where: {id: playerId}})
      if (thisUser.accsessLevel.toString().toLowerCase()==="mvp" || thisUser.accsessLevel.toString().toLowerCase()==="admin") {
        thisPlayer.isMVPRefresh = 0
        isMVPRefresh = false
      }
    }
    thisPlayer.sex = JSON.stringify({text: sex, isOpen: false})
    thisPlayer.body = JSON.stringify(body)
    thisPlayer.trait = JSON.stringify(trait)
    thisPlayer.health = JSON.stringify(health)
    thisPlayer.hobbies = JSON.stringify(hobbies)
    thisPlayer.phobia = JSON.stringify(phobia)
    thisPlayer.inventory = JSON.stringify(inventory)
    thisPlayer.backpack = JSON.stringify(backpack)
    thisPlayer.addInfo = JSON.stringify(addInfo)
    thisPlayer.spec1 = JSON.stringify(spec1)
    thisPlayer.spec2 = JSON.stringify(spec2)
    thisPlayer.profession = JSON.stringify(profession)
    await thisPlayer.save()
    
    let result = {}
    result[playerId] = {
      
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
      profession: profession,
      isMVPRefresh: isMVPRefresh
    }
    // console.log('CreateDataPlayer', result)
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
      if (whileCount>10) {
        throw ('Loop error')
      }
      this.getRandomPack(false, name)
      let nameArray = this.usedPack.chartBunkerData.filter(item => item.name===name)
      
      if (nameArray.length) {
        let index = this.getRandomInt(0, nameArray.length - 1)
        result = nameArray[index]
        delete result.name
        
        index = this.usedPack.chartBunkerData.indexOf(nameArray[index])
        this.usedPack.chartBunkerData.splice(index, 1)
      }
      if (name==='bunkerCreated') {
        let age = this.getRandomInt(1, 50)
        let bunkerAge = `${age} ${this.getAgeText(age)}`
        result.text = result.text.replace('[year]', bunkerAge)
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
      if (countWhile>10) {
        throw ('Loop throw')
      }
      this.getRandomPack(isUsedSystemAdvancePack, name)
      // console.log('PROFESSION PACK LENGTH', this.usedPack.professionData.length);
      
      if (name==='profession') {
        let nameArray = this.usedPack.professionData.filter(item => {
          let resAge = +item.minAmateurAge || +this.systemSettings.minAmateurAge
          return resAge<= +age
        })
        // console.log('PROFESIA KURVA', nameArray.length)
        if (nameArray.length) {
          let index = this.getRandomInt(0, nameArray.length - 1)
          result = nameArray[index]
          result.isOpen = false
          result.text = result.name
          delete result.name
          index = this.usedPack.professionData.indexOf(nameArray[index])
          //   console.log(' ')
          //   console.log(' ')
          //   console.log(' ')
          //  console.log(' ')
          //   console.log(' ')
          //    console.log(' ')
          //    console.log(' ')
          //    console.log(' ')
          this.usedPack.professionData.splice(index, 1)
          //    console.log(result.text, this.usedPack.professionData)
          //    console.log(' ')
          //   console.log(' ')
          //   console.log(' ')
          //   console.log(' ')
          //    console.log(' ')
          //    console.log(' ')
        }
      }
      else {
        let nameArray = this.usedPack.chartPlayerData.filter(item => item.name===name)
        if (nameArray.length) {
          let index = this.getRandomInt(0, nameArray.length - 1)
          result = nameArray[index]
          delete result.name
          result.isOpen = false
          if (name!=='health') {
            delete result.dontAddLevelInfo
          }
          index = this.usedPack.chartPlayerData.indexOf(nameArray[index])
          this.usedPack.chartPlayerData.splice(index, 1)
        }
      }
      countWhile += 1
    }
    
    switch(name) {
      case 'body':
        result.text += ` (Рост: ${this.getRandomInt(this.systemSettings.minHeight,
          this.systemSettings.maxHeight)} см.)`
        break;
      case 'health':
        if (result.text!=='Идеально здоров' && result.dontAddLevelInfo===0) {
          
          
          const diseaseLevels = ['Легкая степень', 'Средняя степень', 'Тяжелая степень', 'Критическая степень']
          result.text += ` (${diseaseLevels[this.getRandomInt(0, diseaseLevels.length - 1)]})`
        }
        delete result.dontAddLevelInfo
        break;
      case 'hobbies':
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
      //  console.log('SYSTEMADVANCEPACK')
      usedPacks.push({status: 'advanceSystem', body: this.systemAdvancePack})
    }
    if (this.basePack) {
      if ((typeof this.basePack)==='object' && !objIsEmpty(this.basePack)) {
        // console.log('BASEPACK')
        usedPacks.push({status: 'base', body: this.basePack})
      }
    }
    if (this.advancePack) {
      if ((typeof this.advancePack)==='object' && !objIsEmpty(this.advancePack)) {
        // console.log('ADVANCEPACK')
        usedPacks.push({status: 'advance', body: this.advancePack})
      }
    }
    
    //  console.log('USED PACKS', usedPacks)
    for (let pack of usedPacks) {
      if (!objIsEmpty(pack.body)) {
        //  console.log('/////////////////////////////////')
        //  console.log(name==='profession' && !!pack.body.professionData)
        //  console.log((name.includes('bunker') || name.includes('catastrophe')) &&
        //    !!pack.body.chartBunkerData &&
        //    !!pack.body.chartBunkerData.find(item => item.name===name))
        //  console.log(pack.body.chartPlayerData)
        if (name==='profession' && !!pack.body.professionData) {
          packs.push(pack)
          //  console.log('STATUS', pack.status)
        }
        else if ((name.includes('bunker') || name.includes('catastrophe')) &&
          !!pack.body.chartBunkerData &&
          !!pack.body.chartBunkerData.find(item => item.name===name)) {
          packs.push(pack)
          //    console.log('STATUS2', pack.status)
        }
        else if (!!pack.body.chartPlayerData && !!pack.body.chartPlayerData.find(item => item.name===name)) {
          packs.push(pack)
          // console.log('STATUS3', pack.status)
        }
      }
    }
    
    if (packs.length>0) {
      //  console.log('PACKSSSSSSSS', packs.length)
      let advancePacks = packs.filter(pack => pack.status.includes('advance'))
      let basePacks = packs.filter(pack => pack.status==='base')
      if (advancePacks.length>0 && basePacks.length>0) {
        if (this.getRandomInt(0, advancePacks.length - 1)<=100 - this.systemSettings.priorityPackPercentage) {
          this.usedPack = this.basePack
          return
        }
        else {
          if (advancePacks.length===1) {
            if (advancePacks[0].status==='advanceSystem') {
              this.usedPack = this.systemAdvancePack
              return
            }
            else {
              this.usedPack = this.advancePack
              return
            }
          }
          let advancePack = advancePacks[this.getRandomInt(0, advancePacks.length - 1)].body
          if (advancePack.status==='advanceSystem') {
            this.usedPack = this.systemAdvancePack
            return
          }
          else {
            this.usedPack = this.advancePack
            return
          }
        }
      }
      else if (advancePacks.length>0) {
        //  console.log('PACKSSSSSSSS2', advancePacks.length)
        if (advancePacks.length===1) {
          if (advancePacks[0].status==='advanceSystem') {
            this.usedPack = this.systemAdvancePack
            return
          }
          else {
            this.usedPack = this.advancePack
            return
          }
        }
        let advancePack = advancePacks[this.getRandomInt(0, advancePacks.length - 1)].body
        if (advancePack.status==='advanceSystem') {
          this.usedPack = this.systemAdvancePack
          return
        }
        else {
          this.usedPack = this.advancePack
          return
        }
      }
      else {
        this.usedPack = this.basePack
        return
      }
    }
    //  console.log('isUsedBasePackssssssssssssssssssssssssssssssssss')
    this.usedPack = this.systemBasePack
  }
  
  async dataForBunker(hostPack, systemData) {
    let {baseIdPack, advanceIdPack} = await this.howThisPack(hostPack)
    let dataBunker = {}
    
    
    let hostBaseDataPacksBunker = await this.getDataPackData(baseIdPack, 'bunker')
    let hostAdvanceDataPacksBunker = await this.getDataPackData(advanceIdPack, 'bunker')
    
    return {hostBaseDataPacksBunker, hostAdvanceDataPacksBunker}
    
  }
  
  async collectAndSetDataForBunkerRefresh(usePack, gameRoom, chartName = null) {
    let {baseIdPack, advanceIdPack} = await this.howThisPack(usePack)
    let useChartId = []
    if (chartName===null) {
      for (let key in gameRoom) {
        if (key.toString()!=='id' && key.toString()!=='bunkerSize' && key.toString()!=='maxSurvivor' && key.toString()!=='imageId') {
          
          useChartId.push(gameRoom[key])
          
          
        }
      }
    }
    else if (chartName==='bunkerItems2' || chartName==='bunkerItems1' || chartName==='bunkerItems3') {
      useChartId.push(gameRoom.bunkerItems1)
      useChartId.push(gameRoom.bunkerItems2)
      useChartId.push(gameRoom.bunkerItems3)
      
    }
    else {
      if (gameRoom[chartName]) {
        useChartId.push(gameRoom[chartName])
      }
    }
    if (chartName!=='bunkerSize') {
      if (!baseIdPack.includes(+this.systemSettings.basePack)) {
        console.log(this.systemSettings.basePack)
        this.systemBasePack = await this.getDataPackRefresh(this.systemSettings.basePack, useChartId, chartName, true)
        //  console.log('Сделали системный пак')
      }
      
      if (!advanceIdPack.includes(+this.systemSettings.advancePack)) {
        this.systemAdvancePack = await this.getDataPackRefresh(this.systemSettings.advancePack, useChartId, chartName,
          true)
      }
      console.log(baseIdPack, advanceIdPack)
      this.basePack = await this.getDataPackRefresh(baseIdPack, useChartId, chartName, true)
      this.advancePack = this.getDataPackRefresh(advanceIdPack, useChartId, chartName, true)
    }
    
    
  }
  
  async collectAndSetDataForPlayerRefresh(usePack, gameRoomId, chartName) {
    let {baseIdPack, advanceIdPack} = await this.howThisPack(usePack)
    let players = await UserModel.RoomSession.findAll(
      {attributes: [`${chartName}`], where: {gameRoomId: gameRoomId, isPlayer: 1}})
    let useChartId = []
    for (let player of players) {
      let data = JSON.parse(player[chartName])
      if (data.id && data.id!==0) {
        useChartId.push(data.id)
        
      }
    }
    if (!baseIdPack.includes(+this.systemSettings.basePack)) {
      console.log(this.systemSettings.basePack)
      this.systemBasePack = await this.getDataPackRefresh(this.systemSettings.basePack, useChartId, chartName)
      //  console.log('Сделали системный пак')
    }
    
    if (!advanceIdPack.includes(+this.systemSettings.advancePack)) {
      this.systemAdvancePack = await this.getDataPackRefresh(this.systemSettings.advancePack, useChartId, chartName)
    }
    console.log(baseIdPack, advanceIdPack)
    this.basePack = await this.getDataPackRefresh(baseIdPack, useChartId, chartName)
    this.advancePack = this.getDataPackRefresh(advanceIdPack, useChartId, chartName)
    
    
  }
  
  async collectAndSetDataForPlayer(hostPack, players) {
    let {baseIdPack, advanceIdPack} = await this.howThisPack(hostPack)
    // console.log('//////////////////')
    //console.log(baseIdPack, advanceIdPack)
    // console.log('//////////////////')
    
    // console.log('!baseIdPack.includes(this.systemSettings.basePack)',
    //    !baseIdPack.includes(this.systemSettings.basePack))
    // this.systemBasePack = await this.getDataPackData(this.systemSettings.basePack, 'all')
    // console.log('collectAndSetDataForPlayer', baseIdPack.includes(+this.systemSettings.basePack))
    if (!baseIdPack.includes(+this.systemSettings.basePack)) {
      this.systemBasePack = await this.getDataPackData(this.systemSettings.basePack, 'all')
      //  console.log('Сделали системный пак')
    }
    let usePriorityAccess = false
    
    if (!advanceIdPack.includes(this.systemSettings.advancePack)) {
      for (let player of players) {
        // console.log('playr.id', player.userId)
        if (player.userId>0) {
          let user = await UserModel.User.findOne({where: {id: player.userId}})
          //  console.log('/////////////////////////////////////////////////', user.isUsedSystemAdvancePack)
          if (user.isUsedSystemAdvancePack) {
            usePriorityAccess = true
            break;
          }
        }
      }
    }
    this.basePack = await this.getDataPackData(baseIdPack, 'all')
    this.advancePack = await this.getDataPackData(advanceIdPack, 'all')
    // console.log('usePriorityAccess', usePriorityAccess)
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
            let checkPack = await UserModel.ChartPack.findOne({where: {id: pack.chartPackId}})
            if (!checkPack.isHidden) {
              dataPack.push(pack.chartPackId)
            }
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
      player.usePack = JSON.stringify(hostPack)
      await player.save()
      return hostPack
    }
    
    const user = await UserModel.User.findOne({where: {id: playerId}})
    if (!user.isUsedSystemAdvancePack) {
      player.usePack = JSON.stringify(hostPack)
      await player.save()
      return hostPack
    }
    if (!hostPack.includes(this.systemSettings.advancePack)) {
      hostPack.push(this.systemSettings.advancePack)
    }
    
    player.usePack = JSON.stringify(hostPack)
    await player.save()
    return hostPack
  }
  
  async getDataPackRefresh(dataPackId, useChartId, chartName, isBunkerData = false) {
    console.log(useChartId)
    console.log(dataPackId)
    if (chartName==='profession' && !isBunkerData) {
      let professionIdPlayerData = await UserModel.ProfessionChartPack.findAll(
        {attributes: ['professionId'], where: {chartPackId: dataPackId}})
      let dataProfessionIdPlayerData = []
      for (let chartId of professionIdPlayerData) {
        if (!useChartId.includes(chartId.professionId)) {
          dataProfessionIdPlayerData.push(chartId.professionId)
        }
      }
      let dataProfessionChartData = await UserModel.Profession.findAll({
        attributes: ['id', 'name', 'description', 'minAmateurAge', 'minInternAge', 'minMiddleAge', 'minExperiencedAge', 'minExpertAge'],
        where: {id: dataProfessionIdPlayerData}, raw: true
      })
      
      
      return {professionData: dataProfessionChartData}
      
    }
    else if (!isBunkerData) {
      let chartPlayerIdPlayerData = await UserModel.PlayerChartPack.findAll(
        {attributes: ['chartPlayerId'], where: {chartPackId: dataPackId}})
      
      
      let dataChartPlayerIdPlayerData = []
      for (let chartId of chartPlayerIdPlayerData) {
        if (!useChartId.includes(chartId.chartPlayerId)) {
          dataChartPlayerIdPlayerData.push(chartId.chartPlayerId)
        }
      }
      
      let dataPlayerChartData = await UserModel.ChartPlayer.findAll(
        {attributes: ['id', 'name', 'text'], where: {id: dataChartPlayerIdPlayerData}, raw: true})
      
      return {chartPlayerData: dataPlayerChartData}
    }
    else {
      let bunkerChart = await UserModel.BunkerChartPack.findAll(
        {attributes: ['chartBunkerId'], where: {chartPackId: dataPackId}})
      let dataBunker = []
      for (let chartId of bunkerChart) {
        if (!useChartId.includes(chartId.chartBunkerId)) {
          dataBunker.push(chartId.chartBunkerId)
        }
      }
      let dataBunkerChart = await UserModel.ChartBunker.findAll(
        {attributes: ['id', 'name', 'text'], where: {id: dataBunker}, raw: true})
      return {chartBunkerData: dataBunkerChart}
    }
    
  }
  
  async getDataPackData(dataPackId, track = null) {

//  let chartPlayerId = await UserModel.PlayerChartPack.findAll({where: {chartPackId:{[Op.or]: dataPackId, }}})
    //  console.log('TRACK', track)
    switch(track) {
      case 'player':
        let playersChart = await UserModel.PlayerChartPack.findAll(
          {attributes: ['chartPlayerId'], where: {chartPackId: dataPackId}})
        let dataPlayer = []
        for (let chartId of playersChart) {
          
          dataPlayer.push(chartId.chartPlayerId)
        }
        let dataPlayerChart = await UserModel.ChartPlayer.findAll(
          {attributes: ['id', 'name', 'text'], where: {id: dataPlayer}, raw: true})
        //  console.log(dataPlayer)
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
          where: {id: dataProfession},
          raw: true
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
          {attributes: ['id', 'name', 'text', 'dontAddLevelInfo'], where: {id: dataChartPlayerId}, raw: true})
        let professionData = await UserModel.Profession.findAll({
          attributes: ['id', 'name', 'description', 'minAmateurAge', 'minInternAge', 'minMiddleAge', 'minExperiencedAge', 'minExpertAge'],
          where: {id: dataProfessionId}, raw: true
        })
        let chartBunkerData = await UserModel.ChartBunker.findAll(
          {attributes: ['id', 'name', 'text'], where: {id: dataChartBunkerId}, raw: true})
        let result = {}
        if (!objIsEmpty(chartBunkerData)) {
          result.chartBunkerData = chartBunkerData
        }
        if (!objIsEmpty(professionData)) {
          result.professionData = professionData
        }
        if (!objIsEmpty(chartPlayerData)) {
          result.chartPlayerData = chartPlayerData
        }
        if (objIsEmpty(result)) {
          return null
        }
        return result
    }
    
  }
  
  async setStatisticGame(idRoom) {
    let gameRoom = await UserModel.GameRooms.findOne({where: {idRoom: idRoom}})
    let diffMinute = Math.floor((new Date() - +gameRoom.createdAt) / 1000 / 60)
    if (diffMinute>20) {
      let players = await UserModel.RoomSession.findAll({where: {gameRoomId: gameRoom.id, isPlayer: 1}})
      for (let player of players) {
        if (player.userId>0) {
          let user = await UserModel.User.findOne({where: {id: player.userId}})
          user.numGame++
          if (player.isAlive) {
            user.numWinGame++
          }
          await user.save()
        }
      }
      
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