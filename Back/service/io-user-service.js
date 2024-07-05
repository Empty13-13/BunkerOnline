const bcrypt = require('bcrypt')
const uuid = require('uuid')
const mailService = require('./mail-service')
const UserModel = require('../model/models')
const tokenService = require('./token-service')
const UserDto = require('../dtos/user-dto')
const UserDtoDiscord = require('../dtos/user-dtoDiscord')
const ApiError = require('../exceptions/api-error')
const axios = require('axios')
const fs = require('fs')
require('dotenv').config()
const path = require('path')
const {Op} = require('sequelize')
const playerDataService = require('../service/playerData-service')
const ioHostRevFunc = require('../service/io-host-reverseFunc-service')
const {User} = require("../model/models");

/**
 * @type {number}
 */
const timeToCloseRoom = 6 * 60 * 60 * 1000
const timerList = {}//{'B725D':setTimeout(),'A123D':setTimeout()}

class ioUserService {
  
  async isAgeRestriction(hostId) {
    await playerDataService.getSystemSettingsData()
    let hostPack = await playerDataService.hostUsePack(hostId)
    let packs = await UserModel.ChartPack.findAll({where: {id: hostPack, ageRestriction: 1}})
    let result = false
    if (packs.length>0) {
      result = true
    }
    return result
    
  }

  async finishedVoiting(idRoom, userId, io, socket) {
    let gameRoom = await UserModel.GameRooms.findOne({where: {idRoom: idRoom}})
    if (gameRoom && gameRoom.isStarted) {
      if (gameRoom.voitingStatus!==null) {
        gameRoom.voitingStatus = 1
        let voitingData = await playerDataService.getAvailableVoitingData(gameRoom, userId)
        await gameRoom.save()
        let logs = JSON.stringify(voitingData)
        await UserModel.Logi.create(
          {
            idRoom: idRoom, funcName:
              'voitingFinished', text:
              'Голосование закончилось', step:
              0, lastVar:
            logs
          }
        )
        io.in([idRoom, `watchers:${idRoom}`]).emit('setAllGameData',
          {voitingData: voitingData, logsData: [{type: 'voiting', value: voitingData, date: new Date()}]})
        io.in(idRoom).emit('sendMessage:timer', {
            title: 'Сообщение от ведущего',
            message: 'Голосование закончилось',
            color: 'green'
          }
        )
        // io.in(`watchers:${idRoom}`).emit('setAllGameData', {voitingData: voitingData})
      }
      else {
        socket.emit("setError",
          {
            message: "Игра не началась, либо комнаты не существует",
            status: 603,
            functionName: 'voiting:finished'
          })
      }

    }
    else {
      socket.emit("setError",
        {
          message: "Игра не началась, либо комнаты не существует",
          status: 603,
          functionName: 'voiting:finished'
        })
    }

  }

  async testFunc(io) {
    let idRoom = 'S53FT'
    let gameRoom = await UserModel.GameRooms.findOne({where: {idRoom: idRoom}})
    let log = await UserModel.Logi.findOne(
      {where: {idRoom: idRoom, step: await playerDataService.howStepLog(idRoom) - 1}})
    if (log) {
      console.log(gameRoom.idRoom, log.id)
      await this.reversLog(log, gameRoom, idRoom, io)
    }
  }

