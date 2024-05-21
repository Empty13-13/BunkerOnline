const tokenService = require('../service/token-service')
const ApiError = require('../exceptions/api-error')
const {logger} = require("sequelize/lib/utils/logger");
const UserModel = require('../model/models')
const ioUserService = require('../service/io-user-service')
const playerDataService = require('../service/playerData-service')
const systemFunction = require('../systemFunction/systemFunction')
const sequelize = require('../db')
module.exports = function(io) {
  // const userIo = io
  const host = io.of("/host")
  
  host.use(async (socket, next) => {
    console.log('HOST IO')
    let tokenData = await ioUserService.validateToken(socket)
    let isValidateId = null
    let idRoom = null
    if (tokenData) {
      isValidateId = tokenData.isValidateId
      idRoom = tokenData.idRoom
    }
    
    /*
     let {isValidateId,idRoom} = await ioUserService.validateToken(socket)
     */
    
    // console.log('TOKEN DATA:',tokenData,socket)
    if (!isValidateId || !idRoom) {
      console.log("io.of('/host') invalid token")
      next(new Error("invalid token"))
      return
    }
    
    // console.log(idRoom)
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
        io.in(idRoom).emit('roomClosed', {message: 'Комната успешно удалена', status: 200})
        io.in(idRoom).disconnectSockets(true);
      })
      socket.on('kickOutUser', async (Id) => {
        // console.log(`id`, Id, `userId`, userId)
        if (Id.toString()===userId.toString()) {
          // console.log('SDJFHJKDHFKSDKLFHSDJLKFHSDKLJFHSDLKJFHSDJKLFHSDLKJFSDJKLHLKJDSHFKJLSHFLKJ')
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
        io.to(`user:${Id}:${idRoom}`).emit('kickOut', {message: 'Вас выгнали из комнаты'})
        io.to(`user:${Id}:${idRoom}`).disconnectSockets(true)
        io.in(idRoom).emit('setAwaitRoomData', {players: await ioUserService.getPlayingUsers(idRoom)})
      })
      socket.on('isHiddenGame', async (isHiddenTrack) => {
        console.log('TRY ISHIDDENGAME')
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
          
          console.log('PRIVATE GAME')
          // console.log(userData && userData.accsessLevel.toString().toLowerCase()==="mvp" && userData.accsessLevel.toString().toLowerCase()==="admin")
          if (userData && (userData.accsessLevel.toString().toLowerCase()==="mvp" || userData.accsessLevel.toString().toLowerCase()==="admin")) {
            // console.log('PRIVATE GAME MVP',userData)
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
          let isCustomGame = false
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
                isCustomGame = true
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
            if (await ioUserService.isAgeRestriction(userId) || isCustomGame) {
              let game = await UserModel.GameRooms.findOne({where: {idRoom: idRoom}})
              game.isHidden = 1
              await game.save()
            }
            
            const data = await playerDataService.createDataGame(idRoom, playersData)
            console.log(data)
            
            let room = await UserModel.GameRooms.findOne({where: {idRoom: idRoom}})
            room.isStarted = 1
            await room.save()
            let sendData = {}
            sendData.logsData = data.logsData
            sendData.userData = data.userData
            sendData.bunkerData = data.bunkerData
            sendData.players = {}
            for (let playerId in data.players) {
              sendData.players = {}
              sendData.players[playerId] = data.players[playerId]
              
              io.to(`user:${playerId}:${idRoom}`).emit('setAllGameData', sendData)
              // console.log(sendData)
            }
            io.in(`watchers:${idRoom}`).emit('setAllGameData', {userData: sendData.userData, bunkerData: data.bunkerData})
            // io.in(idRoom).emit('setAllGameData', data)
          } catch(e) {
            io.in(idRoom).emit("setError",
              {
                message: `При создании игры произошла ошибка. Пожалуйста, попробуйте ещё раз создать игру, или обратитесь к администратору сервера`,
                status: 512,
                functionName: 'startGame'
              })
            // console.log(e)
          }
        }
      )
      socket.on('voiting:start', async () => {
          let gameRoom = await UserModel.GameRooms.findOne({where: {idRoom: idRoom}})
          //console.log(gameRoom)
          console.log(io.sockets.adapter.rooms)
          if (gameRoom && gameRoom.isStarted) {
            gameRoom.voitingStatus = 0
            let players = await UserModel.RoomSession.findAll({where: {gameRoomId: gameRoom.id, isPlayer: 1}})
            for (let player of players) {
              player.votedFor = null
              await player.save()
              
            }
            await gameRoom.save()
            await UserModel.Logi.create({idRoom: idRoom, funcName: 'voitingStart', text: 'Голосование началось', step: 0})
            io.in(idRoom).emit('setAllGameData', {
              voitingData: {status: gameRoom.voitingStatus, userChoise: null},
              logsData: [{type: 'text', value: 'Голосование началось'}]
            })
            io.in(idRoom).emit('voiting:start')
          }
          else {
            socket.emit("setError",
              {
                message: "Игра не началась, либо комнаты не существует",
                status: 603,
                functionName: 'voitingStart'
              })
          }
        }
      )
      socket.on('voiting:finished', async () => {
        let gameRoom = await UserModel.GameRooms.findOne({where: {idRoom: idRoom}})
        if (gameRoom && gameRoom.isStarted) {
          if (gameRoom.voitingStatus!==null) {
            gameRoom.voitingStatus = 1
            let voitingData = await playerDataService.getAvailableVoitingData(gameRoom, userId)
            await gameRoom.save()
            let logs = JSON.stringify(voitingData)
            await UserModel.Logi.create(
            {
              idRoom: idRoom, funcName
            :
              'voitingFinished', text
            :
              'Голосование закончилось', step
            :
              0, lastVar
            :
              logs
            }
          )
            io.in([idRoom, `watchers:${idRoom}`]).emit('setAllGameData',
              {voitingData: voitingData, logsData: [{type: 'voiting', value: voitingData}]})
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
      })
      socket.on('timer:start', async (seconds) => {
        io.in(idRoom).emit('timer:start', seconds)
      })
      socket.on('timer:pause', async (value) => {
        io.in(idRoom).emit('timer:pause')
      })
      socket.on('timer:resume', async (value) => {
        io.in(idRoom).emit('timer:resume')
      })
      socket.on('timer:stop', async (value) => {
        io.in(idRoom).emit('timer:stop')
      })
      socket.on('refresh:bunkerData', async (chartName = null) => {
        let data = await playerDataService.refreshChartBunker(chartName, idRoom, userId)
        io.in([idRoom, `watchers:${idRoom}`]).emit('setAllGameData', {bunkerData: data})
      })
      socket.on('refresh:maxSurvivor', async (value) => {
        let gameRoom = await UserModel.GameRooms.findOne({where: {idRoom: idRoom}})
        let players = await UserModel.RoomSession.findAll({where: {gameRoomId: gameRoom.id, isPlayer: 1}})
        let textForLog = ''
        if (value) {
          if ((gameRoom.maxSurvivor + 1)<=players.length) {
            console.log(gameRoom.maxSurvivor)
            await UserModel.Logi.create({
              idRoom: idRoom,
              funcName: 'maxSurvivor',
              text: `Ведущий увеличил мест в бункере до ${gameRoom.maxSurvivor+1}`,
              step: await playerDataService.howStepLog(idRoom),
              lastVar: gameRoom.maxSurvivor
            })
            textForLog =`Ведущий увеличил мест в бункере до ${gameRoom.maxSurvivor+1}`
            gameRoom.maxSurvivor += 1
            await gameRoom.save()
            console.log(gameRoom.maxSurvivor)
          }
          else {
            socket.emit("setError",
              {
                message: "Нельзя сделать больше",
                status: 604,
                functionName: 'refresh:maxSurvivor'
              })
            // Ошибка, что нельзя сделать большеьше
          }
        }
        else {
          if ((gameRoom.maxSurvivor - 1)>=1) {
            await UserModel.Logi.create({
                          idRoom: idRoom,
                          funcName: 'maxSurvivor',
                          text: `Ведущий уменьшил мест в бункере до ${gameRoom.maxSurvivor-1}`,
                          step: await playerDataService.howStepLog(idRoom),
                          lastVar: gameRoom.maxSurvivor
                        })
             textForLog =`Ведущий уменьшил мест в бункере до ${gameRoom.maxSurvivor-1}`
            gameRoom.maxSurvivor -= 1
            await gameRoom.save()
          }
          else {
            socket.emit("setError",
              {
                message: "Нельзя сделать меньше",
                status: 604,
                functionName: 'refresh:maxSurvivor'
              })
            //ошибка, что нельзя сделать меньше
          }
          
        }
        io.in([idRoom, `watchers:${idRoom}`]).emit('setAllGameData', {bunkerData: {maxSurvivor: gameRoom.maxSurvivor},logsData:[{type:'text',value:textForLog}]})
      })
      socket.on('refresh:professionExp', async (playersId, exp) => {
        console.log('id', playersId)
        let gameRoom = await UserModel.GameRooms.findOne({where: {idRoom: idRoom}})
        let players = null
        if (playersId===0) {
          players = await UserModel.RoomSession.findAll({where: {gameRoomId: gameRoom.id, isPlayer: 1, isAlive: 1}})
        }
        else {
          players = await UserModel.RoomSession.findOne({where: {gameRoomId: gameRoom.id, userId: playersId}})
          players = [players]
        }
        console.log(players)
        let emitData = {players: {}}
        console.log(players.length)
        for (let player of players) {
          if (player.isAlive && player.isPlayer) {
            let data = JSON.parse(player.profession)
            console.log(data.text)
            let ecsExp = data.text.substring(data.text.indexOf('(') + 1, data.text.indexOf(')'))
            data.text = data.text.replace(ecsExp, exp)
            let isOpen = data.isOpen
            player.profession = JSON.stringify(data)
            await player.save()
            data = {profession: data}
            console.log(data)
            
            if (isOpen) {
              console.log("player.userId", player.userId)
              emitData.players[player.userId] = data
            }
            else {
              io.to(`user:${player.userId}:${idRoom}`).emit('setAllGameData', {players: {[player.userId]: data}})
            }
          }
          else {
            // добавляем в список недействительных пользователей
          }
        }
        console.log(emitData)
        io.in([idRoom, `watchers:${idRoom}`]).emit('setAllGameData', emitData)
        
      })
      socket.on('rollTheDice', async (value) => {
        let num = playerDataService.getRandomInt(1, value)
        console.log('VIPALO', num)
        await UserModel.Logi.create(
          {
            idRoom: idRoom,
            funcName: 'rollTheDice',
            text: `Был брошен кубик с ${value} гранями, выпало   [${num}]`,
            step: 0,
            lastVar: num
          })
        io.in([idRoom, `watchers:${idRoom}`]).emit(`rollTheDice:${value}`, num)
        io.in([idRoom, `watchers:${idRoom}`]).emit('setAllGameData',
          {logsData: [{type: 'rollDice', value: `Был брошен кубик с ${value} гранями, выпало [${num}]`}]})
      })
      socket.on('refresh:professionByHour', async () => {
        let gameRoom = await UserModel.GameRooms.findOne({where: {idRoom: idRoom}})
        let players = await UserModel.RoomSession.findAll({where: {gameRoomId: gameRoom.id, isPlayer: 1, isAlive: 1}})
        let count = players.length
        let index = 0
        let dataForNextPlayer = {}
        let emitData = {players: {}}
        
        let lastPlayer = players[players.length - 1]
        let playerProfessionData = JSON.parse(lastPlayer.profession)
        dataForNextPlayer = JSON.parse(players[0].profession)
        playerProfessionData.isOpen = dataForNextPlayer.isOpen
        
        
        if (playerProfessionData.isOpen) {
          console.log("isOpen", players[0].userId)
          emitData.players[players[0].userId] = {profession: playerProfessionData}
        }
        else {
          io.to(`user:${players[0].userId}:${idRoom}`).emit('setAllGameData',
            {players: {[players[0].userId]: {profession: playerProfessionData}}})
        }
        players[0].profession = JSON.stringify(playerProfessionData)
        await players[0].save()
        
        for (let i = 1; i<players.length; i++) {
          let player = players[i]
          let data = JSON.parse(player.profession)
          dataForNextPlayer.isOpen = data.isOpen
          
          if (data.isOpen) {
            console.log("isOpen", player.userId)
            emitData.players[player.userId] = {profession: dataForNextPlayer}
          }
          else {
            io.to(`user:${player.userId}:${idRoom}`).emit('setAllGameData',
              {players: {[player.userId]: {profession: dataForNextPlayer}}}
            )
          }
          players[i].profession = JSON.stringify(dataForNextPlayer)
          await players[i].save()
          
          dataForNextPlayer = data
        }
        
        io.in([idRoom, `watchers:${idRoom}`]).emit('setAllGameData', emitData)
        
        
        // for (let player of players) {
        //   console.log(index)
        //   if (index===0) {
        //     index += 1
        //     let data = JSON.parse(player.profession)
        //     let dataLast = JSON.parse(players[count - 1].profession)
        //     dataForNextPlayer = data
        //     data.text = dataLast.text
        //     data.id = dataLast.id
        //     data.description = dataLast.description
        //     player.profession = JSON.stringify(data)
        //     let isOpen = data.isOpen
        //     //console.log(data)
        //     data = {profession: data}
        //     if (isOpen) {
        //       console.log("player.userId", player.userId)
        //       emitData.players[player.userId] = data
        //     }
        //     else {
        //       io.to(`user:${player.userId}:${idRoom}`).emit('setAllGameData', data)
        //     }
        //
        //   }
        //   else if (index!==count - 1 && index!==0) {
        //
        //     let data = JSON.parse(player.profession)
        //     console.log(data)
        //     console.log(dataForNextPlayer)
        //     let newData = dataForNextPlayer
        //     dataForNextPlayer = data
        //     data.text = newData.text
        //     data.id = newData.id
        //     data.description = newData.description
        //     player.profession = JSON.stringify(data)
        //     let isOpen = data.isOpen
        //     //console.log(data)
        //     data = {profession: data}
        //     if (isOpen) {
        //       console.log("player.userId", player.userId)
        //       emitData.players[player.userId] = data
        //     }
        //     else {
        //       io.to(`user:${player.userId}:${idRoom}`).emit('setAllGameData', data)
        //     }
        //
        //   }
        //   io.in([idRoom, `watchers:${idRoom}`]).emit('setAllGameData', emitData)
        //   //console.log(emitData)
        //   //console.log(player.userId)
        //   //  console.log(players[index].userId)
        // }
      })
      socket.on('refresh:professionSetNull', async () => {
        let gameRoom = await UserModel.GameRooms.findOne({where: {idRoom: idRoom}})
        let players = await UserModel.RoomSession.findAll({where: {gameRoomId: gameRoom.id, isPlayer: 1}})
        let emitData = {players: {}}
        for (let player of players) {
          let data = JSON.parse(player.profession)
          data.text = 'Без профессии'
          data.id = 0
          data.description = ''
          player.profession = JSON.stringify(data)
          //console.log(player.userId)
          await player.save()
          if (data.isOpen) {
            console.log("player.userId", player.userId)
            emitData.players[player.userId] = {profession: data}
          }
          else {
            io.to(`user:${player.userId}:${idRoom}`).emit('setAllGameData',
              {players: {[player.userId]: {profession: data}}})
          }
        }
        io.in([idRoom, `watchers:${idRoom}`]).emit('setAllGameData', emitData)
      })
    }
  )
}