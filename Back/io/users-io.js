//const {io} = require('../index')
//const users = io.of("/users")
const uuid = require('uuid')
const tokenService = require('../service/token-service')
const ApiError = require('../exceptions/api-error')
const {logger} = require("sequelize/lib/utils/logger");
const UserModel = require('../model/models')
const ioUserService = require('../service/io-user-service')

module.exports = function(io) {
  io.on('connection', async socket => {
    
    let {idRoom, isValidateId} = await ioUserService.validateToken(socket)
    if (!isValidateId || !idRoom) {
      socket.emit("setError",
        {message: `Произошла ошибка. Пожалуйста перезагрузите страницу`, status: 403, functionName: 'createRoom'})
      return
    }
    socket.join(`user:${isValidateId}`)
    
    console.log(`${socket.id} user connected with userId ${isValidateId}`)
    socket.on('createRoom', async () => {
      // let isReg = false
      
      let isRooms = await UserModel.GameRooms.findOne({where: {idRoom: idRoom}})
      if (isRooms) {
        socket.emit("setError",
          {
            message: `Сервер не смог подтвердить вашу личность. Пожалуйста перезагрузите страницу или перезайдите в аккаунт`,
            status: 403,
            functionName: 'createRoom'
          })
        console.log('inValid idRoom')
        return
      }
      let gameRoom = await UserModel.GameRooms.create({idRoom: idRoom, hostId: isValidateId})
      
      await UserModel.RoomSession.create({gameRoomId: gameRoom.id, userId: isValidateId})
      
      
      //Если ни одной ошибки не словило, значит в любом случае добавляем его в комнату
      socket.join(idRoom)
      
      //Сообщаем client что комната создалась успешно
      socket.emit('joinedRoom', {message: 'Комната успешно создана', status: 201})
      
      console.log(io.sockets.adapter.rooms)
    })
//========================================================================================================================================================
    socket.on('joinRoom', async () => {
      
      let GameData = await getValidateGameData(idRoom, socket, io, isValidateId)
      if (!GameData) {
        return
      }
      
      if (GameData.isStarted) {
        /*
         Если игра началась, то в любом случае подключаем пользователя. Либо как игрока, если он
         был до этого в игре (и тогда обновляем всем находящимся в игре данные, чтобы подгрузить нужную
         инфу о снова присоединившемся пользователе)
         Либо как смотрящего, тогда просто даем этому смотрящему общую инфу.
         
         В любом случае функция getAllGameData будет принимать токены и с помощью них смотреть какую конкретно
         инфу нужно выдать пользователю
         */
        
        socket.join(idRoom)
        
        if (GameData.isPlayingBefore) {
          socket.in(idRoom).emit('setAllGameData')
        }
        else {
          if (GameData.isHidden) {
            socket.emit("setError",
              {message: "Комнаты не существует", status: 404, functionName: 'joinRoom'})
            return
          }
          socket.join(`watchers:${idRoom}`)
          socket.to(idRoom).emit('setAwaitRoomData', GameData.watchersCount + 1)
          socket.emit('getAllGameData')
          
        }
      }
      else {
        if (GameData) {
          socket.join(idRoom)
          
          if (GameData.countPlayers<15) {
            socket.emit('joinedRoom', {message: 'Вы успешно подключились к комнате', status: 201})
            
            if (!GameData.isPlayingBefore) {
              let gameRoom = await UserModel.GameRooms.findOne({where: {idRoom: idRoom}})
              await UserModel.RoomSession.create({gameRoomId: gameRoom.id, userId: isValidateId})
              GameData.players.push(await getIdAndNicknameFromUser(isValidateId))
            }
          }
          else {
            if (GameData.isHidden) {
              socket.emit("setError",
                {message: "Комнаты не существует", status: 404, functionName: 'joinRoom'})
              return
            }
            socket.join(`watchers:${idRoom}`)
            socket.emit('setError',
              {message: "Комната заполнена. Вы являетесь наблюдателем.", status: 409, color: 'gold'})
          }
          
          //Передаем остальным в комнате новые данные, потому что количество участников прибавилось
          delete GameData.userId
          socket.to(idRoom).emit('setAwaitRoomData', GameData)
        }
        else {
          socket.emit("setError",
            {
              message: "Комната создана, но данные пока что не загружены. Попробуйте попозже",
              status: 406,
              functionName: 'joinRoom'
            })
        }
      }
      
    })
    ///////////////////////////////////////////////////////////////////////////////////////////
    socket.on('getAwaitRoomData', async () => {
      let data = null
      
      //TODO:Собираем основные данные об игре (Ники игроков, userId ведущего, началась ли игра), если они вообще есть
      //  Все таки нужно эту инфу в БД хранить и оттуда же доставать
      
      data = await getValidateGameData(idRoom, socket, io, isValidateId)
      
      socket.emit('setAwaitRoomData', data)
      console.log(io.sockets.adapter.rooms)
    })
    
    socket.on('closeRoom', () => {
    
    })
    socket.on('disconnect', (reason) => {
      console.log("DISCONNECT")
      //socket.disconnect()
    })
    
    
    console.log(io.sockets.adapter.rooms)
  })
}

async function getValidateGameData(idRoom, socket, io, isValidateId) {
  let gameRoom = await UserModel.GameRooms.findOne({where: {idRoom: idRoom}})
  if (!gameRoom) {
    socket.emit("setError",
      {message: "Комнаты не существует", status: 404, functionName: 'joinRoom'})
    console.log('inValid idRoom')
    return null
  }
  let userPlaying = await UserModel.RoomSession.findOne({where: {gameRoomId: gameRoom.id, userId: isValidateId}})
  
  let isStarted = !!gameRoom.isActivated
  let isPlayingBefore = !!userPlaying
  let dataUsersPlaying = await getPlayingUsers(idRoom)
  return {
    isStarted,
    isPlayingBefore,
    countPlayers: dataUsersPlaying.length,
    hostId: gameRoom.dataValues.hostId,
    watchersCount: getWatchersCount(io, idRoom),
    players: dataUsersPlaying,
    userId: isValidateId,
    isHidden: !!gameRoom.isHidden
  }
  
}

async function getPlayingUsers(idRoom) {
  let gameRoom = await UserModel.GameRooms.findOne({where: {idRoom: idRoom}})
  let playersInRoom = await UserModel.RoomSession.findAll({where: {gameRoomId: gameRoom.id}})
  let data = []
  for (const user of playersInRoom) {
    let userData = await getIdAndNicknameFromUser(user.userId)
    if (userData) {
      data.push(userData)
    }
  }
  console.log(data)
  return data
}

async function getIdAndNicknameFromUser(userId) {
  let data = null
  if (userId>0) {
    let userData = await UserModel.User.findOne({where: {id: userId}})
    data = {id: `${userId}`, nickname: `${userData.nickname}`}
    return data
  }
  data = {id: `${userId}`, nickname: `Гость#${Math.abs(userId)}`}
  return data
}

/**
 * @description Узнать количество смотрящий за игрой людей в комнате idRoom
 * @returns {number}
 * @param io
 * @param idRoom
 */
function getWatchersCount(io, idRoom) {
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
