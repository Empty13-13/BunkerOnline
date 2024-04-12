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
    let data = await ioUserService.validateToken(socket)
    let isValidateId = null
    let idRoom = null
    if (data) {
      isValidateId = data.isValidateId
      idRoom = data.idRoom
    }
    if (!isValidateId || !idRoom) {
      socket.emit("setError",
        {message: `Произошла ошибка. Пожалуйста перезагрузите страницу`, status: 400, functionName: 'connection'})
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
            message: `Произошла ошибка - комната с таким ID уже существует. Попробуйте ещё раз`,
            status: 400,
            functionName: 'createRoom'
          })
        io.in(socket.id).disconnectSockets(true);
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
      //await changeNoregIdToRegId(socket)
      let GameData = await ioUserService.getValidateGameData(idRoom, socket, io, isValidateId)
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
          socket.emit('updateInitialInfo')
          socket.emit('startedGame')
          io.in(idRoom).emit('setAllGameData')
        }
        else {
          if (GameData.isHidden) {
            socket.emit("setError",
              {message: "Комнаты не существует", status: 404, functionName: 'joinRoom'})
            io.in(socket.id).disconnectSockets(true);
            return
          }
          socket.join(`watchers:${idRoom}`)
          socket.emit('sendMessage',
            {message: `Игра уже началась. На данный момент вы являетесь наблюдателем`})
          socket.emit('startedGame')
          GameData.watchersCount += 1
          socket.to(idRoom).emit('setAwaitRoomData', {watchersCount: GameData.watchersCount})
          // delete GameData.hostId
          socket.emit('setAwaitRoomData', GameData)
          socket.emit('setAllGameData')
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
              GameData.players.push(await ioUserService.getIdAndNicknameFromUser(isValidateId))
            }
          }
          else {
            if (GameData.isHidden) {
              socket.emit("setError",
                {message: "Комнаты не существует", status: 404, functionName: 'joinRoom'})
              io.in(socket.id).disconnectSockets(true);
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
          
          io.in(socket.id).disconnectSockets(true);
        }
      }
    })
    
    socket.on('getAwaitRoomData', async () => {
      let data = null
      
      data = await ioUserService.getValidateGameData(idRoom, socket, io, isValidateId)
      
      socket.emit('setAwaitRoomData', data)
    })
    
    socket.on('disconnect', (reason) => {
      console.log("DISCONNECT")
    })
    
    console.log(io.sockets.adapter.rooms)
  })
}