  async reversLog(log, gameRoom, idRoom, io) {
    let funcName = log.funcName
    let emitData
    console.log(funcName)
    let players = await UserModel.RoomSession.findAll({where: {gameRoomId: gameRoom.id, isPlayer: 1}})
    let lastVar = JSON.parse(log.lastVar)
    if (!lastVar) {
      console.log('Пусто')
      return
    }
    if (funcName==='professionExp') {
      // console.log(lastVar)
      let playerIds = []
      for (let key in lastVar) {
        playerIds.push(key)
      }
      return emitData = await ioHostRevFunc.professionExpRev(playerIds, lastVar, gameRoom.id, idRoom, io)
    }
    if (funcName==='degreeOfSick') {
      console.log(lastVar)
      let playerIds = []
      for (let key in lastVar) {
        playerIds.push(key)
      }
      return await ioHostRevFunc.degreeOfSickRev(playerIds, lastVar, gameRoom.id, idRoom, io)
    }
    if (funcName==='sexOpposite') {
      console.log(lastVar)
      let playerIds = []
      for (let key in lastVar) {
        console.log(key, lastVar[key])
        playerIds.push(key)
      }
      return await ioHostRevFunc.sexOppositeRev(playerIds, lastVar, gameRoom.id, idRoom, io)
    }
    if (funcName==='cureMake' || funcName==='refresh:chartName') {
      //console.log(lastVar)
      let playerIds = []
      for (let key in lastVar) {
        console.log(key, lastVar[key])
        playerIds.push(key)
      }
      return await ioHostRevFunc.cureMakeRev(playerIds, lastVar, gameRoom.id, idRoom, io)
    }
    if (funcName==='exchangeChart' || funcName==='addChart' || funcName==='SetNull' || funcName==='ByHour' || funcName==='stealChart' || funcName==='deleteRelocate') {
      //console.log(lasstVar)sssssssss
      let playerIds = []
      let chartName
      for (let key in lastVar) {
        console.log(key, lastVar[key])
        if (key==='chartName') {
          chartName = lastVar[key]
        }
        else {
          playerIds.push(key)
        }
      }
      return await ioHostRevFunc.exchangeChartRev(playerIds, lastVar, gameRoom.id, idRoom, io, chartName)
    }
    if (funcName.includes('bunkerData')) {
      let lst = structuredClone(lastVar)
      let chartName
      let id
      let otherVar = null
      let emitData = {bunkerData: {}, logsData: {}}
      console.log(lastVar)
      for (let key in lst) {
        console.log(key)
        if (key==='chartName') {
          chartName = lst[key]
        }
        else if(key!=='otherVar') {
          id = lst[key]
        }else{
          otherVar = lst[key]
        }
      }
      if(otherVar){
        gameRoom.imageId = otherVar.imageId
        gameRoom.population = otherVar.population
        let image = await UserModel.CatastropheImage.findOne({where:{id:otherVar.imageId}})
        emitData.bunkerData = {population:otherVar.population,imageName:image.imageName}
      }
      console.log(id, chartName)
      gameRoom[chartName] = id
      let newChart = await UserModel.ChartBunker.findOne({where: {id: id}})
      emitData.bunkerData [chartName] = newChart.text
      await gameRoom.save()
      return emitData

  }

  //SetNulsl ByHsssasssssour exchangeChart deleteRelocate addChart stealChart refresh:chartName cureMake degreeOfSick sexOpposite professionExp

}

async getNickname(userId)
{
  let nickname = ''
  if (userId>0) {
    let user = await UserModel.User.findOne({where: {id: userId}})
    nickname = user.nickname
  }
  else {
    nickname = `Гость#${Math.abs(userId)}`
  }
  return nickname
}

howThisChartNameBunker(chartName)
{
  let name = ''
  switch(chartName) {
    case 'catastrophe':
      name = 'Катаклизм'
      break

    case 'bunkerTime':
      name = 'Время в бункере'
      break
    case 'bunkerLocation':
      name = 'Локация бункера'
      break
    case 'bunkerCreated':
      name = 'Когда был построен бункер'
      break
    case 'bunkerBedroom':
      name = 'Состояние о комнатах в бункере'
      break
    case 'bunkerFood':
      name = 'Состояние о еде в бункере'
      break
    case 'bunkerItems1' || 'bunkerItems2' || 'bunkerItems3':
      name = 'Состояние о предметах в бункере'
      break
    case 'bunkerSize':
      name = 'Размер бункера'
      break
    case 'catastrophe':
      name = 'Катоклизм'
      break
    case 'catastrophe':
      name = 'Катоклизм'
      break


  }
  return name
}

async validateToken(socket)
{
  try {
    let token = socket.handshake.auth.token
    let noRegToken = socket.handshake.auth.noregToken
    let idRoom = socket.handshake.auth.idRoom
    let isValidateId = null
    //   console.log('Started validateToken')
    if (!idRoom) {
      console.log('Havent IDROOM')
      socket.emit("setError",
        {message: `Произошла ошибка. Пожалуйста перезагрузите страницу`, status: 400, functionName: 'connection'})
      return null
    }
    if (!socket.handshake.auth.noregToken) {
      //   console.log('Havent noregToken')
      //Создавай новый токен и клади его в БД

      noRegToken = uuid.v4()
      socket.handshake.auth.noregToken = noRegToken.toString()
      socket.emit('setNoregToken', noRegToken)
      await UserModel.NoRegUsers.create({noRegToken: noRegToken})
    }

    //  console.log("TOKEN:::::", token)
    if (token) {
      //   console.log('Join to Token trigger')
      const userData = tokenService.validateAccessToken(token)
      if (!userData) {
        //  console.log('Haven"t a UserData')
        socket.emit("setError",
          {
            message: `Сервер не смог подтвердить вашу личность. Пожалуйста перезагрузите страницу или перезайдите в аккаунт`,
            status: 403,
            functionName: 'connection'
          })
        //     console.log('Невалидный токен')
        return null
      }
      isValidateId = userData.id
      const isBlock = await UserModel.BlackListUsers.findOne({where: {userId: isValidateId}})
      if (isBlock) {
        socket.emit("setError",
          {
            message: `Вы забанены`,
            status: 469,
            functionName: 'connection'
          })
      }
      //    console.log('Have a UserData')
      let gameRoomId = await UserModel.GameRooms.findOne({where: {idRoom: idRoom}})
      if (gameRoomId) {
        //   console.log('Have a gameRoomId')
        let inGameUser = await UserModel.RoomSession.findOne(
          {where: {userId: userData.id, gameRoomId: gameRoomId.id}})
        // console.log('VAR inGameUser', inGameUser)
        if (!inGameUser) {
          //    console.log('Havent inGameUser')
          console.log(noRegToken)
          let noregUserId = await getNoregUserId(noRegToken, socket)
          if (!noregUserId) {
            //    console.log('Havent noregUserId')
            socket.emit("setError",
              {
                message: `Произошла ошибка. Пожалуйста перезагрузите страницу`,
                status: 400,
                functionName: 'connection'
              })
            return null
          }
          //    console.log('Have noregUserId', noregUserId)
          let inGameNoregUser = await UserModel.RoomSession.findOne(
            {where: {userId: noregUserId, gameRoomId: gameRoomId.id}})
          if (inGameNoregUser) {
            //    console.log('Have inGameNoregUser', inGameNoregUser)
            if (!socket.recovered) {
              //      console.log('SOCKED NOT RECOVERED and SEND MESSAGE')
              socket.emit('sendMessage',
                {
                  message: `Так как вы начали игру в комнате незарегистрированным, то в этой игре вы продолжите как гость#${Math.abs(
                    noregUserId)}`
                })
            }
            else {
              //   console.log('SOCKED RECOVERED.DONT SEND MESSAGE')
            }

            isValidateId = noregUserId
          }
          else {
            //    console.log('Havent inGameNoregUser',)
          }


        }
      }

      //   console.log('Connected with AccessToken', isValidateId)
      return {idRoom, isValidateId}
    }

    // console.log('LET SEE noregToken userID')

    let noregUserId = await getNoregUserId(noRegToken, socket)
    if (!noregUserId) {
      //   console.log('Havent noregToken 2')
      //Создавай новый токен и клади его в БД

      noRegToken = uuid.v4()
      socket.handshake.auth.noregToken = noRegToken.toString()
      socket.emit('setNoregToken', noRegToken)
      await UserModel.NoRegUsers.create({noRegToken: noRegToken})
      noregUserId = await getNoregUserId(noRegToken, socket)

      // socket.emit("setError",
      //   {message: `Произошла ошибка. Пожалуйста перезагрузите страницу`, status: 400, functionName: 'connection'})
      // return null
    }
    //  console.log('Connected with noRegToken', noregUserId)
    isValidateId = noregUserId
    return {idRoom, isValidateId}
  } catch(e) {
    console.log(e)
    return null
  }
}

async getValidateGameData(idRoom, socket, io, isValidateId)
{
  let gameRoom = await UserModel.GameRooms.findOne({where: {idRoom: idRoom}})
  if (!gameRoom) {
    socket.emit("setError",
      {message: "Комнаты не существует", status: 404, functionName: 'joinRoom'})
    // console.log('inValid idRoom')
    return null
  }
  let userPlaying = await UserModel.RoomSession.findOne({where: {gameRoomId: gameRoom.id, userId: isValidateId}})
  let hostData = await UserModel.RoomSession.findOne(
    {where: {gameRoomId: gameRoom.id, userId: gameRoom.dataValues.hostId}})
  let isHostPlayer = !!hostData.isPlayer
  let isAgeRestriction = await this.isAgeRestriction(gameRoom.dataValues.hostId)
  let isStarted = !!gameRoom.isStarted
  let isPlayingBefore = !!userPlaying
  let dataUsersPlaying = await this.getPlayingUsers(idRoom)
  return {
    isStarted,
    isPlayingBefore,
    countPlayers: dataUsersPlaying.length,
    hostId: gameRoom.dataValues.hostId,
    watchersCount: this.getWatchersCount(io, idRoom),
    players: dataUsersPlaying,
    userId: isValidateId,
    isHidden: !!gameRoom.isHidden,
    isHostPlayer: isHostPlayer,
    isAgeRestriction: isAgeRestriction
  }
}

async getPlayingUsers(idRoom)
{
  let gameRoom = await UserModel.GameRooms.findOne({where: {idRoom: idRoom}})
  let playersInRoom = await UserModel.RoomSession.findAll({where: {gameRoomId: gameRoom.id, isPlayer: 1}})
  let data = []
  for (const user of playersInRoom) {
    let userData = await this.getIdAndNicknameFromUser(user.userId)
    if (userData) {
      data.push(userData)
    }
  }
  // console.log(data)
  return data
}

async getIdAndNicknameFromUser(userId)
{
  let data = null
  if (userId>0) {
    let userData = await UserModel.User.findOne({where: {id: userId}})
    data = {id: `${userId}`, nickname: `${userData.nickname}`}
    return data
  }
  data = {id: `${userId}`, nickname: `Гость#${Math.abs(userId)}`}
  return data
}

getWatchersCount(io, idRoom)
{
  let count = 0
  for (const room of io.sockets.adapter.rooms) {
    if (room[0]===`watchers:${idRoom}`) {
      //Пример собранных данных. Либо просто data = null
      count = room.length
      break
    }
  }
  return count
}

joinRoomAndWatchTimer(socket, idRoom)
{
  if (timerList[idRoom]) {
    clearTimeout(timerList[idRoom])
    delete timerList[idRoom]
  }
  //   console.log('TIMER LIST JOIN', timerList)
}

disconnectAndSetTimer(io, socket, idRoom)
{
  if (io.sockets.adapter.rooms.get(idRoom) && io.sockets.adapter.rooms.get(idRoom).size<2) {
    //   console.log('Комната пустая, удалим через 3 часа')
    timerList[idRoom] = setTimeout(async () => {
      await this.deleteRoomFromDB(idRoom)
      //   console.log('DELETE ROOMS TIMER')
    }, timeToCloseRoom)
    //   console.log('TIMER LISt DISCONNECT ', timerList)
  }
}

async deleteRoomFromDB(idRoom)
{
  let gameRoom = await UserModel.GameRooms.findOne({where: {idRoom: idRoom}})

  if (gameRoom.isStarted) {
    await playerDataService.setStatisticGame(idRoom)
  }
  await UserModel.GameRooms.destroy({where: {idRoom: idRoom}})
  await UserModel.RoomSession.destroy({where: {gameRoomId: null}})
  await UserModel.Logi.destroy(({where:{idRoom:idRoom}}))

}

}

/////////////////////////////////////////////

async function getNoregUserId(noRegToken, socket) {
  const isValidNoRegToken = await UserModel.NoRegUsers.findOne({where: {noRegToken: noRegToken}})
  if (!isValidNoRegToken) {

    return null
  }
  return -Math.abs(isValidNoRegToken.id)
}

//ss
module
  .exports = new ioUserService()