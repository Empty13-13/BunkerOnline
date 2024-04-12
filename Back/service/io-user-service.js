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


class ioUserService {
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
      
      console.log("TOKEN:::::", token)
      if (token) {
        console.log('Join to Token trigger')
        const userData = tokenService.validateAccessToken(token)
        if (!userData) {
          console.log('Haven"t a UserData')
          socket.emit("setError",
            {
              message: `Сервер не смог подтвердить вашу личность. Пожалуйста перезагрузите страницу или перезайдите в аккаунт`,
              status: 401,
              functionName: 'connection'
            })
          console.log('Невалидный токен')
          return null
        }
        isValidateId = userData.id
        console.log('Have a UserData')
        let gameRoomId = await UserModel.GameRooms.findOne({where: {idRoom: idRoom}})
        if (gameRoomId) {
          console.log('Have a gameRoomId')
          let inGameUser = await UserModel.RoomSession.findOne(
            {where: {userId: userData.id, gameRoomId: gameRoomId.id}})
          console.log('VAR inGameUser', inGameUser)
          if (!inGameUser) {
            console.log('Havent inGameUser')
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
      
      console.log('LET SEE noregToken userID')
      
      let noregUserId = await getNoregUserId(noRegToken, socket)
      if (!noregUserId) {
        socket.emit("setError",
          {message: `Произошла ошибка. Пожалуйста перезагрузите страницу`, status: 400, functionName: 'connection'})
        return null
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
      console.log('inValid idRoom')
      return null
    }
    let userPlaying = await UserModel.RoomSession.findOne({where: {gameRoomId: gameRoom.id, userId: isValidateId}})
    
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
      isHidden: !!gameRoom.isHidden
    }
  }
  
  async getPlayingUsers(idRoom) {
    let gameRoom = await UserModel.GameRooms.findOne({where: {idRoom: idRoom}})
    let playersInRoom = await UserModel.RoomSession.findAll({where: {gameRoomId: gameRoom.id}})
    let data = []
    for (const user of playersInRoom) {
      let userData = await this.getIdAndNicknameFromUser(user.userId)
      if (userData) {
        data.push(userData) 
      }
    }
    console.log(data)
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
}


async function getNoregUserId(noRegToken, socket) {
  const isValidNoRegToken = await UserModel.NoRegUsers.findOne({where: {noRegToken: noRegToken}})
  if (!isValidNoRegToken) {
    
    return null
  }
  return -Math.abs(isValidNoRegToken.id)
}


module.exports = new ioUserService()