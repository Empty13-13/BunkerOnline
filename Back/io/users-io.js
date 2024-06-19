//const {io} = require('../index')
//const users = io.of("/users")
const uuid = require('uuid')
const tokenService = require('../service/token-service')
const ApiError = require('../exceptions/api-error')
const {logger} = require("sequelize/lib/utils/logger");
const UserModel = require('../model/models')
const ioUserService = require('../service/io-user-service')
const playerDataService = require('../service/playerData-service')
const {Op} = require('sequelize')


module.exports = function(io) {
  io.on('connection', async socket => {
    let data = await ioUserService.validateToken(socket)
    let isValidateId = null
    let idRoom = null
    let watchersCount = 0
    if (data) {
      isValidateId = data.isValidateId
      idRoom = data.idRoom
    }
    if (!isValidateId || !idRoom) {
      // socket.emit("setError",
      //   {message: `Произошла ошибка. Пожалуйста перезагрузите страницу`, status: 400, functionName: 'connection'})
      return
    }
    
    socket.emit('connection:good')
    
    socket.join(`user:${isValidateId}:${idRoom}`)
    
    // console.log('DICKPICK',socket)
    
    
    console.log(`${socket.id} user connected with userId ${isValidateId}`)
    socket.on('createRoom', async () => {
      // let isReg = false
      
      let isRooms = await UserModel.GameRooms.findOne({where: {idRoom: idRoom}})
      // console.log(idRoom, isRooms)
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
      
      // console.log(io.sockets.adapter.rooms)
    })
//========================================================================================================================================================
    socket.on('joinRoom', async () => {
      //await changeNoregIdToRegId(socket)
      let GameData = await ioUserService.getValidateGameData(idRoom, socket, io, isValidateId)
      if (!GameData) {
        return
      }
      
      if (GameData.isStarted) {
        ioUserService.joinRoomAndWatchTimer(socket, idRoom)
        
        if (GameData.isPlayingBefore) {
          let data = await playerDataService.joinGameData(idRoom, isValidateId)
          socket.join(idRoom)
          socket.emit('updateInitialInfo')
          socket.emit('startedGame')
          socket.emit('setAllGameData', data)
        }
        else {
          if (GameData.isHidden) {
            socket.emit("setError",
              {message: "Комнаты не существует", status: 404, functionName: 'joinRoom'})
            io.in(socket.id).disconnectSockets(true);
            return
          }
          let data = await playerDataService.joinGameData(idRoom, isValidateId, true)
          socket.join(`watchers:${idRoom}`)
          socket.emit('sendMessage',
            //`Игра уже началась. На данный момент вы являетесь наблюдателем`
            {message: `Игра уже началась. На данный момент вы являетесь наблюдателем`})
          socket.emit('startedGame')
          GameData.watchersCount += 1
          watchersCount = GameData.watchersCount
          socket.to(idRoom).emit('setAwaitRoomData', {watchersCount: GameData.watchersCount})
          // delete GameData.hostId
          socket.emit('setAwaitRoomData', GameData)
          socket.emit('setAllGameData', data)
        }
      }
      else {
        if (GameData) {
          ioUserService.joinRoomAndWatchTimer(socket, idRoom)
          
          if (GameData.isPlayingBefore) {
            socket.join(idRoom)
            socket.emit('setAwaitRoomData', GameData)
            // socket.emit('joinedRoom', {message: 'Вы успешно подключились к комнате', status: 201})
          }
          else if (GameData.countPlayers<15) {
            let gameRoom = await UserModel.GameRooms.findOne({where: {idRoom: idRoom}})
            await UserModel.RoomSession.create({gameRoomId: gameRoom.id, userId: isValidateId})
            GameData.players.push(await ioUserService.getIdAndNicknameFromUser(isValidateId))
            
            socket.join(idRoom)
            socket.to(idRoom).emit('setAwaitRoomData', {players: GameData.players})
            socket.emit('joinedRoom', {message: 'Вы успешно подключились к комнате', status: 201})
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
            GameData.watchersCount += 1
            watchersCount = GameData.watchersCount
            socket.to(idRoom).emit('setAwaitRoomData', {watchersCount: GameData.watchersCount})
            socket.emit('setAwaitRoomData', GameData)
          }
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
    
    socket.on('disconnecting', (reason) => {
      ioUserService.disconnectAndSetTimer(io, socket, idRoom)
      watchersCount -= 1
      io.in(idRoom).emit('setAwaitRoomData', {watchersCount})
    })
    
    socket.on('disconnect', (reason, details) => {
      io.in(idRoom)
    })
    socket.on('openChart', async (chartName) => {
      
      if (chartName) {
        
        let game = await UserModel.GameRooms.findOne({where: {idRoom: idRoom}})
        
        if (game && game.isStarted===1) {
          let player = await UserModel.RoomSession.findOne({where: {userId: isValidateId, gameRoomId: game.id}})
          if(!player.isAlive || !player.isPlayer){
             socket.emit("setError",
                        {
                          message: "Вы не можете открывать характеристики по причине: Вас изгнали/вы не игрок",
                          status: 400,
                          functionName: 'openChart'
                        })
                      return
          }
          if (player[chartName]) {
            let emitData = {}
            let data = JSON.parse(player[chartName])
            let usePack = JSON.parse(player.usePack)
            console.log(usePack, usePack[0], usePack.includes(1))
            if (!data.isOpen) {
              data.isOpen = true
              emitData = data
            }
            else {
              data.isOpen = false
              emitData.isOpen = false
              
            }
            player[chartName] = JSON.stringify(data)
            await player.save()
            socket.emit('openChart:good', chartName)
            io.in(idRoom).emit('setAllGameData', {players: {[isValidateId]: {[chartName]: emitData}}})
            
          }
          else {
            socket.emit("setError",
              {
                message: "Ошибка с данными",
                status: 601,
                functionName: 'openChart',
                wrongData: {playerId: isValidateId, chartName: chartName}
              })
            
          }
          
        }
        else {
          socket.emit("setError",
            {
              message: "Игра не началась, либо комнаты не существует",
              status: 601,
              functionName: 'openChart',
              wrongData: {playerId: isValidateId, chartName: chartName}
            })
        }
      }
      else {
        socket.emit("setError",
          {
            message: "Ошибка с данными(Данные пустые)",
            status: 601,
            functionName: 'openChart',
            wrongData: {playerId: isValidateId, chartName: chartName}
          })
      }
      
      
    })
    socket.on('refreshChartMVP', async (chartName) => {
      if (isValidateId>0) {
        let user = await UserModel.User.findOne({where: {id: isValidateId}})
        if (user.accsessLevel.toString()==='mvp' || user.accsessLevel.toString()==='admin') {
          if (chartName) {
            let game = await UserModel.GameRooms.findOne({where: {idRoom: idRoom}})
            if (game && game.isStarted===1) {
              let player = await UserModel.RoomSession.findOne({where: {userId: isValidateId, gameRoomId: game.id}})
              if(!player.isAlive || !player.isPlayer){
                           socket.emit("setError",
                                      {
                                        message: "Вы не можете меня характеристики по причине: Вас изгнали/вы не игрок",
                                        status: 400,
                                        functionName: 'refreshChartMVP'
                                      })
                                    return
                        }
              if (player[chartName] && player.isMVPRefresh!==1) {
                let data = await playerDataService.refreshChartMvp(player, chartName, game.id)
                if (data===null) {
                  socket.emit("setError",
                    {
                      message: "Вы не можете сменить спец.возможность, тк уже открыли ее",
                      status: 602,
                      functionName: 'refreshChartMVP',
                      wrongData: {playerId: isValidateId, chartName: chartName}
                    })
                  return
                }
                let lastVar = JSON.stringify({chartName: chartName, lastVar: JSON.parse(player[chartName]).text})
                player[chartName] = JSON.stringify(data)
                player.isMVPRefresh = 1
                await player.save()
                let user = await UserModel.User.findOne({where: {id: isValidateId}})
                await UserModel.Logi.create({
                  idRoom: idRoom,
                  funcName: 'refreshChartMVP',
                  text: `Пользователь MVP ${user.nickname} изменил характеристику`,
                  userId: isValidateId,
                  lastVar: lastVar,
                  step: 0
                })
                
                if (data.isOpen) {
                  console.log(chartName)
                  io.in(idRoom).emit('setAllGameData', {players: {[isValidateId]: {[chartName]: data}}})
                }
                else {
                  socket.emit('setAllGameData', {players: {[isValidateId]: {[chartName]: data}}})
                }
                io.in(idRoom).emit('setAllGameData',
                  {logsData: [{type: 'text', value: `Пользователь MVP ${user.nickname} изменил характеристику`}]})
                socket.emit('refreshChartMVP:good', chartName)
              }
              else {
                socket.emit("setError",
                  {
                    message: "Ошибка с данными",
                    status: 602,
                    functionName: 'refreshChartMVP',
                    wrongData: {playerId: isValidateId, chartName: chartName}
                  })
              }
            }
            else {
              socket.emit("setError",
                {
                  message: "Игра не началась, либо комнаты не существует",
                  status: 602,
                  functionName: 'refreshChartMVP',
                  wrongData: {playerId: isValidateId, chartName: chartName}
                })
            }
          }
          else {
            socket.emit("setError",
              {
                message: "Ошибка с данными(Данные пустые)",
                status: 602,
                functionName: 'refreshChartMVP',
                wrongData: {playerId: isValidateId, chartName: chartName}
              })
          }
        }
        else {
          socket.emit("setError",
            {
              message: "Ошибка с данными(Данные пустые)",
              status: 602,
              functionName: 'refreshChartMVP',
              wrongData: {playerId: isValidateId, chartName: chartName}
            })
        }
      }
      else {
        socket.emit("setError",
          {
            message: "Acsess Denied",
            status: 602,
            functionName: 'refreshChartMVP',
            wrongData: {playerId: isValidateId, chartName: chartName}
          })
      }
    })
    socket.on('voiting:choiseUser', async (choiseId) => {
      let gameRoom = await UserModel.GameRooms.findOne({where: {idRoom: idRoom}})

      if (gameRoom.voitingStatus===0) {
        let isPlayer = await UserModel.RoomSession.findOne(
          {where: {gameRoomId: gameRoom.id, isPlayer: 1, userId: choiseId, isAlive: 1}})
        if (isPlayer) {
          let player = await UserModel.RoomSession.findOne(
            {
              where:
                {gameRoomId: gameRoom.id, isPlayer: 1, userId: isValidateId}
            })
          console.log('usersIO:isValidateId', isValidateId)
          if (player) {
            if (player.isAlive) {
              if (choiseId!==isValidateId) {
                console.log(choiseId, isValidateId)
                player.votedFor = choiseId
                await player.save()
                socket.emit('voiting:choiseUser:good')
                let allPlayers = await UserModel.RoomSession.findAll({where:{gameRoomId:gameRoom.id,isPlayer:1,isAlive:1}})
                let playerChoise = await UserModel.RoomSession.findAll({where:{gameRoomId:gameRoom.id,isPlayer:1,isAlive:1,votedFor:{[Op.ne]:null}}})
                if(allPlayers.length === playerChoise.length){
                         await ioUserService.finishedVoiting(idRoom,gameRoom.hostId,io,socket)

                      }
              }
              else {
                socket.emit("setError",
                  {
                    message: "Вы не можете голосовать за себя",
                    status: 603,
                    functionName: 'voiting:choiseUser'
                  })
              }
            }
            else {
              socket.emit("setError",
                {
                  message: "Вы не можете голосовать",
                  status: 603,
                  functionName: 'voiting:choiseUser'
                })
              // Ошибка, что игрок уже мертв и не может голосовать
            }
            
          }
          else {
            socket.emit("setError",
              {
                message: "За этого игрока нельзя проголосовать",
                status: 603,
                functionName: 'voiting:choiseUser'
              })
            //Ошибка, что игрок не играет
          }
          
        }
        else {
          socket.emit("setError",
            {
              message: "За этого игрока нельзя проголосовать",
              status: 603,
              functionName: 'voiting:choiseUser'
            })
          // Ошибка, что игрок не действителен, за которого голосуют
          
        }
      }
      else {
        socket.emit("setError",
          {
            message: "Игра не началась, либо комнаты не существует",
            status: 603,
            functionName: 'voiting:choiseUser'
          })
        // Ошибка, что голосвание либо не началось, либо уже закончилось
      }
    })
    
    console.log(io.sockets.adapter.rooms)
  })
}

// {idRoom,step, userId, funcName, lastVar, newVar }
//{'B8FDJ',1,8,'changeBody:health','рост(180)','рост(150)'}
//{'B8FDJ',2,8,null,null,5}
//{'B8FDJ',3,all,'changeBody',{1:'110',-5:'110',3:'120'},{1:'156',-5:'160',3:'180'}}

// {idRoom,step, userId, funcName, lastVar, newVar }
//{'B8FDJ',1,8,'changeBody','рост(180)','рост(150)'}
//{'B8FDJ',1,-5,'changeBody','рост(110)','рост(180)'}


/*
 {idRoom,step, userId, funcName, lastVar, text, isBack }
 {'B8FDJ',1,null,'changeBody:health','рост(180)','Ведущий поменял игроку 123456 стаж профессии',false}
 {'B8FDJ',0,null,'changeBody:health','рост(180)','Игрок MVP 1232 изменил себе здоровье',false}
 {'B8FDJ',2,null,'changeBody:health','рост(180)','Ведущий поменял игроку 123456 стаж профессии',false}
 {'B8FDJ',0,null,'changeBody:health','рост(180)','Игрок MVP 1232 изменил себе здоровье',false}
 {'B8FDJ',10,null,'changeBody:health','рост(180)','Ведущий поменял игроку 123456 стаж профессии',true}
 
 */


//========================================================================================================================================================
// id|idGame|idUser|{sex,0}|{body,1}|trait|{id:0,'Клоун', isOpen: false}|health|hobbies|phobia|inventory|backpack|addInfo|spec1|spec2|isRefreshMVP|isBanished
// JSON.format({id:0,'Клоун', isOpen: false})
// const data = JSON.parse()
//{id:0,'Клоун'}

// roomSession                        - id|userId|gameRoomId|isPlayer|sex|body|height|trait|profession|health|hobbies|phobia|inventory|backpack|addInfo|spec1|spec2
// gameRoom                           - id|idRoom|hostId|isStarted|isHidden|bunkerSize|maxSurvivor|catastrophe|bunkerTime|bunkerLocation|bunkerCreated|bunkerBedroom|bunkerItems|bunkerFood
// Характеристики игрока (заготовки)  - id|nameChart|text
// 10|body|толстый
// Профессии (заготовки)              - id|name|description|minAmateurAge|minInternAge|minMiddleAge|minExperiencedAge|minExpertAge|minProAge

// Характеристики бункера (заготовки) - id|name|text
// Характеристики бункера в паках     - idPack|idGameChart
// характеристики игрока в паках      - idPack|idChart
// профессии в паках                  - idPack|idProfession
// Паки                               - id|namePack|isHidden|status


//====================================================================================
/*
 //////////////////////////////////////////////////////////////////////
 //Сбор данных для игроков и игры
 let dataHostIdPacks = [2,4,5,6]
 {
 Проверка на расширенные или не расширенные паки
 let baseIdPack = [4,5]
 let advanceIdPack = [2,6]
 }
 let packsPlayers = {}
 let usePriorityAccess = false
 
 if(!advanceIdPack.includes(systemPackAdvanced)){
 for(gamer in gamers) {
 if(!(gamer.id<0 || gamer.levelAccess === 'default') &&
 gamer.packs.contains('расширенный')) {
 usePriorityAccess = true
 break;
 }
 }
 }
 
 const baseIdPacks = getDataPack(baseIdPack) //{chartPlayerId:[1,5,19,20....231],chartBunkerId:[1,5,19,20....231],professionId:[1,5,19,20....231]}
 const hostBaseDataPacks = {}
 hostBaseDataPacks['playerData'] = await UserModel.ChartPlayer.findAll({where:{id: baseIdPacks.chartPlayerId}})
 hostBaseDataPacks['bunker'] = await UserModel.ChartBunker.findAll({where:{id: baseIdPacks.chartBunkerId}})
 hostBaseDataPacks['professions'] = await UserModel.Profession.findAll({where:{id: baseIdPacks.professionId}})
 
 const advanceIdPacks = getDataPack(advanceIdPack) //{chartPlayerId:[1,5,19,20....231],chartBunkerId:[1,5,19,20....231],professionId:[1,5,19,20....231]}
 const hostAdvanceDataPacks = {}
 hostAdvanceDataPacks['playerData'] = await UserModel.ChartPlayer.findAll({where:{id: advanceIdPacks.chartPlayerId}})
 hostAdvanceDataPacks['bunker'] = await UserModel.ChartBunker.findAll({where:{id: advanceIdPacks.chartBunkerId}})
 hostAdvanceDataPacks['professions'] = await UserModel.Profession.findAll({where:{id: advanceIdPacks.professionId}})
 
 
 let priorityDataPacks = null
 if(usePriorityAccess){
 systemDataPacks = {}
 const systemIdPacks = getDataPack(systemPackAdvanced) //{chartPlayerId:[1,5,19,20....231],chartBunkerId:[1,5,19,20....231],professionId:[1,5,19,20....231]}
 systemDataPacks['playerData'] = await UserModel.ChartPlayer.findAll({where:{id: systemIdPacks.chartPlayerId}})
 systemDataPacks['professions'] = await UserModel.Profession.findAll({where:{id: systemIdPacks.professionId}})
 return {hostBaseDataPacks,hostAdvanceDataPacks,systemDataPacks}
 }
 return {hostBaseDataPacks,hostAdvanceDataPacks,systemDataPacks}
 
 //////////////////////////////
 //Заполнение данных
 
 const {hostBaseDataPacks,hostAdvanceDataPacks,systemDataPacks} = getAllGameData(users)
 let childFreeCount = 0
 
 for(user in users) {
 //{id:0,'Клоун', isOpen: false}
 let age=null
 let sex=null
 let body=null
 let height=null
 let trait=null
 let health=null
 let hobbies=null
 let phobia=null
 let inventory=null
 let backpack=null
 let addInfo=null
 let spec1=null
 let spec2=null
 let profession=null
 
 age = getRandomInt(16,85)
 sex = !!getRandomInt(0,1)
 let maleSexText = ['Мужчина','(Молодой)']
 let femaleSexText = ['Женщина','(Молодая)']
 if(age>=36 && age<=59) {
 maleSexText[1]='(Взрослый)'
 femaleSexText[1]='(Взрослая)'
 } else  if(age>=60) {
 maleSexText[1]='(Пожилой)'
 femaleSexText[1]='(Пожилая)'
 }
 sex += sex?maleSexText[0]:femaleSexText[0] + ' ' + `${age} ${getAgeText(age)} ` + sex?maleSexText[1]:femaleSexText[1]
 if(!((childFreeCount+1)/users.length*100>25) && getRandomInt(0,100)<=25){
 sex+=' | чайлдфри'
 childFreeCount+=1
 }
 
 body = getRandomData(hostBaseDataPacks,hostAdvanceDataPacks,systemDataPacks,'body')
 trait = getRandomData(hostBaseDataPacks,hostAdvanceDataPacks,systemDataPacks,'trait')
 health = getRandomData(hostBaseDataPacks,hostAdvanceDataPacks,systemDataPacks,'health')
 hobbies = getRandomData(hostBaseDataPacks,hostAdvanceDataPacks,systemDataPacks,'hobby')
 phobia = getRandomData(hostBaseDataPacks,hostAdvanceDataPacks,systemDataPacks,'phobia')
 inventory = getRandomData(hostBaseDataPacks,hostAdvanceDataPacks,systemDataPacks,'inventory')
 backpack = getRandomData(hostBaseDataPacks,hostAdvanceDataPacks,systemDataPacks,'backpack')
 addInfo = getRandomData(hostBaseDataPacks,hostAdvanceDataPacks,systemDataPacks,'addInfo')
 spec1 = getRandomData(hostBaseDataPacks,hostAdvanceDataPacks,systemDataPacks,'spec1')
 spec2 = getRandomData(hostBaseDataPacks,hostAdvanceDataPacks,systemDataPacks,'spec2')
 profession = getRandomData(hostBaseDataPacks,hostAdvanceDataPacks,systemDataPacks,'profession') // ВОТ ЭТА ХУЙНЯ ПОД ВОПРОСОМ!!! Лучше отдельную функцию для профессии сделать
 
 //И дальше нужно записать эту ерунду либо сразу в БД, либо сначала в объект, а потом циклом через объект записать в БД
 //Но один хер тебе нужно всё в объект складывать, чтобы потом мне отдать всё что нужно
 
 
 //Дальше по такому же принципу формируем данные для бункера. Можешь тоже отдельную функцию сделать
 //Или в существующей функции сделать доп проверки которые нужны
 
 //После того как всё создал, нужно всё поместить в результат следующего формата:
 {
 bunker:{bunkerSize:'200кв.м',maxSurvivor:'1 год',...},
 players:{
 //Данные для пользователя, который запрашивает их
 8:{sex:{text:'Мужчина 74 год (Пожилой)',isOpen:false},body:{text:'Хрупкое (Рост: 179 см.)',isOpen:false},...}
 
 //Данные других пользователей (ещё не открытые характеристики просто не отправляешь здесь}
 -12:{sex:{text:'Мужчина 74 год (Пожилой)',isOpen:true},body:{text:'Хрупкое (Рост: 179 см.)',isOpen:true},...}
 }
 }
 
 }
 
 //////////////////////////////////////
 //
 function getRandomData(pack1,priorityPack1,priorityPack2,name) {
 let resultText = ''
 if(name==='spec1' || name==='spec2') {
 name = 'card'
 }
 while(!resultText) {
 let usedPack = getRandomPack(pack1,priorityPack1,priorityPack2)
 if(name==='profession') {
 Проверяем не пустой ли пункт с профессиями у usedPack.professions
 Если есть, тогда записывай в результат и удаляй этот пункт откуда взял, если нет то просто снова делаем цикл
 } else {
 if(usedPack.playerData[name].length) {
 let nameArray = usedPack.playerData.filter(item => item.name===name)
 let index=getRandomInt(0,nameArray.length-1)
 resultText = nameArray[index]
 index = usedPack.playerData.indexOf(nameArray[index])
 
 usedPack.playerData[name].splice(index,1) //Удаляем элемент который взяли (надо загуглить как правильно удалить)
 }
 }
 }
 
 //Ниже идут доп проверки для name
 switch(name){
 case 'body':
 resultText+=` (Рост: ${getRandomInt(minHeight,maxHeight)} см.)`
 break;
 case 'health':
 const diseaseLevels = ['Легкая степень','Средняя степень','Тяжелая степень','Критическая степень']
 resultText += ` ${diseaseLevels[getRandomInt(0,diseaseLevels.length-1)]}`
 break;
 case 'hobby':
 const hobbyLevels = ['Дилетант','Новичок','Любитель','Продвинутый','Мастер (гуру)']
 resultText += ` ${hobbyLevels[getRandomInt(0,hobbyLevels.length-1)]}`
 break;
 case 'profession':
 Либо тут делаем профессию, либо просто отдельную функцию под неё написать
 Потому что нам надо сначала узнать возраст, передать его, и по этому ориентироваться, выбирать
 профессию которую нужно, и только потом дописывать через рандом стаж
 break;
 }
 
 return resultText
 }
 
 function getRandomPack(pack1,priorityPack1,priorityPack2){
 if(getRandomInt(0,100)<=40) {
 return pack1
 } else {
 if(!priorityPack1) {
 return priorityPack2
 }
 if(!priorityPack2) {
 return priorityPack1
 }
 if(getRandomInt(0,100)<=25) {
 return priorityPack1
 } else {
 return priorityPack2
 }
 }
 }
 
 
 
 ////////////////////////////////
 Функция которая в зависимости от числа отдает "год" "года" или "лет"
 
 function getAgeText(age) {
 var txt;
 count = age % 100;
 if (count >= 5 && count <= 20) {
 txt = 'лет';
 } else {
 count = count % 10;
 if (count == 1) {
 txt = 'год';
 } else if (count >= 2 && count <= 4) {
 txt = 'года';
 } else {
 txt = 'лет';
 }
 }
 return txt;
 }
 
 ///////////////////////////////////
 //Функция рандома (min и max - включительно)
 function getRandomInt(min, max) {
 max+=1
 min = Math.ceil(min);
 max = Math.floor(max);
 return Math.floor(Math.random() * (max - min) + min); // Максимум не включается, минимум включается
 }
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 //========================================================================================================================================================
 
 
 
 let resultAdvancedChartPlayerData = null
 
 const resultVimMvpData = null
 if(usePriorityAccess){
 let resultVipMvpIds  = getDataPack(systemPackAdvanced)
 resultAdvancedProfessionData = await UserModel.Profession.findAll({where:{id: resultVipMvpIds.professionId}})
 resultAdvancedBunkerPlayerData = await UserModel.Profession.findAll({where:{id: resultVipMvpIds.professionId}})
 resultAdvancedChartPlayerData = await UserModel.Profession.findAll({where:{id: resultVipMvpIds.professionId}})
 resul
 }
 
 /////////////////////////
 chartBody
 if(usePriority){
 random= 0/100
 if(random >70){
 if(resultAdvancedChartPlayerData.name.include('body')){
 random(resultAdvancedChartPlayerData.['body'])
 return
 }
 else{
 random(resultHostChartPlayerData.['body'])
 return
 }
 }
 }
 random(resultHostChartPlayerData.['body'])
 
 
 packsPlayer[gamer.id] =  [4,8,15]
 }
 
 //{1:[4,8,15],2:[1,2],168:[2,8,15]}
 
 let playersData = []
 const allPacks = [1,2,4,8,15]
 
 hostIdPack = [4,5,6]
 mvpPlayerIdPack = [4,5,6,2]
 
 const resultHost = getDataPack(hostIdPack)
 const resultVipMvp = getDataPack(mvpPlayerIdPack)
 const result = getDataPack(allPacks)//{chartPlayerId:[1,5,19,20....231],chartBunkerId:[1,5,19,20....231],professionId:[1,5,19,20....231]}
 
 const resultDataPlayers = await UserModel.ChartPlayer.findAll({where:{id: result.chartPlayerId}})
 
 
 
 
 
 
 */

/*
 let resultDataPacks = {
 4:{professions:[{0:'IT'},{1:'Дизайнер'},{2:'Верстальщик'}],playerData: {hobby:[],health:[]...},
 5:{professions:[{0:'IT'},{1:'Дизайнер'},{2:'Верстальщик'}],playerData: {hobby:[],health:[]...},
 6:{professions:[{0:'IT'},{1:'Дизайнер'},{2:'Верстальщик'}],playerData: {hobby:[],health:[]...},
 2:{professions:[{0:'IT'},{1:'Дизайнер'},{2:'Верстальщик'}],playerData: {hobby:[],health:[]...},
 }
 //[5,7]
 //[5,7,2]
 //[5,7,2]
 
 const playerPacks = {153:[4,5,6],112:[4,5,6],3:[4,5,6,2],}
 
 for((idPlayer,packs) in playerPacks) {
 let randomId = random(0,resultDataPacks[idPack].professions.length)
 
 
 }
 
 
 */