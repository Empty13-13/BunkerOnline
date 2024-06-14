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
  async reversLog(log,gameRoom,idRoom){
    let funcName = log.functionName
    let players = await UserModel.RoomSession.findAll({where:{gameRoomId:gameRoom.id,isPlayer:1,isAlive:1}})
    //SetNull ByHour exchangeChart deleteRelocate addChart stealChart refresh:chartName cureMake degreeOfSick sexOpposite professionExp

  }
  async getNickname(userId) {
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

  howThisChartNameBunker(chartName) {
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
        name = 'Создание бункера'
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
      case 'catastrophe':
        name = 'Катоклизм'
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

  async validateToken(socket) {
    try {
      let token = socket.handshake.auth.token
      let noRegToken = socket.handshake.auth.noregToken
      let idRoom = socket.handshake.auth.idRoom
      let isValidateId = null
      console.log('Started validateToken')
      if (!idRoom) {
        console.log('Havent IDROOM')
        socket.emit("setError",
          {message: `Произошла ошибка. Пожалуйста перезагрузите страницу`, status: 400, functionName: 'connection'})
        return null
      }
      if (!socket.handshake.auth.noregToken) {
        console.log('Havent noregToken')
        //Создавай новый токен и клади его в БД

        noRegToken = uuid.v4()
        socket.handshake.auth.noregToken = noRegToken.toString()
        socket.emit('setNoregToken', noRegToken)
        await UserModel.NoRegUsers.create({noRegToken: noRegToken})
      }

      //  console.log("TOKEN:::::", token)
      if (token) {
        console.log('Join to Token trigger')
        const userData = tokenService.validateAccessToken(token)
        if (!userData) {
          console.log('Haven"t a UserData')
          socket.emit("setError",
            {
              message: `Сервер не смог подтвердить вашу личность. Пожалуйста перезагрузите страницу или перезайдите в аккаунт`,
              status: 403,
              functionName: 'connection'
            })
          console.log('Невалидный токен')
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
        console.log('Have a UserData')
        let gameRoomId = await UserModel.GameRooms.findOne({where: {idRoom: idRoom}})
        if (gameRoomId) {
          console.log('Have a gameRoomId')
          let inGameUser = await UserModel.RoomSession.findOne(
            {where: {userId: userData.id, gameRoomId: gameRoomId.id}})
          // console.log('VAR inGameUser', inGameUser)
          if (!inGameUser) {
            console.log('Havent inGameUser')
            console.log(noRegToken)
            let noregUserId = await getNoregUserId(noRegToken, socket)
            if (!noregUserId) {
              console.log('Havent noregUserId')
              socket.emit("setError",
                {
                  message: `Произошла ошибка. Пожалуйста перезагрузите страницу`,
                  status: 400,
                  functionName: 'connection'
                })
              return null
            }
            console.log('Have noregUserId', noregUserId)
            let inGameNoregUser = await UserModel.RoomSession.findOne(
              {where: {userId: noregUserId, gameRoomId: gameRoomId.id}})
            if (inGameNoregUser) {
              console.log('Have inGameNoregUser', inGameNoregUser)
              if (!socket.recovered) {
                console.log('SOCKED NOT RECOVERED and SEND MESSAGE')
                socket.emit('sendMessage',
                  {
                    message: `Так как вы начали игру в комнате незарегистрированным, то в этой игре вы продолжите как гость#${Math.abs(
                      noregUserId)}`
                  })
              }
              else {
                console.log('SOCKED RECOVERED.DONT SEND MESSAGE')
              }

              isValidateId = noregUserId
            }
            else {
              console.log('Havent inGameNoregUser',)
            }


          }
        }

        console.log('Connected with AccessToken', isValidateId)
        return {idRoom, isValidateId}
      }

      // console.log('LET SEE noregToken userID')

      let noregUserId = await getNoregUserId(noRegToken, socket)
      if (!noregUserId) {
        console.log('Havent noregToken 2')
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
      console.log('Connected with noRegToken', noregUserId)
      isValidateId = noregUserId
      return {idRoom, isValidateId}
    } catch(e) {
      console.log(e)
      return null
    }
  }

  async getValidateGameData(idRoom, socket, io, isValidateId) {
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

  async getPlayingUsers(idRoom) {
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

  async getIdAndNicknameFromUser(userId) {
    let data = null
    if (userId>0) {
      let userData = await UserModel.User.findOne({where: {id: userId}})
      data = {id: `${userId}`, nickname: `${userData.nickname}`}
      return data
    }
    data = {id: `${userId}`, nickname: `Гость#${Math.abs(userId)}`}
    return data
  }

  getWatchersCount(io, idRoom) {
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

  joinRoomAndWatchTimer(socket, idRoom) {
    if (timerList[idRoom]) {
      clearTimeout(timerList[idRoom])
      delete timerList[idRoom]
    }
    console.log('TIMER LIST JOIN', timerList)
  }

  disconnectAndSetTimer(io, socket, idRoom) {
    if (io.sockets.adapter.rooms.get(idRoom) && io.sockets.adapter.rooms.get(idRoom).size<2) {
      console.log('Комната пустая, удалим через 3 часа')
      timerList[idRoom] = setTimeout(async () => {
        await this.deleteRoomFromDB(idRoom)
        console.log('DELETE ROOMS TIMER')
      }, timeToCloseRoom)
      console.log('TIMER LISt DISCONNECT ', timerList)
    }
  }

  async deleteRoomFromDB(idRoom) {
    let gameRoom = await UserModel.GameRooms.findOne({where: {idRoom: idRoom}})

    if (gameRoom.isStarted) {
      await playerDataService.setStatisticGame(idRoom)
    }
    await UserModel.GameRooms.destroy({where: {idRoom: idRoom}})
    await UserModel.RoomSession.destroy({where: {gameRoomId: null}})

  }

}

/////////////////////////////////////////////

async function

getNoregUserId(noRegToken, socket) {
  const isValidNoRegToken = await UserModel.NoRegUsers.findOne({where: {noRegToken: noRegToken}})
  if (!isValidNoRegToken) {

    return null
  }
  return -Math.abs(isValidNoRegToken.id)
}


module
  .exports = new ioUserService()