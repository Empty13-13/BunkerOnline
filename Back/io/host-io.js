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
    // console.log('HOST IO')
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
      //  console.log("io.of('/host') invalid token")
      next(new Error("invalid token"))
      return
    }
    
    // console.log(idRoom)
    const isHost = await UserModel.GameRooms.findOne({where: {idRoom: idRoom}})
    //console.log(isHost)
    
    if (!isHost || isValidateId!==isHost.hostId) {
      //    console.log("io.of('/host') invalid host")
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


      
      //  console.log(`${socket.id} HOST connected in room ${idRoom} with userId ${userId}`)
      socket.on('closeRoom', async () => {
        await ioUserService.deleteRoomFromDB(idRoom)
        
        //   console.log('RoomClose делаем')
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
          //     console.log('Игра уже началась, невозможно выгнать')
          return
        }
      //  console.log(`Delete Users ${Id}`)
      //  console.log(gameRoomId)
        await UserModel.RoomSession.destroy({where: {userId: Id, gameRoomId: gameRoomId}})
        io.to(`user:${Id}:${idRoom}`).emit('kickOut', {message: 'Вас выгнали из комнаты'})
        io.to(`user:${Id}:${idRoom}`).disconnectSockets(true)
        io.in(idRoom).emit('setAwaitRoomData', {players: await ioUserService.getPlayingUsers(idRoom)})
      })
      socket.on('isHiddenGame', async (isHiddenTrack) => {
    //    console.log('TRY ISHIDDENGAME')
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
          //  console.log("INVALID TOKEN EPTA")
            return
          }
          
          let userData = await UserModel.User.findOne({where: {id: isValid.id}})
          
      //    console.log('PRIVATE GAME')
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
        let countPlayer = await UserModel.RoomSession.findAndCountAll({
          where: {
            gameRoomId: gameRoom.id,
            isPlayer: 1
          }
        })
        
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
          io.in(idRoom).emit('startedGame', {message: 'Начинаем игру', status: 200})
          if (await ioUserService.isAgeRestriction(userId) || isCustomGame) {
            let game = await UserModel.GameRooms.findOne({where: {idRoom: idRoom}})
            game.isHidden = 1
            await game.save()
          }
          
          const data = await playerDataService.createDataGame(idRoom, playersData)
       //   console.log(data)
          
          let room = await UserModel.GameRooms.findOne({where: {idRoom: idRoom}})
          room.isStarted = 1
          await room.save()
          let sendData = {}
          sendData.logsData = data.logsData
          sendData.userData = data.userData
          sendData.bunkerData = data.bunkerData
          sendData.players = {}
        //  console.log('DATA SOZDANA')
          for (let playerId in data.userData) {
            sendData.players = {}
            if (data.userData[playerId].isPlayer) {
              sendData.players[playerId] = data.players[playerId]
            }
            io.to(`user:${playerId}:${idRoom}`).emit('setAllGameData', sendData)
          }
          io.in(`watchers:${idRoom}`).emit('setAllGameData', {
            userData: sendData.userData,
            bunkerData: data.bunkerData
          })
          io.in(idRoom).emit('sendMessage:timer', {
              title: 'Сообщение от ведущего',
              message: 'Игра началась',
              color: 'green'
            }
          )
        } catch(e) {
          io.in(idRoom).emit("setError",
            {
              message: `При создании игры произошла ошибка. Пожалуйста, попробуйте ещё раз создать игру, или обратитесь к администратору сервера`,
              status: 512,
              functionName: 'startGame'
            })
          console.log(e)
        }
      })
      socket.on('voiting:start', async () => {
        let gameRoom = await UserModel.GameRooms.findOne({where: {idRoom: idRoom}})
        //console.log(gameRoom)
          let isHostEmit = false
     //   console.log(io.sockets.adapter.rooms)
        if (gameRoom && gameRoom.isStarted) {
          gameRoom.voitingStatus = 0
          let players = await UserModel.RoomSession.findAll({where: {gameRoomId: gameRoom.id, isPlayer: 1, isAlive: 1}})
          if (players.length<1) {
            socket.emit("setError",
              {
                message: "Выживших игроков нет",
                status: 400,
                functionName: 'ByHour'
              })
            return
          }
          let banishPlayer = await UserModel.RoomSession.findAll({where: {gameRoomId: gameRoom.id, isPlayer: 1}})
          if (banishPlayer) {
            for (let player of banishPlayer) {
              player.votedFor = null
              await player.save()
            }
          }
        //  console.log('PLAYYERRSSS', players.length, players)
          for (let player of players) {
            // player.votedFor = null
            // await player.save()
              if(player.userId === userId){
                  isHostEmit = true
              }
            io.to(`user:${player.userId}:${idRoom}`).emit('setAllGameData', {
              voitingData: {status: gameRoom.voitingStatus, userChoise: null},
              logsData: [{type: 'text', value: 'Голосование началось', date: new Date()}]
            })
            io.to(`user:${player.userId}:${idRoom}`).emit('voiting:start')
          }
        //  console.log(isHostEmit,userId)
          if(!isHostEmit){
            //  console.log('Отправилось')
              io.to(`user:${userId}:${idRoom}`).emit('setAllGameData', {
                  voitingData: {status: gameRoom.voitingStatus, userChoise: null},
                  logsData: [{type: 'text', value: 'Голосование началось', date: new Date()}]
              })
              io.to(`user:${userId}:${idRoom}`).emit('voiting:start')
          }
          await gameRoom.save()
          await UserModel.Logi.create({
            idRoom: idRoom,
            funcName: 'voitingStart',
            text: 'Голосование началось',
            step: 0
          })
          io.in(idRoom).emit('sendMessage:timer', {
              title: 'Сообщение от ведущего',
              message: 'Голосование началось',
              color: 'green'
            }
          )
        }
        else {
          socket.emit("setError",
            {
              message: "Игра не началась, либо комнаты не существует",
              status: 603,
              functionName: 'voitingStart'
            })
        }
      })
      socket.on('voiting:finished', async () => {
        await ioUserService.finishedVoiting(idRoom, userId, io, socket)
          //d
      })
      socket.on('timer:start', async (seconds) => {
          let timerEndDate = new Date(+new Date() + (seconds * 1000))
          let gameRoom = await UserModel.GameRooms.findOne({where:{idRoom:idRoom}})
          gameRoom.timerEndDate = timerEndDate
          await gameRoom.save()
        io.in(idRoom).emit('timer:start', timerEndDate)
        io.in(idRoom).emit('sendMessage:timer', {
            title: 'Сообщение от ведущего',
            message: `Ведущий поставил таймер на ${seconds} секунд`,
            color: 'green'
          }
        )
      })
      socket.on('timer:pause', async (value) => {
          let gameRoom = await UserModel.GameRooms.findOne({where:{idRoom:idRoom}})
          gameRoom.timerPauseSeconds =Math.ceil((gameRoom.timerEndDate - new Date())/1000)
          gameRoom.save()


        io.in(idRoom).emit('timer:pause')
        io.in(idRoom).emit('sendMessage:timer', {
            title: 'Сообщение от ведущего',
            message: `Ведущий поставил таймер на паузу`,
            color: 'green'
          }
        )
      })
      socket.on('timer:resume', async (value) => {
          let gameRoom = await UserModel.GameRooms.findOne({where:{idRoom:idRoom}})

          let timerEndDate = new Date(+new Date() + (gameRoom.timerPauseSeconds * 1000))
          gameRoom.timerPauseSeconds = null
          gameRoom.timerEndDate = timerEndDate
          await gameRoom.save()
        io.in(idRoom).emit('timer:resume',timerEndDate)
        io.in(idRoom).emit('sendMessage:timer', {
            title: 'Сообщение от ведущего',
            message: `Ведущий возобновил таймер`,
            color: 'green'
          }
        )
      })
      socket.on('timer:stop', async (value) => {
          let gameRoom = await UserModel.GameRooms.findOne({where:{idRoom:idRoom}})
          gameRoom.timerEndDate = null
          gameRoom.timerPauseSeconds = null
          await gameRoom.save()
        io.in(idRoom).emit('timer:stop')
        io.in(idRoom).emit('sendMessage:timer', {
            title: 'Сообщение от ведущего',
            message: `Ведущий остановил таймер`,
            color: 'green'
          }
        )
      })
      socket.on('refresh:bunkerData', async (chartId) => {
        let arrayBunkerChart = ['allChart', 'bunkerCreated', 'bunkerSize', 'bunkerTime', 'bunkerFood', 'catastrophe','bunkerItems']
        let chartName = arrayBunkerChart[chartId]
        if (chartId===0) {
          chartName = null
        }
        let gameRoom = await UserModel.GameRooms.findOne({
          attributes: ['bunkerSize', 'bunkerCreated', 'maxSurvivor', 'catastrophe', 'bunkerTime', 'bunkerLocation', 'bunkerBedroom', 'bunkerItems1', 'bunkerItems2', 'bunkerItems3', 'bunkerFood', 'imageId', 'isStarted', 'population','bunkerItemsOthers','soundId'],
          where: {idRoom: idRoom},
          raw: true
        })
        if (gameRoom.isStarted) {
          let data = await playerDataService.refreshChartBunker(chartName, idRoom, userId)
          
          let textForLog = ''
          if (chartName===null) {
            let bunkerData = {}
            bunkerData.bunkerSize = `${gameRoom.bunkerSize}кв.м`
            bunkerData.maxSurvivor = gameRoom.maxSurvivor
            
            
            for (let key in gameRoom) {
              if (key.toString()!=='isStarted' && key.toString()!=='bunkerSize' && key.toString()!=='maxSurvivor' && key.toString()!=='imageId' && key.toString()!=='population'&& key.toString()!=='soundId') {
               // console.log('KEY', key)
                bunkerData[key] = gameRoom[key]
                
              }
              else if (key.toString()==='imageId') {
                let image = await UserModel.CatastropheImage.findOne({where: {id: gameRoom[key]}})
                bunkerData.imageName = image.id
              }
              
              
            }
            
            //  console.log(bunkerData)ss
            let lastVar = JSON.stringify(bunkerData)
            textForLog = `Ведущий изменил характеристики бункера на новые`
            await UserModel.Logi.create({
              idRoom: idRoom,
              funcName: 'bunkerData',
              text: textForLog,
              step: await playerDataService.howStepLog(idRoom),
              lastVar: lastVar
            })
          }
          else if (gameRoom[chartName]|| chartName==='bunkerItems') {
            let name = ioUserService.howThisChartNameBunker(chartName)
            textForLog = `Ведущий изменил ${name}`
            let vars = {}
            if (chartName==='catastrophe') {
              vars = {
                chartName: chartName,
                lastVar: gameRoom[chartName],
                otherVar: {imageId: gameRoom.imageId, population: gameRoom.population,soundId:gameRoom.soundId}
              }
          //    console.log(gameRoom.population)
            }else if(chartName==='bunkerItems'){
                vars = {
                    chartName: chartName,
                    lastVar : [gameRoom.bunkerItems1,gameRoom.bunkerItems2,gameRoom.bunkerItems3,gameRoom.bunkerItemsOthers]
                }
              //  console.log(gameRoom.bunkerItemsOthers)
            }
            else {
              vars = {chartName: chartName, lastVar: gameRoom[chartName]}
            }
          //  console.log('LOOOOL',vars)
            await UserModel.Logi.create({
              idRoom: idRoom,
              funcName: `bunkerData:${chartName}`,
              text: textForLog,
              step: await playerDataService.howStepLog(idRoom),
              lastVar: JSON.stringify(vars)
            })
            
          }
          io.in([idRoom, `watchers:${idRoom}`]).emit('setAllGameData',
            {bunkerData: data, logsData: {type: 'text', value: textForLog, date: new Date()},showCancelButton:true})
          io.in(idRoom).emit('sendMessage:timer', {
              title: 'Сообщение от ведущего',
              message: textForLog,
              color: 'green'
            }
          )
        }
        
      })
      socket.on('refresh:maxSurvivor', async (value) => {
        let gameRoom = await UserModel.GameRooms.findOne({where: {idRoom: idRoom}})
        let players = await UserModel.RoomSession.findAll({where: {gameRoomId: gameRoom.id, isPlayer: 1}})
        if (players.length<1) {
          socket.emit("setError",
            {
              message: "Выживших игроков нет",
              status: 400,
              functionName: 'ByHour'
            })
          return
        }
        let textForLog = ''
        if (value) {
          if ((gameRoom.maxSurvivor + 1)<=players.length) {
           // console.log(gameRoom.maxSurvivor)
            await UserModel.Logi.create({
              idRoom: idRoom,
              funcName: 'maxSurvivor',
              text: `Ведущий увеличил мест в бункере до ${gameRoom.maxSurvivor + 1}`,
              step: 0,
              lastVar: gameRoom.maxSurvivor
            })
            textForLog = `Ведущий увеличил мест в бункере до ${gameRoom.maxSurvivor + 1}`
            gameRoom.maxSurvivor += 1
            await gameRoom.save()
         //   console.log(gameRoom.maxSurvivor)
            
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
              text: `Ведущий уменьшил мест в бункере до ${gameRoom.maxSurvivor - 1}`,
              step: 0,
              lastVar: gameRoom.maxSurvivor
            })
            textForLog = `Ведущий уменьшил мест в бункере до ${gameRoom.maxSurvivor - 1}`
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
        io.in([idRoom, `watchers:${idRoom}`]).emit('setAllGameData',
          {
            bunkerData: {maxSurvivor: gameRoom.maxSurvivor},
            logsData: [{type: 'text', value: textForLog, date: new Date()}]
          })
        io.in(idRoom).emit('sendMessage:timer', {
            title: 'Сообщение от ведущего',
            message: textForLog,
            color: 'green'
          }
        )
      })
      socket.on('refresh:professionExp', async (playersId, expId) => {
      //  console.log('id', playersId)
        const expLevel = ['Дилетант', 'Стажер', 'Любитель', 'Опытный', 'Эксперт', 'Профессионал']
        if (expId>5 || expId<0) {
          socket.emit("setError",
            {
              message: "Такого стажа не существует",
              status: 400,
              functionName: 'refresh:sexOpposite'
            })
          return
        }
        let exp = expLevel[expId]
        let gameRoom = await UserModel.GameRooms.findOne({where: {idRoom: idRoom}})
        let players = null
        let textForLog = ''
        let lastVar = {}
        let invalidPlayersNickname = []
        if (playersId===0) {
          textForLog = `Ведущий изменил стаж специальности всем на ${exp}`
          players = await UserModel.RoomSession.findAll({
            where: {
              gameRoomId: gameRoom.id,
              isPlayer: 1,
              isAlive: 1
            }
          })
          if (players.length<1) {
            socket.emit("setError",
              {
                message: "Выживших игроков нет",
                status: 400,
                functionName: 'ByHour'
              })
            return
          }
        }
        else {
          if (playersId>0) {
            let user = await UserModel.User.findOne({where: {id: playersId}})
            if (!user) {
              return
            }
            textForLog = `Ведущий изменил стаж специальности игроку ${user.nickname}`
          }
          else {
            textForLog = `Ведущий изменил стаж специальности игроку Гость#${Math.abs(playersId)}`
          }
          players = await UserModel.RoomSession.findOne({where: {gameRoomId: gameRoom.id, userId: playersId}})
          if (players.length<1) {
            socket.emit("setError",
              {
                message: "Выживших игроков нет",
                status: 400,
                functionName: 'ByHour'
              })
            return
          }
          players = [players]
        }
      //  console.log(players)
        let emitData = {players: {}, logsData: {}}
      //  console.log(players.length)
        for (let player of players) {
          if (player.isAlive && player.isPlayer) {
            let data = JSON.parse(player.profession)
         //   console.log(data.text)
            let ecsExp = data.text.substring(data.text.indexOf('(') + 1, data.text.indexOf(')'))
         //   console.log('ecsExp', ecsExp)
            if (ecsExp!=='') {
              lastVar[player.userId] = ecsExp
              data.text = data.text.replace(ecsExp, exp)
              let isOpen = data.isOpen
              player.profession = JSON.stringify(data)
              await player.save()
              data = {profession: data}
            //  console.log(data)
              
              if (isOpen) {
            //    console.log("player.userId", player.userId)
                emitData.players[player.userId] = data
              }
              else {
                io.to(`user:${player.userId}:${idRoom}`).emit('setAllGameData', {players: {[player.userId]: data}})
              }
            }
            else {
              invalidPlayersNickname.push(await ioUserService.getNickname(player.userId))
              
              continue
            }
          }
          else {
            // добавляем в список недействительных пользователей
          }
        }
        if (invalidPlayersNickname.length) {
          socket.emit("setError",
            {
              message: "Нельзя изменить стаж профессии у данного(ых) игроков:",
              status: 701,
              functionName: 'refresh:sexOpposite',
              wrongData: invalidPlayersNickname
            })
          
        }
        if (!systemFunction.objIsEmpty(lastVar)) {
          await UserModel.Logi.create({
            idRoom: idRoom,
            funcName: `professionExp`,
            text: textForLog,
            step: await playerDataService.howStepLog(idRoom),
            lastVar: JSON.stringify(lastVar)
          })
        }
       // console.log(emitData)
        emitData.logsData.type = 'text'
        emitData.logsData.value = textForLog
        emitData.logsData.date = new Date()
        emitData.showCancelButton = true
        io.in([idRoom, `watchers:${idRoom}`]).emit('setAllGameData', emitData)
        io.in(idRoom).emit('sendMessage:timer', {
            title: 'Сообщение от ведущего',
            message: textForLog,
            color: 'green'
          }
        )
        
      })
      socket.on('rollTheDice', async (value) => {
        let num = playerDataService.getRandomInt(1, value)
       // console.log('VIPALO', num)
        await UserModel.Logi.create(
          {
            idRoom: idRoom,
            funcName: 'rollTheDice',
            text: `Был брошен кубик с ${value} гранями, выпало ${num}`,
            step: 0,
            lastVar: num
          })
        io.in([idRoom, `watchers:${idRoom}`]).emit(`rollTheDice:${value}`, num)
        io.in([idRoom, `watchers:${idRoom}`]).emit('setAllGameData',
          {logsData: [{type: 'rollDice', value: `Был брошен кубик с ${value} гранями, выпало ${num}`, date: new Date()}]})
      })
      socket.on('refresh:professionByHour', async (chartId) => {
        let gameRoom = await UserModel.GameRooms.findOne({where: {idRoom: idRoom}})
        let players = await UserModel.RoomSession.findAll({
          where: {
            gameRoomId: gameRoom.id,
            isPlayer: 1,
            isAlive: 1
          }
        })
        let dataForNextPlayer = {}
        let emitData = {players: {}, logsData: {}}
        let vars = {}
        let lastVar = {}
        let lastPlayer = players[players.length - 1]
        let playerProfessionData = JSON.parse(lastPlayer.profession)
        dataForNextPlayer = JSON.parse(players[0].profession)
        playerProfessionData.isOpen = dataForNextPlayer.isOpen
        vars.id = dataForNextPlayer.id
        vars.text = dataForNextPlayer.text
        
        lastVar[players[0].userId] = vars
        vars.id = playerProfessionData.id
        vars.text = playerProfessionData.text
        lastVar[lastPlayer.userId] = vars
        if (playerProfessionData.isOpen) {
        //  console.log("isOpen", players[0].userId)
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
          vars.id = data.id
          vars.text = data.text
          lastVar[player.userId] = vars
          
          if (data.isOpen) {
           // console.log("isOpen", player.userId)
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
        await UserModel.Logi.create({
          idRoom: idRoom,
          funcName: `professionByHour`,
          text: 'Ведущий изменил специальности по часовой стрелке',
          step: await playerDataService.howStepLog(idRoom),
          lastVar: JSON.stringify(lastVar)
        })
        emitData.logsData.type = 'text'
        emitData.logsData.value = 'Ведущий изменил специальности по часовой стрелке'
        emitData.logsData.date = new Date()
        io.in([idRoom, `watchers:${idRoom}`]).emit('setAllGameData', emitData)
        io.in(idRoom).emit('refresh:professionByHour:good')
      })
      socket.on('refresh:professionSetNull', async () => {
        let gameRoom = await UserModel.GameRooms.findOne({where: {idRoom: idRoom}})
        let players = await UserModel.RoomSession.findAll({where: {gameRoomId: gameRoom.id, isPlayer: 1}})
        if (players.length<1) {
          socket.emit("setError",
            {
              message: "Выживших игроков нет",
              status: 400,
              functionName: 'ByHour'
            })
          return
        }
        let lastVar = {}
        
        let emitData = {players: {}, logsData: {}}
        for (let player of players) {
          let vars = {}
          
          let data = JSON.parse(player.profession)
          vars.id = data.id
          vars.text = data.text
          vars.description = data.description
          lastVar[player.userId] = vars
          data.text = 'Без профессии'
          data.id = 0
          data.description = ''
          player.profession = JSON.stringify(data)
          //console.log(player.userId)
          await player.save()
          if (data.isOpen) {
          //  console.log("player.userId", player.userId)
            emitData.players[player.userId] = {profession: data}
          }
          else {
            io.to(`user:${player.userId}:${idRoom}`).emit('setAllGameData',
              {players: {[player.userId]: {profession: data}}})
          }
        }
        await UserModel.Logi.create({
          idRoom: idRoom,
          funcName: `professionSetNull`,
          text: 'Ведущий изменил специальности по часовой стрелке',
          step: await playerDataService.howStepLog(idRoom),
          lastVar: JSON.stringify(lastVar)
        })
        emitData.logsData.type = 'text'
        emitData.logsData.value = 'Ведущий анулировал всем специальности'
        emitData.logsData.date = new Date()
        io.in([idRoom, `watchers:${idRoom}`]).emit('setAllGameData', emitData)
      })
      socket.on('refresh:sexOpposite', async (playerId) => {
        let gameRoom = await UserModel.GameRooms.findOne({where: {idRoom: idRoom}})
        
       // console.log('PROVERKA ID', playerId)
        let players = null
        let textForLog = ''
        let lastVar = {}
        if (playerId===0) {
          textForLog = `Ведущий изменил всем пол на противоположный`
          players = await UserModel.RoomSession.findAll({
            where: {
              gameRoomId: gameRoom.id,
              isPlayer: 1,
              isAlive: 1
            }
          })
          if (players.length<1) {
            socket.emit("setError",
              {
                message: "Выживших игроков нет",
                status: 400,
                functionName: 'ByHour'
              })
            return
          }
        }
        else {
          if (playerId>0) {
            let user = await UserModel.User.findOne({where: {id: playerId}})
            textForLog = `Ведущий изменил пол игроку ${user.nickname} на противоположный`
          }
          else {
            textForLog = `Ведущий изменил пол игроку Гость#${Math.abs(playerId)} на противоположный`
          }
          players = await UserModel.RoomSession.findOne({where: {gameRoomId: gameRoom.id, userId: playerId}})
          if (players.length<1) {
            socket.emit("setError",
              {
                message: "Выживших игроков нет",
                status: 400,
                functionName: 'ByHour'
              })
            return
          }
          players = [players]
        }
       // console.log(players)
        let emitData = {players: {}, logsData: {}}
      //  console.log(players.length)
        let invalidPlayersNickname = []
        for (let player of players) {
          if (player.isAlive && player.isPlayer) {
            let data = JSON.parse(player.sex)
           // console.log(data.text)
            if (data.text.includes('Мужчина')) {
              data.text = data.text.replace('Мужчина', 'Женщина')
              lastVar[player.userId] = 'Мужчина'
            }
            else if (data.text.includes('Женщина')) {
              data.text = data.text.replace('Женщина', 'Мужчина')
              lastVar[player.userId] = 'Женщина'
            }
            else {
              invalidPlayersNickname.push(await ioUserService.getNickname(player.userId))
              continue
            }
          //  console.log(data.text)
            let isOpen = data.isOpen
            player.sex = JSON.stringify(data)
            await player.save()
            data = {sex: data}
           // console.log(data)
            
            if (isOpen) {
           //   console.log("player.userId", player.userId)
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
     //   console.log('invalidPlayersNickname.length', invalidPlayersNickname.length, invalidPlayersNickname)
        if (invalidPlayersNickname.length) {
          socket.emit("setError", {
            message: "Нельзя изменить пол на противополжный у данного(ых) игроков",
            status: 701,
            functionName: 'refresh:sexOpposite',
            wrongData: invalidPlayersNickname
          })
        }
        if (!systemFunction.objIsEmpty(lastVar)) {
          await UserModel.Logi.create({
            idRoom: idRoom,
            funcName: `sexOpposite`,
            text: textForLog,
            step: await playerDataService.howStepLog(idRoom),
            lastVar: JSON.stringify(lastVar)
          })
        }
       // console.log(emitData)
        emitData.logsData.type = 'text'
        emitData.logsData.value = textForLog
        emitData.logsData.date = new Date()
        emitData.showCancelButton = true
        io.in([idRoom, `watchers:${idRoom}`]).emit('setAllGameData', emitData)
        io.in(idRoom).emit('sendMessage:timer', {
            title: 'Сообщение от ведущего',
            message: textForLog,
            color: 'green'
          }
        )
      })
      socket.on('banishOrReturn', async (userId) => {
          // console.log(userId)
          let gameRoom = await UserModel.GameRooms.findOne({where: {idRoom: idRoom}})
          let textForLog = ''
          let color = 'green'
          let nickname = ''
          let emitStatus = false
          if (gameRoom.isStarted) {
            let player = await UserModel.RoomSession.findOne({where: {userId: userId, gameRoomId: gameRoom.id}})
            if (player && player.isPlayer) {
              
              if (userId>0) {
                let user = await UserModel.User.findOne({where: {id: userId}})
                nickname = user.nickname
              }
              else {
                nickname = `Гость#${Math.abs(userId)}`
              }
              
              //  console.log(player.isAlive)
              if (player.isAlive) {
                player.isAlive = 0
                textForLog = `Ведущий изгнал игрока ${nickname}`
                color = 'red'
              }
              else {
                player.isAlive = 1
                textForLog = `Ведущий вернул игрока ${nickname}`
                emitStatus = true
              }
              // console.log(emitStatus)
              await player.save()
              await UserModel.Logi.create({
                idRoom: idRoom,
                funcName: `banishOrReturn`,
                text: textForLog,
                step: 0,
              })
              //  console.log(emitStatus)
              io.in([idRoom, `watchers:${idRoom}`]).emit('setAllGameData',
                {
                  userData: {[userId]: {isAlive: emitStatus}},
                  logsData: {type: 'text', value: textForLog, date: new Date()}
                })
              io.in(idRoom).emit('sendMessage:timer', {
                  title: 'Сообщение от ведущего',
                  message: textForLog,
                  color: color
                }
              )
            }
            else {
              socket.emit("setError",
                {
                  message: "Данного игрока нет в игре",
                  status: 400,
                  functionName: 'banishOrReturn'
                })
              return
            }
          }
          else {
            socket.emit("setError",
              {
                message: "Игра еще не началась",
                status: 400,
                functionName: 'banishOrReturn'
              })
            return
            // ошибка, что игра не началась
          }
          
        }
      )
      socket.on('clearData', async () => {
        let gameRoom = await UserModel.GameRooms.findOne({where: {idRoom}})
        let sendData = {players: {}}
        if (gameRoom.isStarted) {
          let players = await UserModel.RoomSession.findAll({where: {gameRoomId: gameRoom.id, isPlayer: 1}})
          
          let data = {}
          data.sex = {isOpen: false}
          data.body = {isOpen: false}
          data.trait = {isOpen: false}
          data.profession = {isOpen: false}
          data.health = {isOpen: false}
          data.hobbies = {isOpen: false}
          data.phobia = {isOpen: false}
          data.backpack = {isOpen: false}
          data.inventory = {isOpen: false}
          data.addInfo = {isOpen: false}
          data.spec1 = {isOpen: false}
          data.spec2 = {isOpen: false}
          for (let player of players) {
            sendData.players[player.userId] = data
          }
          
        }
        sendData.showCancelButton = false
        io.in(idRoom).emit('setAllGameData', sendData)
        io.in(idRoom).emit('restartGame')
      })
      socket.on('refresh:degreeOfSick', async (playersId, degreeId) => {
        if (degreeId>3 || degreeId<0) {
          socket.emit("setError",
            {
              message: "Такой степени не существует",
              status: 400,
              functionName: 'refresh:sexOpposite'
            })
          return
        }
        const healthLevel = ['Легкая степень', 'Средняя степень', 'Тяжелая степень', 'Критическая степень']
        let degree = healthLevel[degreeId]
        
        let gameRoom = await UserModel.GameRooms.findOne({where: {idRoom: idRoom}})
        let players = null
        let textForLog = ''
        let lastVar = {}
        if (playersId===0) {
          textForLog = `Ведущий изменил степень болезни всем на ${degree}`
          players = await UserModel.RoomSession.findAll({
            where: {
              gameRoomId: gameRoom.id,
              isPlayer: 1,
              isAlive: 1
            }
          })
          if (players.length<1) {
            socket.emit("setError",
              {
                message: "Выживших игроков нет",
                status: 400,
                functionName: 'ByHour'
              })
            return
          }
        }
        else {
          if (playersId>0) {
            let user = await UserModel.User.findOne({where: {id: playersId}})
            if (!user) {
              return
            }
            textForLog = `Ведущий изменил степень болезни игроку ${user.nickname}`
          }
          else {
            textForLog = `Ведущий изменил степень болезни игроку Гость#${Math.abs(playersId)}`
          }
          players = await UserModel.RoomSession.findOne({where: {gameRoomId: gameRoom.id, userId: playersId}})
          if (players.length<1) {
            socket.emit("setError",
              {
                message: "Выживших игроков нет",
                status: 400,
                functionName: 'ByHour'
              })
            return
          }
          players = [players]
        }
     //   console.log(players)
        let emitData = {players: {}, logsData: {}}
        //console.log(players.length)
        let invalidPlayersNickname = []
        for (let player of players) {
          if (player.isAlive && player.isPlayer) {
            let data = JSON.parse(player.health)
       //     console.log(data.text)
            let ecsExp = data.text.substring(data.text.indexOf('(') + 1, data.text.indexOf(')'))
            if (ecsExp!=='' || data.text==='Идеально здоров') {
              // console.log('ecsExp', ecsExp)
              let isOpen = data.isOpen
              if (data.text!=='Идеально здоров') {
                lastVar[player.userId] = ecsExp
                data.text = data.text.replace(ecsExp, degree)
                
                player.health = JSON.stringify(data)
                await player.save()
                data = {health: data}
              //  console.log(data)
              }
              if (isOpen) {
               // console.log("player.userId", player.userId)
                emitData.players[player.userId] = data
              }
              else {
                io.to(`user:${player.userId}:${idRoom}`).emit('setAllGameData', {players: {[player.userId]: data}})
              }
            }
            else {
              invalidPlayersNickname.push(await ioUserService.getNickname(player.userId))
              continue
              
            }
          }
          else {
            // добавляем в список недействительных пользователей
          }
        }
        if (invalidPlayersNickname.length) {
          socket.emit("setError",
            {
              message: "Нельзя изменить степень болезни у данного(ых) игроков:",
              status: 701,
              functionName: 'refresh:sexOpposite',
              wrongData: invalidPlayersNickname
            })
          
        }
        if (!systemFunction.objIsEmpty(lastVar)) {
          await UserModel.Logi.create({
            idRoom: idRoom,
            funcName: `degreeOfSick`,
            text: textForLog,
            step: await playerDataService.howStepLog(idRoom),
            lastVar: JSON.stringify(lastVar)
          })
        }
        else {
          await UserModel.Logi.create({
            idRoom: idRoom,
            funcName: `degreeOfSick`,
            text: textForLog,
            step: await playerDataService.howStepLog(idRoom)
          })
        }
       // console.log(emitData)
        emitData.logsData.type = 'text'
        emitData.logsData.value = textForLog
        emitData.logsData.date = new Date()
        emitData.showCancelButton = true
        io.in([idRoom, `watchers:${idRoom}`]).emit('setAllGameData', emitData)
        io.in(idRoom).emit('sendMessage:timer', {
            title: 'Сообщение от ведущего',
            message: textForLog,
            color: 'green'
          }
        )
        // io.in(idRoom).emit()
      })
      socket.on('refresh:cureMake', async (playersId, makeId) => {
        let makeArray = ['Сделать идеально здоровым', 'Сделать чайлдфри', 'Вылечить чайлдфри', 'Вылечить фобию']
        let make = makeArray[makeId]
        if (makeId>3 || makeId<0) {
          socket.emit("setError",
            {
              message: "Такой степени не существуетет",
              status: 400,
              functionName: 'refresh:cureMake'
            })
          return
        }
        
        let gameRoom = await UserModel.GameRooms.findOne({where: {idRoom: idRoom}})
        let players = null
        let textForLog = ''
        let lastVar = {}
        if (playersId===0) {
          textForLog = `Ведущий применил функцию ${make} ко всем игрокам`
          players = await UserModel.RoomSession.findAll({
            where: {
              gameRoomId: gameRoom.id,
              isPlayer: 1,
              isAlive: 1
            }
          })
          if (players.length<1) {
            socket.emit("setError",
              {
                message: "Выживших игроков нет",
                status: 400,
                functionName: 'ByHour'
              })
            return
          }
        }
        else {
          if (playersId>0) {
            let user = await UserModel.User.findOne({where: {id: playersId}})
            if (!user) {
              return
            }
            textForLog = `Ведущий применил функцию ${make} к игроку ${user.nickname}`
          }
          else {
            textForLog = `Ведущий применил функцию ${make} к игроку Гость#${Math.abs(playersId)}`
          }
          players = await UserModel.RoomSession.findOne({where: {gameRoomId: gameRoom.id, userId: playersId}})
          if (players.length<1) {
            socket.emit("setError",
              {
                message: "Выживших игроков нет",
                status: 400,
                functionName: 'ByHour'
              })
            return
          }
          players = [players]
        }
        // console.log(players)
        let emitData = {players: {}, logsData: {}}
        for (let player of players) {
          if (player && player.isPlayer && player.isAlive) {
            let refreshData = playerDataService.cureMake(player, makeId)
            player = refreshData.player
         //   console.log(player.userId)
            lastVar[player.userId] = refreshData.lastVar
            await player.save()
            if (refreshData.isOpen) {
           //   console.log("player.userId", player.userId)
              emitData.players[player.userId] = refreshData.data
            }
            else {
              io.to(`user:${player.userId}:${idRoom}`).emit('setAllGameData',
                {players: {[player.userId]: refreshData.data}})
            }
          }
        }
        if (!systemFunction.objIsEmpty(lastVar)) {
          await UserModel.Logi.create({
            idRoom: idRoom,
            funcName: `cureMake`,
            text: textForLog,
            step: await playerDataService.howStepLog(idRoom),
            lastVar: JSON.stringify(lastVar)
          })
        }
       // console.log(emitData)
        emitData.logsData.type = 'text'
        emitData.logsData.value = textForLog
        emitData.logsData.date = new Date()
        emitData.showCancelButton = true
        io.in([idRoom, `watchers:${idRoom}`]).emit('setAllGameData', emitData)
        io.in(idRoom).emit('sendMessage:timer', {
            title: 'Сообщение от ведущего',
            message: textForLog,
            color: 'green'
          }
        )
      })
      socket.on('refresh:chartName', async (playersId, chartId, chartText = null) => {
        
        if (chartText) {
          let forbiddenCharacters = await UserModel.BlackListWords.findAll()
          let isBadContent = false
          if (forbiddenCharacters) {
            forbiddenCharacters.forEach(word => {
              if (chartText.toLowerCase().includes(word.word.toLowerCase())) {
                socket.emit("setError",
                  {
                    message: "Недопустимый текст",
                    status: 400,
                    functionName: 'refresh:chartName'
                  })
                isBadContent = true
              }
            })
          }
          if (isBadContent) {
            return
          }
        }
        let chartArray = ['allChart', 'sex', 'body', 'trait', 'profession', 'health', 'hobbies', 'phobia', 'inventory', 'backpack', 'addInfo']
        if (chartId>10 || chartId<0) {
          socket.emit("setError",
            {
              message: "Такой характеристики не существуетет",
              status: 400,
              functionName: 'refresh:chartName'
            })
          return
        }
        let gameRoom = await UserModel.GameRooms.findOne({where: {idRoom: idRoom}})
        let chartName = chartArray[chartId]
        let nameChartArray = ['Все характеристики', 'Пол', 'Телосложение', 'Человеческая черта', 'Профессия', 'Здоровье', 'Хобби', 'Фобия', 'Инвентарь', 'Рюкзак', 'Доп. информация', 'Спец. возможность 1', 'Спец. возможность 2']
        let nameChart = nameChartArray[chartId]
        let players = null
        let textForLog = ''
        let lastVar = {}
        if (playersId===0) {
          textForLog = `Ведущий изменил ${nameChart} у всех игроков`
          players = await UserModel.RoomSession.findAll({
            where: {
              gameRoomId: gameRoom.id,
              isPlayer: 1,
              isAlive: 1
            }
          })
          if (players.length<1) {
            socket.emit("setError",
              {
                message: "Выживших игроков нет",
                status: 400,
                functionName: 'ByHour'
              })
            return
          }
        }
        else {
          if (playersId>0) {
            let user = await UserModel.User.findOne({where: {id: playersId}})
            if (!user) {
              return
            }
            textForLog = `Ведущий изменил ${nameChart} у игрока ${user.nickname}`
          }
          else {
            textForLog = `Ведущий изменил ${nameChart} у игрока Гость#${Math.abs(playersId)}`
          }
          players = await UserModel.RoomSession.findOne({
            where: {
              gameRoomId: gameRoom.id,
              userId: playersId,
              isPlayer: 1,
              isAlive: 1
            }
          })
          if (players.length<1) {
            socket.emit("setError",
              {
                message: "Выживших игроков нет",
                status: 400,
                functionName: 'ByHour'
              })
            return
          }
          players = [players]
        }
        let data = await playerDataService.refreshChartPlayers(chartName, idRoom, players, gameRoom, chartText)
        for (let player of players) {
          io.to(`user:${player.userId}:${idRoom}`).emit('setAllGameData',
            {players: {[player.userId]: data.players[player.userId]}})
        }
        await UserModel.Logi.create({
          idRoom: idRoom,
          funcName: `refresh:chartName`,
          text: textForLog,
          step: await playerDataService.howStepLog(idRoom),
          lastVar: JSON.stringify(data.lastVar)
        })
        data.emitData.logsData = {type: `text`, value: textForLog, date: new Date()}
        data.emitData.showCancelButton = true
        io.in([idRoom, `watchers:${idRoom}`]).emit('setAllGameData', data.emitData)
        io.in(idRoom).emit('sendMessage:timer', {
            title: 'Сообщение от ведущего',
            message: textForLog,
            color: 'green'
          }
        )
        
      })
      socket.on('stealChart', async (playerId2, playerId1, chartId) => {
        let chartArray = ['sex', 'body', 'trait', 'profession', 'health', 'hobbies', 'phobia', 'inventory', 'backpack', 'addInfo', 'spec1', 'spec2']
        if (chartId>11 || chartId<0) {
          socket.emit("setError",
            {
              message: "Такой характеристики не существует",
              status: 400,
              functionName: 'stealChart'
            })
          return
        }
        if (playerId1===playerId2) {
          socket.emit("setError",
            {
              message: "Нельзя украсть у самого себя!",
              status: 400,
              functionName: 'stealChart'
            })
          return
        }
        let gameRoom = await UserModel.GameRooms.findOne({where: {idRoom: idRoom}})
        let chartName = chartArray[chartId]
        let player1 = await UserModel.RoomSession.findOne({
          attributes: ['userId', `${chartName}`, 'usePack'],
          where: {gameRoomId: gameRoom.id, isPlayer: 1, userId: playerId1, isAlive: 1}
        })
        let player2 = await UserModel.RoomSession.findOne({
          attributes: ['userId', `${chartName}`],
          where: {gameRoomId: gameRoom.id, isPlayer: 1, userId: playerId2, isAlive: 1}
        })
        if (!player1 || !player2) {
          socket.emit("setError",
            {
              message: "Ошибка с пользователями!",
              status: 400,
              functionName: 'stealChart'
            })
          return
          
        }
        let textForLog = `Игрок ${await ioUserService.getNickname(
          playerId2)} украл характеристику у игрока ${await ioUserService.getNickname(playerId1)}`
        
        
        let data = await playerDataService.stealChart(playerId1, playerId2, gameRoom, chartName)
      //  console.log(playerId2)
        if (!data.isOpenPlayer1) {
          io.to(`user:${playerId1}:${idRoom}`).emit('setAllGameData', {players: {[playerId1]: data.players[playerId1]}})
        }
        if (!data.isOpenPlayer2) {
          io.to(`user:${playerId2}:${idRoom}`).emit('setAllGameData', {players: {[playerId2]: data.players[playerId2]}})
        }
        await UserModel.Logi.create({
          idRoom: idRoom,
          funcName: `stealChart`,
          text: textForLog,
          step: await playerDataService.howStepLog(idRoom),
          lastVar: JSON.stringify(data.lastVar)
        })
        
        io.in([idRoom, `watchers:${idRoom}`]).emit('setAllGameData', {players: data.emitData,
          logsData: {type: `text`, value: textForLog, date: new Date()},showCancelButton :true})
        io.in(idRoom).emit('sendMessage:timer', {
            title: 'Сообщение от ведущего',
            message: textForLog,
            color: 'green'
          }
        )
        
      })
      socket.on('addChart', async (playersId, chartId, chartText = null) => {
        if (chartText) {
          let isBadContent = false
          let forbiddenCharacters = await UserModel.BlackListWords.findAll()
          
          if (forbiddenCharacters) {
            forbiddenCharacters.forEach(word => {
              if (chartText.toLowerCase().includes(word.word.toLowerCase())) {
                socket.emit("setError",
                  {
                    message: "Недопустимый текст",
                    status: 400,
                    functionName: 'addChart'
                  })
                isBadContent = true
              }
            })
          }
          
          if (isBadContent) {
            return
          }
        }
        let chartArray = ['trait', 'health', 'hobbies', 'phobia', 'inventory', 'backpack', 'addInfo']
        let nameChartArray = ['Человеческая черта', 'Здоровье', 'Хобби', 'Фобия', 'Инвентарь', 'Рюкзак', 'Доп. информация']
     //   console.log('chartId', chartId)
        if (chartId>7 || chartId<0) {
          socket.emit("setError",
            {
              message: "Такой характеристики не существуетет",
              status: 400,
              functionName: 'addChart'
            })
          return
        }
        let gameRoom = await UserModel.GameRooms.findOne({where: {idRoom: idRoom}})
        let chartName = chartArray[chartId]
        let nameChart = nameChartArray[chartId]
        
        let players = null
        
        let textForLog = ''
        let lastVar = {}
        lastVar.chartName = chartName
        if (playersId===0) {
          textForLog = `Ведущий добавил дополнительно ${nameChart} всем игрокам`
          players = await UserModel.RoomSession.findAll({
            where: {
              gameRoomId: gameRoom.id,
              isPlayer: 1,
              isAlive: 1
            }
          })
          if (players.length<1) {
            socket.emit("setError",
              {
                message: "Выживших игроков нет",
                status: 400,
                functionName: 'ByHour'
              })
            return
          }
        }
        else {
          if (playersId>0) {
            let user = await UserModel.User.findOne({where: {id: playersId}})
            if (!user) {
              return
            }
            textForLog = `Ведущий добавил допольнительно ${nameChart} игроку ${user.nickname}`
          }
          else {
            textForLog = `Ведущий добавил допольнительно ${nameChart} игроку Гость#${Math.abs(playersId)}`
          }
          players = await UserModel.RoomSession.findOne({
            where: {
              gameRoomId: gameRoom.id,
              userId: playersId,
              isPlayer: 1,
              isAlive: 1
            }
          })
          if (players.length<1) {
            socket.emit("setError",
              {
                message: "Выживших игроков нет",
                status: 400,
                functionName: 'ByHour'
              })
            return
          }
          players = [players]
        }
        let emitData = {players: {}, logsData: {}}
        for (let player of players) {
          lastVar[player.userId] = JSON.parse(player[chartName])
        //  console.log(JSON.parse(player[chartName]).id.length, (typeof JSON.parse(player[chartName]).id))
          if ((typeof JSON.parse(player[chartName]).id)!=='number' && JSON.parse(player[chartName]).id.length>5) {
            socket.emit("setError",
              {
                message: "Превышен лимит добавления характеристики",
                status: 400,
                functionName: 'addChart'
              })
            return
          }
          let data = await playerDataService.addChart(player, gameRoom, chartName, chartText)
          player[chartName] = JSON.stringify(data)
          await player.save()
          if (data.isOpen) {
            emitData.players[player.userId] = {[chartName]: data}
          }
          else {
            io.to(`user:${player.userId}:${idRoom}`).emit('setAllGameData',
              {players: {[player.userId]: {[chartName]: data}}})
          }
        }
        await UserModel.Logi.create({
          idRoom: idRoom,
          funcName: `addChart`,
          text: textForLog,
          step: await playerDataService.howStepLog(idRoom),
          lastVar: JSON.stringify(lastVar)
        })
        emitData.logsData.type = 'text'
        emitData.logsData.value = textForLog
        emitData.logsData.date = new Date()
        emitData.showCancelButton = true
        io.in([idRoom, `watchers:${idRoom}`]).emit('setAllGameData', emitData)
        io.in(idRoom).emit('sendMessage:timer', {
            title: 'Сообщение от ведущего',
            message: emitData.logsData.value,
            color: 'green'
          }
        )
        
        
      })
      socket.on('deleteRelocate', async (playersId, makeId) => {
        let arrayMake = ['Удалить инвентарь', 'Перенести инвентарь', 'Удалить рюкзак', 'Перенести рюкзак']
       // console.log(makeId)
          let arrLast = ['drop','trans']
          let makeFuncName = arrLast[1]
          if(makeId===0 ||makeId===2){
              makeFuncName = arrLast[0]
          }
        if ((playersId===0 && makeId===1) || (playersId===0 && makeId===3)) {
          socket.emit("setError",
            {
              message: "Нельзя перенести инвентарь/рюкзак в бункер всем игрокам",
              status: 400,
              functionName: 'deleteRelocate'
            })
          return
        }
        if (makeId>3 || makeId<0) {
          socket.emit("setError",
            {
              message: "Такого действия не существует",
              status: 400,
              functionName: 'deleteRelocate'
            })
          return
        }
        let chartName
        if (makeId===0 || makeId===1) {
          chartName = 'inventory'
        }
        else {
          chartName = 'backpack'
        }
        let gameRoom = await UserModel.GameRooms.findOne({where: {idRoom: idRoom}})
        let makeName = arrayMake[makeId]
        let players = null
        let textForLog = ''
        let lastVar = {}
        lastVar.chartName = chartName
        if (playersId===0) {
          textForLog = `Ведущий применил функцию ${makeName} ко всем игрокам`
          players = await UserModel.RoomSession.findAll({
            where: {
              gameRoomId: gameRoom.id,
              isPlayer: 1,
              isAlive: 1
            }
          })
          if (players.length<1) {
            socket.emit("setError",
              {
                message: "Выживших игроков нет",
                status: 400,
                functionName: 'ByHour'
              })
            return
          }
        }
        else {
          if (playersId>0) {
            let user = await UserModel.User.findOne({where: {id: playersId}})
            if (!user) {
              return
            }
            textForLog = `Ведущий применил функцию ${makeName} к игроку ${user.nickname}`
          }
          else {
            textForLog = `Ведущий применил функцию ${makeName} к игроку Гость#${Math.abs(playersId)}`
          }
          players = await UserModel.RoomSession.findOne({
            where: {
              gameRoomId: gameRoom.id,
              userId: playersId,
              isPlayer: 1,
              isAlive: 1
            }
          })
          if (players.length<1) {
            socket.emit("setError",
              {
                message: "Выживших игроков нет",
                status: 400,
                functionName: 'ByHour'
              })
            return
          }
          players = [players]
        }
        let emitData = {players: {}, bunkerData: {}, logsData: {}}
        for (let player of players) {
          if (makeId===0 || makeId===2) {
            
            let data = JSON.parse(player[chartName])
            lastVar[player.userId] = structuredClone(data)
            data.text = 'Пусто'
            data.id = 0
            player[chartName] = JSON.stringify(data)
            await player.save()
            if (data.isOpen) {
              emitData.players[player.userId] = {[chartName]: data}
            }
            else {
              io.to(`user:${player.userId}:${idRoom}`).emit('setAllGameData',
                {players: {[player.userId]: {[chartName]: data}}})
            }
          }
          else {
            let data = JSON.parse(player[chartName])
            lastVar[player.userId] = structuredClone(data)
            if (data.text==='Пусто') {
              socket.emit("setError",
                {
                  message: "Нельзя перенести пустоту",
                  status: 400,
                  functionName: 'deleteRelocate'
                })
              return
            }
          //  console.log(chartName, data.text)
            gameRoom.bunkerItemsOthers = `${gameRoom.bunkerItemsOthers},${data.text}`
          //  console.log(gameRoom.bunkerItemsOthers)
            data.text = 'Пусто'
            data.id = 0
            player[chartName] = JSON.stringify(data)
            await player.save()
            await gameRoom.save()
            if (data.isOpen) {
              emitData.players[player.userId] = {[chartName]: data}
            }
            else {
              io.to(`user:${player.userId}:${idRoom}`).emit('setAllGameData',
                {players: {[player.userId]: {[chartName]: data}}})
            }
            let bunkerChart = await UserModel.ChartBunker.findAll(
              {where: {id: [gameRoom.bunkerItems1, gameRoom.bunkerItems2, gameRoom.bunkerItems3]}})
           // console.log('BUNKER', bunkerChart)
            let bunkerItems = []
            for (let chart of bunkerChart) {
              bunkerItems.push(chart.text)
            }
           // console.log('ПРОВЕРКА НА ИТЕМЫ', bunkerItems,
           //   gameRoom.bunkerItemsOthers.split(',').filter(item => item.length>0))
            bunkerItems = [...bunkerItems, ...gameRoom.bunkerItemsOthers.split(',').filter(item => item.length>0)]
            
            
            emitData.bunkerData = {bunkerItems: bunkerItems}
          }
          
        }
        await UserModel.Logi.create({
          idRoom: idRoom,
          funcName: `deleteRelocate:${makeFuncName}`,
          text: textForLog,
          step: await playerDataService.howStepLog(idRoom),
          lastVar: JSON.stringify(lastVar)
        })
        emitData.logsData.value = textForLog
        emitData.logsData.type = 'text'
        emitData.logsData.date = new Date()
        emitData.showCancelButton = true
        io.in([idRoom, `watchers:${idRoom}`]).emit('setAllGameData', emitData)
        io.in(idRoom).emit('sendMessage:timer', {
            title: 'Сообщение от ведущего',
            message: emitData.logsData.value,
            color: 'green'
          }
        )
        
      })
      socket.on('exchangeChart', async (playerId1, playerId2, chartId) => {
        let chartArray = ['sex', 'body', 'trait', 'profession', 'health', 'hobbies', 'phobia', 'inventory', 'backpack', 'addInfo']
        let nameChartArray = ['Пол', 'Телосложение', 'Человеческая черта', 'Профессия', 'Здоровье', 'Хобби', 'Фобия', 'Инвентарь', 'Рюкзак', 'Доп. сведение']
        if (chartId>10 || chartId<0) {
          socket.emit("setError",
            {
              message: "Такой характеристики не существует",
              status: 400,
              functionName: 'exchangeChart'
            })
          return
        }
        let nameChart = nameChartArray[chartId]
        let gameRoom = await UserModel.GameRooms.findOne({where: {idRoom: idRoom}})
        let chartName = chartArray[chartId]
        let textForLog = ''
        let lastVar = {}
        let emitData = {players: {}, logsData: {}}
        if (playerId1===0) {
          textForLog = `Ведущий совершил обмен характристикой ${nameChart} между всеми игроками`
          let players = await UserModel.RoomSession.findAll({
            attributes: ['userId', `${chartName}`, 'id'],
            where: {gameRoomId: gameRoom.id, isAlive: 1, isPlayer: 1}
            
          })
          if (players.length<1) {
            socket.emit("setError",
              {
                message: "Выживших игроков нет",
                status: 400,
                functionName: 'ByHour'
              })
            return
          }
          let data = await playerDataService.exchangeChart(players, chartName)
          for (let player of players) {
            if (data.players[player.userId]) {
              io.to(`user:${player.userId}:${idRoom}`).emit('setAllGameData',
                {players: {[player.userId]: data.players[player.userId]}})
            }
          }
          emitData.players = data.emitData
          lastVar = data.lastVar
        }
        else {
          if (playerId1===playerId2) {
            socket.emit("setError",
              {
                message: "Нельзя совершить обмен у самого себя!",
                status: 400,
                functionName: 'exchangeChart'
              })
            return
          }
          textForLog = `Ведущий совершил обмен характеристикой между игроком ${await ioUserService.getNickname(
            playerId1)} и игроком ${await ioUserService.getNickname(playerId2)}`
          let player1 = await UserModel.RoomSession.findOne({
            attributes: ['id', `${chartName}`],
            where: {gameRoomId: gameRoom.id, isAlive: 1, isPlayer: 1, userId: playerId1}
          })
          let player2 = await UserModel.RoomSession.findOne({
            attributes: ['id', `${chartName}`],
            where: {gameRoomId: gameRoom.id, isAlive: 1, isPlayer: 1, userId: playerId2}
          })
          if (!player1 || !player2) {
            socket.emit("setError",
              {
                message: "Ошибка с пользователями!",
                status: 400,
                functionName: 'exchangeChart'
              })
            return
            
          }
          
          let playerData1 = JSON.parse(player1[chartName])
          let playerData2 = JSON.parse(player2[chartName])
          lastVar.chartName = chartName
          lastVar[playerId1] = structuredClone(playerData1)
          lastVar[playerId2] = structuredClone(playerData2)
          playerData1 = structuredClone(lastVar[playerId2])
          playerData2 = structuredClone(lastVar[playerId1])
          player1[chartName] = JSON.stringify(playerData1)
          player2[chartName] = JSON.stringify(playerData2)
          await player1.save()
          await player2.save()
          if (playerData1.isOpen) {
            emitData.players[playerId1] = {[chartName]: playerData1}
          }
          else {
            io.to(`user:${playerId1}:${idRoom}`).emit('setAllGameData',
              {players: {[playerId1]: {[chartName]: playerData1}}})
          }
          if (playerData2.isOpen) {
            emitData.players[playerId2] = {[chartName]: playerData2}
          }
          else {
            io.to(`user:${playerId2}:${idRoom}`).emit('setAllGameData',
              {players: {[playerId2]: {[chartName]: playerData2}}})
          }
          
        }
        await UserModel.Logi.create({
          idRoom: idRoom,
          funcName: `exchangeChart`,
          text: textForLog,
          step: await playerDataService.howStepLog(idRoom),
          lastVar: JSON.stringify(lastVar)
        })
        emitData.logsData.type = 'text'
        emitData.logsData.value = textForLog
        emitData.logsData.date = new Date()
        emitData.showCancelButton = true
        io.in([idRoom, `watchers:${idRoom}`]).emit('setAllGameData', emitData)
        io.in(idRoom).emit('sendMessage:timer', {
            title: 'Сообщение от ведущего',
            message: textForLog,
            color: 'green'
          }
        )
        
      })
      socket.on('transferHost', async (playerId) => {
        
        let gameRoom = await UserModel.GameRooms.findOne({where: {idRoom: idRoom}})
        let newHost = await UserModel.RoomSession.findOne({where: {userId: playerId, gameRoomId: gameRoom.id}})
        if (!newHost) {
          socket.emit("setError",
            {
              message: "Такого пользователя нет в игре",
              status: 400,
              functionName: 'transferHost'
            })
          return
          
        }
        let textForLog = `Ведущий передал свои права игроку ${await ioUserService.getNickname(playerId)} `
        let lastVar = gameRoom.hostId
        gameRoom.hostId = playerId
        await gameRoom.save()
        await UserModel.Logi.create({
          idRoom: idRoom,
          funcName: `transferHost`,
          text: textForLog,
          step: 0,
          lastVar: JSON.stringify(lastVar)
        })
        io.in([idRoom, `watchers:${idRoom}`]).emit('setAwaitRoomData', {
          hostId: +playerId
        })
        io.in([idRoom, `watchers:${idRoom}`]).emit('setAllGameData', {
          logsData: {
            type:
              'text', value: textForLog, date: new Date()
          }
        })
        io.in(idRoom).emit('sendMessage:timer', {
            title: 'Сообщение от ведущего',
            message: textForLog,
            color: 'green'
          }
        )
        
      })
      socket.on('refresh:ByHour', async (chartId, makeId) => {
        // console.log('MAKE', makeId, chartId)
        let makeArray = ['по часовой стрелке', 'против часовой стрелке']
        if (makeId>1 || makeId<0) {
          socket.emit("setError",
            {
              message: "Такого действия не существует",
              status: 400,
              functionName: 'exchangeChart'
            })
          return
        }
        let makeName = makeArray[makeId]
        let chartArray = ['sex', 'body', 'trait', 'profession', 'health', 'hobbies', 'phobia', 'inventory', 'backpack', 'addInfo']
        let nameChartArray = ['Пол', 'Телосложение', 'Человеческая черта', 'Профессия', 'Здоровье', 'Хобби', 'Фобия', 'Инвентарь', 'Рюкзак', 'Доп. информация']
        let nameChart = nameChartArray[chartId]
        if (chartId>9 || chartId<0) {
          socket.emit("setError",
            {
              message: "Такой характеристики не существует",
              status: 400,
              functionName: 'ByHour'
            })
          return
        }
        let chartName = chartArray[chartId]
        let gameRoom = await UserModel.GameRooms.findOne({where: {idRoom: idRoom}})
        let userList = JSON.parse(gameRoom.userList)
        let players = await UserModel.RoomSession.findAll({
          where: {
            gameRoomId: gameRoom.id,
            isPlayer: 1,
            isAlive: 1
          }
        })
        if (players.length<1) {
          socket.emit("setError",
            {
              message: "Выживших игроков нет",
              status: 400,
              functionName: 'ByHour'
            })
          return
        }
        let notAlivePlayer = await UserModel.RoomSession.findAll({
          where: {
            gameRoomId: gameRoom.id,
            isPlayer: 1,
            isAlive: 0
          }
        })
        //  console.log(notAlivePlayer)
        if (notAlivePlayer) {
          for (let player of notAlivePlayer) {
            let index = userList.indexOf(player.userId)
            userList.splice(index, 1)
          }
        }
        //  console.log(players)
        let lastVar = {}
        lastVar.chartName = chartName
        let emitData = {players: {}, logsData: {}}
        if (makeId===0) {
          let dataForNextPlayer = {}
          
          let vars = {}
          let zeroPlayer = players.find(item => item.userId===userList[0])
          let lastPlayer = players.find(item => item.userId===userList[userList.length - 1])    //players[players.length - 1]
          let playerProfessionData = JSON.parse(lastPlayer[chartName])
          dataForNextPlayer = JSON.parse(zeroPlayer[chartName])
          playerProfessionData.isOpen = dataForNextPlayer.isOpen
          vars.id = dataForNextPlayer.id
          vars.text = dataForNextPlayer.text
          if (chartName==='profession') {
            vars.description = dataForNextPlayer.description
          }
          //  console.log(vars)
          lastVar[zeroPlayer.userId] = structuredClone(vars)
          //  console.log(lastVar)
          vars.id = playerProfessionData.id
          vars.text = playerProfessionData.text
          if (chartName==='profession') {
            vars.description = playerProfessionData.description
          }
          // console.log(vars)
          lastVar[lastPlayer.userId] = structuredClone(vars)
          // console.log(lastVar)
          if (playerProfessionData.isOpen) {
            //  console.log("isOpen", players[0].userId)
            emitData.players[zeroPlayer.userId] = {[chartName]: playerProfessionData}
          }
          else {
            io.to(`user:${zeroPlayer.userId}:${idRoom}`).emit('setAllGameData',
              {players: {[zeroPlayer.userId]: {[chartName]: playerProfessionData}}})
          }
          zeroPlayer[chartName] = JSON.stringify(playerProfessionData)
          await zeroPlayer.save()
          
          for (let i = 1; i<players.length; i++) {
            let player = players.find(item => item.userId===userList[i])
            let data = JSON.parse(player[chartName])
            dataForNextPlayer.isOpen = data.isOpen
            vars.id = data.id
            vars.text = data.text
            if (chartName==='profession') {
              vars.description = data.description
            }
            lastVar[player.userId] = structuredClone(vars)
            
            if (data.isOpen) {
              //   console.log("isOpen", player.userId)
              emitData.players[player.userId] = {[chartName]: dataForNextPlayer}
            }
            else {
              // console.log('!open')
              io.to(`user:${player.userId}:${idRoom}`).emit('setAllGameData',
                {players: {[player.userId]: {[chartName]: dataForNextPlayer}}}
              )
            }
            player[chartName] = JSON.stringify(dataForNextPlayer)
            await player.save()
            
            dataForNextPlayer = structuredClone(data)
          }
        }
        else {
          //    console.log(makeId, 'PRISHLO')zs
          let dataForNextPlayer = {}
            //let userList = JSON.parse(gameRoom.userList)
          let vars = {}
          let zeroPlayer = players.find(item => item.userId===userList[userList.length - 1])
          let lastPlayer = players.find(item => item.userId===userList[0])
          let playerProfessionData = JSON.parse(lastPlayer[chartName])
          dataForNextPlayer = JSON.parse(zeroPlayer[chartName])
          playerProfessionData.isOpen = dataForNextPlayer.isOpen
          vars.id = dataForNextPlayer.id
          vars.text = dataForNextPlayer.text
          if (chartName==='profession') {
            vars.description = dataForNextPlayer.description
          }
          
          lastVar[zeroPlayer.userId] = structuredClone(vars)
          vars.id = playerProfessionData.id
          vars.text = playerProfessionData.text
          if (chartName==='profession') {
            vars.description = playerProfessionData.description
          }
          lastVar[lastPlayer.userId] = structuredClone(vars)
          if (playerProfessionData.isOpen) {
            //   console.log('OPEN')
            //   console.log("isOpen", players[zeroPlayer.userId)
            emitData.players[zeroPlayer.userId] = {[chartName]: playerProfessionData}
          }
          else {
            //   console.log('!OPEN')
            // let player = players[players.length - 1]
            io.to(`user:${zeroPlayer.userId}:${idRoom}}`).emit('setAllGameData',
              {players: {[zeroPlayer.userId]: {[chartName]: playerProfessionData}}})
          }
          zeroPlayer[chartName] = JSON.stringify(playerProfessionData)
          await zeroPlayer.save()
          //  console.log(players.length)
          for (let i = players.length - 2; i>=0; i--) {
            // console.log('!!!!!!!!!!!!!!!!!!!!!!!!!')
            // console.log(players)
            //  console.log(players.length)
            let player = players.find(item => item.userId===userList[i])
            //  console.log(player)
            //  console.log(chartName)
            let data = JSON.parse(player[chartName])
            dataForNextPlayer.isOpen = data.isOpen
            vars.id = data.id
            vars.text = data.text
            if (chartName==='profession') {
              vars.description = data.description
            }
            lastVar[player.userId] = structuredClone(vars)
            //  console.log(data)
            if (data.isOpen) {
              //  console.log("isOpen", player.userId)
              emitData.players[player.userId] = {[chartName]: dataForNextPlayer}
            }
            else {
              // console.log('NOTOPEN')
              io.to(`user:${player.userId}:${idRoom}`).emit('setAllGameData',
                {players: {[player.userId]: {[chartName]: dataForNextPlayer}}}
              )
            }
            player[chartName] = JSON.stringify(dataForNextPlayer)
            await player.save()
            
            dataForNextPlayer = structuredClone(data)
          }
        }
     //   console.log(lastVar)
        await UserModel.Logi.create({
          idRoom: idRoom,
          funcName: `ByHour`,
          text: `Ведущий изменил ${nameChart} ${makeName}`,
          step: await playerDataService.howStepLog(idRoom),
          lastVar: JSON.stringify(lastVar)
        })
        emitData.logsData.type = 'text'
        emitData.logsData.value = `Ведущий изменил ${nameChart} ${makeName}`
        emitData.logsData.date = new Date()
        emitData.showCancelButton = true
        io.in([idRoom, `watchers:${idRoom}`]).emit('setAllGameData', emitData)
        io.in(idRoom).emit('sendMessage:timer', {
            title: 'Сообщение от ведущего',
            message: emitData.logsData.value,
            color: 'green'
          }
        )
      })
      socket.on('refresh:SetNull', async (makeId) => {
        let arrayMake = ['«Аннулировать всем профессию»', '«Аннулировать всем Хобби»']
        if (makeId>1 || makeId<0) {
          socket.emit("setError",
            {
              message: "Такого действия не существует",
              status: 400,
              functionName: 'SetNull'
            })
          return
        }
        let makeName = arrayMake[makeId]
        let gameRoom = await UserModel.GameRooms.findOne({where: {idRoom: idRoom}})
        let players = await UserModel.RoomSession.findAll({where: {gameRoomId: gameRoom.id, isPlayer: 1, isAlive: 1}})
        if (players.length<1) {
          socket.emit("setError",
            {
              message: "Выживших игроков нет",
              status: 400,
              functionName: 'ByHour'
            })
          return
        }
        let lastVar = {}
        let chartName = ''
        let varText = ''
        if (makeId===0) {
          chartName = 'profession'
          varText = 'Без профессии'
        }
        else {
          chartName = 'hobbies'
          varText = 'Отсутствует'
        }
        lastVar.chartName = chartName
        let emitData = {players: {}, logsData: {}}
        for (let player of players) {
          let vars = {}
          
          let data = JSON.parse(player[chartName])
          vars.id = data.id
          vars.text = data.text
          if (makeId===0) {
            vars.description = data.description
            data.description = ''
          }
          
          lastVar[player.userId] = vars
          data.text = varText
          data.id = 0
          
          player[chartName] = JSON.stringify(data)
          //console.log(player.userId)
          await player.save()
        //  console.log(data)
          if (data.isOpen) {
            //  console.log("player.userId", player.userId)
            
            emitData.players[player.userId] = {[chartName]: data}
          }
          else {
            //  cosnole.log('NOTOPEN', data)
            io.to(`user:${player.userId}:${idRoom}`).emit('setAllGameData',
              {players: {[player.userId]: {[chartName]: data}}})
          }
        }
        await UserModel.Logi.create({
          idRoom: idRoom,
          funcName: `SetNull`,
          text: `Ведущий применил функцию ${makeName}`,
          step: await playerDataService.howStepLog(idRoom),
          lastVar: JSON.stringify(lastVar)
        })
        emitData.logsData.type = 'text'
        emitData.logsData.value = `Ведущий применил функцию ${makeName}`
        emitData.logsData.date = new Date()
        emitData.showCancelButton = true
        io.in([idRoom, `watchers:${idRoom}`]).emit('setAllGameData', emitData)
        io.in(idRoom).emit('sendMessage:timer', {
            title: 'Сообщение от ведущего',
            message: emitData.logsData.value,
            color: 'green'
          }
        )
      })
      socket.on('reverseLog', async () => {
        let gameRoom = await UserModel.GameRooms.findOne({where: {idRoom: idRoom}})
        let log = await UserModel.Logi.findOne(
          {where: {idRoom: idRoom, step: await playerDataService.howStepLog(idRoom) - 1}})
        if (log.isBack) {
          socket.emit("setError",
            {
              message: "Нельзя отменить действие, тк вы его еще не совершили",
              status: 400,
              functionName: 'reverseLog'
            })
          return
        }
        let textForLog = `Ведущий отменил последнее действие "${log.text}"`
        let emitData = await ioUserService.reversLog(log, gameRoom, idRoom, io)
     //   console.log('Socket', emitData)
        log.isBack = 1
        await log.save()
       //   console.log(emitData)
        emitData.logsData.type = 'text'
        emitData.logsData.value = textForLog
        emitData.logsData.date = new Date()
        emitData.showCancelButton = false
       // console.log(emitData)
        await UserModel.Logi.create({
                  idRoom: idRoom,
                  funcName: `reverseLog`,
                  text: textForLog,
                  step: 0
                })
        io.in([idRoom, `watchers:${idRoom}`]).emit('setAllGameData', emitData)
        io.in(idRoom).emit('sendMessage:timer', {
            title: 'Сообщение от ведущего',
            message: textForLog,
            color: 'green'
          }
        )
      })
    }
  )
}