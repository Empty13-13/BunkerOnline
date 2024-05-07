const tokenService = require('../service/token-service')
const ApiError = require('../exceptions/api-error')
const {logger} = require("sequelize/lib/utils/logger");
const UserModel = require('../model/models')
const ioUserService = require('../service/io-user-service')
const playerDataService = require('../service/playerData-service')
const systemFunction = require('../systemFunction/systemFunction')

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
      return
    }
    const gameRoomId = gameRoom.id
    let GameData = await ioUserService.getValidateGameData(idRoom, socket, io, userId)
    console.log(`${socket.id} HOST connected in room ${idRoom} with userId ${userId}`)
    socket.on('closeRoom', async () => {
      
      await ioUserService.deleteRoomFromDB(idRoom)
      
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
      io.in(idRoom).emit('setAwaitRoomData', {players: await ioUserService.getPlayingUsers(idRoom)})
    })
    socket.on('isHiddenGame', async (isHiddenTrack) => {
      if (token) {
        let isValid = tokenService.validateAccessToken(token)
        if (!isValid) {
          socket.emit("setError",
            {
              message: `Invalid access`,
              status: 403,
              functionName: 'isHiddenGame',
              vars: [isHiddenTrack]
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
          await room.save()
        }
        else {
          socket.emit("setError",
            {
              message: `Invalid access`,
              status: 403,
              functionName: 'isHiddenGame',
              vars: [isHiddenTrack]
            })
        }
      }
      else {
        socket.emit("setError",
          {
            message: `Invalid access`,
            status: 400,
            functionName: 'isHiddenGame'
          })
      }
    })
    
    socket.on('isHostPlayerTooGame', async (Track) => {
      
      let gameRoom = await UserModel.GameRooms.findOne({where: {idRoom: idRoom, isStarted: 0}})
      if (!gameRoom) {
        socket.emit("setError",
          {
            message: `Room is Started || Invalid Room`,
            status: 404,
            functionName: 'isHostPlayerTooGame'
          })
        return
      }
      let countPlayer = await UserModel.RoomSession.findAndCountAll({where: {gameRoomId: gameRoom.id, isPlayer: 1}})
      
      if (countPlayer.count<15 || !Track) {
        let isHostPlayerTooGame = 0
        if (Track) {
          isHostPlayerTooGame = 1
        }
        let user = await UserModel.RoomSession.findOne({where: {userId: userId, gameRoomId: gameRoom.id}})
        if (!user) {
          socket.emit("setError",
            {
              message: `Invalid user`,
              status: 403,
              functionName: 'isHostPlayerTooGame',
              vars: [Track]
            })
          return
        }
        user.isPlayer = isHostPlayerTooGame
        await user.save()
        let dataPlayer = await ioUserService.getPlayingUsers(idRoom)
        
        io.in(idRoom).emit('setAwaitRoomData', {players: dataPlayer, isHostPlayer: !!isHostPlayerTooGame})
      }
      else {
        socket.emit("setError",
          {
            message: `Limit size room`,
            status: 400,
            functionName: 'isHostPlayerTooGame'
          })
      }
      
    })
    
    socket.on('startGame', async (playersData) => {
        try {
          if (GameData.countPlayers<0) {
            socket.emit("setError",
              {
                message: `Для начала игры нужно минимум 6 игроков`,
                status: 400,
                functionName: 'startGame'
              })
            return
          }
          if (playersData) {
            let userData = await UserModel.User.findOne({where: {id: userId}})
            if (userData.accsessLevel.toString().toLowerCase()==="mvp" || userData.accsessLevel.toString().toLowerCase()==="admin") {
              const forbiddenWords = await UserModel.BlackListWords.findAll()
              let wrongData = {}
              
              
              for (let playerId in playersData) {
                let wrongInput = []
                for (let key in playersData[playerId]) {
                  if (playersData[playerId][key]!==null) {
                    //  console.log('PROVERKA',key,playersData[playerId])
                    forbiddenWords.forEach(word => {
                      if (playersData[playerId][key] && playersData[playerId][key].toLowerCase().includes(
                        word.word.toLowerCase())) {
                        wrongInput.push(key)
                        //  console.log('ERRRRRRRRRRRRRRORRRRRRR', wrongInput)
                      }
                    })
                  }
                }
                
                if (wrongInput.length>0) {
                  wrongData[playerId] = wrongInput
                }

                
              }
              //console.log(wrongData)
              if (!systemFunction.objIsEmpty(wrongData)) {
                socket.emit("setError",
                  {
                    message: `В полях используются запрещенные слова`,
                    status: 514,
                    functionName: 'startGame',
                    wrongData: wrongData
                  })
                return
              }
            }
            else {
              socket.emit("setError",
                {
                  message: `Access Denied`,
                  status: 513,
                  functionName: 'startGame'
                })
              return
            }
          }
          //Проверка на MVP если playersData не пустой

          //  console.log('Проверка на ХУЙ пройдена успешно')
          io.in(idRoom).emit('startedGame', {message: 'Начинаем игру', status: 200})

          const data = await playerDataService.createDataGame(idRoom, playersData)
          console.log(data)
          
          let room = await UserModel.GameRooms.findOne({where: {idRoom: idRoom}})
          room.isStarted = 1
          await room.save()
          let sendData = {}
          sendData.userData = data.userData
          sendData.bunkerData = data.bunkerData
          sendData.players = {}
          for (let playerId in data.players) {
            sendData.players = {}
            sendData.players[playerId] = data.players[playerId]
            
            io.to(`user:${playerId}`).emit('setAllGameData', sendData)
            // console.log(sendData)
          }
          // io.in(idRoom).emit('setAllGameData', data)
        } catch
          (e) {
          io.in(idRoom).emit("setError",
            {
              message: `При создании игры произошла ошибка. Пожалуйста, попробуйте ещё раз создать игру, или обратитесь к администратору сервера`,
              status: 512,
              functionName: 'startGame'
            })
          console.log(e)
        }
      }
    )
    
  })
  
  
}