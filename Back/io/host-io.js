const uuid = require('uuid')
const tokenService = require('../service/token-service')
const ApiError = require('../exceptions/api-error')
const {logger} = require("sequelize/lib/utils/logger");
const UserModel = require('../model/models')
const ioUserService = require('../service/io-user-service')


module.exports = function(io) {
  // const userIo = io
  const host = io.of("/host")
  
  host.use(async (socket, next) => {
    console.log('TRYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY')
    let {idRoom, isValidateId} = await ioUserService.validateToken(socket)
    if (!isValidateId || !idRoom) {
      console.log("io.of('/host') invalid token")
      next(new Error("invalid token"))
      return
    }
    
    console.log(idRoom)
    const isHost = await UserModel.GameRooms.findOne({where: {idRoom: idRoom}})
    //console.log(isHost)
    
    if (!isHost || isValidateId!==isHost.hostId) {
      console.log("io.of('/host') invalid host")
      next(new Error("invalid host"))
      return
    }
    socket.data.idRoom = idRoom
    socket.data.userId = isValidateId
    next()
  })
  
  host.on('connection', async socket => {
    let idRoom = socket.data.idRoom
    let userId = socket.data.userId
    let token = socket.handshake.auth.token
    const gameRoom = await UserModel.GameRooms.findOne({where: {idRoom: idRoom}})
    if (!gameRoom) {
      socket.emit("setError",
        {message: "Комнаты не существует", status: 404, functionName: 'joinRoom'})
    }
    const gameRoomId = gameRoom.id
    let GameData = await ioUserService.getValidateGameData(idRoom, socket, io, userId)
    console.log(`${socket.id} HOST connected in room ${idRoom} with userId ${userId}`)
    socket.on('closeRoom', async () => {
      
      
      await UserModel.GameRooms.destroy({where: {idRoom: idRoom}})
      await UserModel.RoomSession.destroy({where: {gameRoomId: null}})
      console.log('RoomClose делаем')
      console.log(io.of('/').in(idRoom.toString()))
      console.log(io.sockets.adapter.rooms)
      io.in(idRoom).emit('roomClosed', {message: 'Комната успешно удалена', status: 200})
      io.in(idRoom).disconnectSockets(true);
      console.log(io.sockets.adapter.rooms)
    })
    socket.on('kickOutUser', async (Id) => {
      console.log(`id`, Id, `userId`, userId)
      if (Id.toString()===userId.toString()) {
        console.log('SDJFHJKDHFKSDKLFHSDJLKFHSDKLJFHSDLKJFHSDJKLFHSDLKJFSDJKLHLKJDSHFKJLSHFLKJ')
        socket.emit("setError",
          {
            message: `Вы не можете выгнать себя`,
            status: 400,
            functionName: 'kickOutUser'
          })
        return
      }
      if (gameRoom.isStarted) {
        socket.emit("setError",
          {
            message: `Игра уже началась, вы не можете выгнать игрока`,
            status: 400,
            functionName: 'kickOutUser'
          })
        console.log('Игра уже началась, невозможно выгнать')
        return
      }
      console.log(`Delete Users ${Id}`)
      console.log(gameRoomId)
      await UserModel.RoomSession.destroy({where: {userId: Id, gameRoomId: gameRoomId}})
      io.to(`user:${Id}`).emit('kickOut', {message: 'Вас выгнали из комнаты'})
      io.to(`user:${Id}`).disconnectSockets(true)
      io.in(idRoom).emit('updateInitialInfo')
    })
    socket.on('isHiddenGame', async (isHiddenTrack) => {
      if (token) {
        let isValid = tokenService.validateAccessToken(token)
        if (!isValid) {
          socket.emit("setError",
            {
              message: `Invalid access`,
              status: 403,
              functionName: 'isHiddenGame'
            })
          console.log("INVALID TOKEN EPTA")
          return
        }
        
        let userData = await UserModel.User.findOne({where: {id: isValid.id}})
        
        
        if (userData && userData.accsessLevel.toString().toLowerCase()==="mvp") {
          let isHidden = 0
          if (isHiddenTrack) {
            isHidden = 1
          }
          let room = await UserModel.GameRooms.findOne({where: {idRoom: idRoom}})
          if (!room) {
            socket.emit("setError",
              {
                message: `Invalid room`,
                status: 400,
                functionName: 'isHiddenGame'
              })
          }
          room.isHidden = isHidden
          room.save()
        }
        else {
          socket.emit("setError",
            {
              message: `Invalid access`,
              status: 403,
              functionName: 'isHiddenGame'
            })
        }
      }
      socket.emit("setError",
        {
          message: `Invalid access`,
          status: 400,
          functionName: 'isHiddenGame'
        })
    })
    
    socket.on('startGame', async () => {
      if (GameData.countPlayers<0) {
        socket.emit("setError",
          {
            message: `Для начала игры нужно минимум 6 игроков`,
            status: 400,
            functionName: 'startGame'
          })
        return
        
      }
      let room = await UserModel.GameRooms.findOne({where: {idRoom: idRoom}})
      room.isStarted = 1
      room.save()
      
      io.in(idRoom).emit('startedGame', {message: 'Начинаем игру', status: 200})
      io.in(idRoom).emit('setAllGameData')
    })
    
  })
  
  
}