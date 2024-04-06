//const {io} = require('../index')
//const users = io.of("/users")
const uuid = require('uuid')
const tokenService = require('../service/token-service')
const ApiError = require('../exceptions/api-error')
const {logger} = require("sequelize/lib/utils/logger");
const UserModel = require('../model/models')

module.exports = function(io) {
  io.on('connection', async socket => {
    // console.log(io)
    let token = socket.handshake.auth.token
    let noRegToken = socket.handshake.auth.noregToken
    let idRoom = socket.handshake.auth.idRoom
    
    if (!socket.handshake.auth.noregToken) {
      //Создавай новый токен и клади его в БД
      
      noRegToken = uuid.v4()
      socket.emit('setNoregToken', noRegToken)
      let newNoRegUser = await UserModel.NoRegUsers.create({noRegToken: noRegToken})
    }
    
    // io.join(`user:${userId}`)
    
    console.log(`${socket.id} user connected`)
    socket.on('createRoom', async () => {
      let isReg = false
      
      //Проверка на валидность noregToken
      const isValidNoRegToken = await UserModel.NoRegUsers.findOne({where: {noRegToken: noRegToken}})
      if (!isValidNoRegToken) {
        socket.emit("setError",
          {message: `Произошла ошибка. Пожалуйста перезагрузите страницу`, status: 403, functionName: 'createRoom'})
        return
      }
      
      //Проверка на валидность accessToken
      if (token) {
        const userData = tokenService.validateAccessToken(token)
        if (!userData) {
          socket.emit("setError",
            {
              message: `Сервер не смог подтвердить вашу личность. Пожалуйста перезагрузите страницу или перезайдите в аккаунт`,
              status: 403,
              functionName: 'createRoom'
            })
          console.log('Невалидный токен')
          return
        }
        //Если ошибок нет, значит это зареганый пользователь
        isReg = true
      }
      
      if (isReg) {
        //TODO: Что-то сделать с accessToken (например, записать в ведущие)
      }
      else {
        //TODO: Что-то сделать с noregToken (например, записать в ведущие)
      }
      
      //Если ни одной ошибки не словило, значит в любом случае добавляем его в комнату
      socket.join(idRoom)
      
      //Сообщаем client что комната создалась успешно
      socket.emit('joinedRoom', {message: 'Комната успешно создана', status: 201})
      
      console.log(io.sockets.adapter.rooms)
    })
    
    socket.on('joinRoom', async () => {
      /*
      TODO: Делаем проверку в БД, началась ли игра и существует ли она вообще.
        Если игра началась, тогда проверяем был ли пользователь в игре.
          Если был - тогда подключаем снова к игре и показываем его что он снова активный
          Если не был - отдаем общую инфу об игре
       Если игра Не началась, тогда подключаем игрока к комнате.
       */
      
      //Дальше идут примерные данные (пока примерно для фронта накидал)
      let isStarted = false
      let isConnectedBefore = false
      
      //Пример собранных данных. Либо просто data = null
      let awaitRoomData = getAwaitRoomTemporaryData()
      // let awaitRoomData = null
      
      
      if(!isRoomCreated(io,idRoom)){
        socket.emit("setError",
          {message: "Комнаты не существует", status: 404, functionName: 'joinRoom'})
        return
      }
      
      if(isStarted) {
        /*
        Если игра началась, то в любом случае подключаем пользователя. Либо как игрока, если он
        был до этого в игре (и тогда обновляем всем находящимся в игре данные, чтобы подгрузить нужную
        инфу о снова присоединившемся пользователе)
        Либо как смотрящего, тогда просто даем этому смотрящему общую инфу.
        
        В любом случае функция getAllGameData будет принимать токены и с помощью них смотреть какую конкретно
        инфу нужно выдать пользователю
         */
        
        socket.join(idRoom)
        
        if(isConnectedBefore) {
          socket.in(idRoom).emit('getAllGameData')
        } else {
          socket.emit('getAllGameData')
        }
      } else {
        if(awaitRoomData){
          socket.join(idRoom)
          socket.emit('joinedRoom', {message: 'Вы успешно подключились к комнате', status: 201})
        } else {
          socket.emit("setError",
            {message: "Комната создана, но данные пока что не загружены. Попробуйте попозже", status: 406, functionName: 'joinRoom'})
        }
      }
      
    })
    
    socket.on('getAwaitRoomData', () => {
      let data = null
      
      //TODO:Собираем основные данные об игре (Ники игроков, id ведущего, началась ли игра), если они вообще есть
      //  Все таки нужно эту инфу в БД хранить и оттуда же доставать
      
      //Ниже идет временная заглушка для фронта
      data = isRoomCreated(io,idRoom)
      
      socket.emit('setAwaitRoomData', data)
      console.log(io.sockets.adapter.rooms)
    })
    
    
    socket.on('disconnect', (reason) => {
      console.log("DISCONNECT")
      //socket.disconnect()
    })
    
    
    console.log(io.sockets.adapter.rooms)
  })
}

const getAwaitRoomTemporaryData = () => {
  return {
    isStarted: false,
    idHost: 1,
    users: ['Виктор, Максим, Ева, Лиза'],
  }
}

/**
 * @description Узнать, существует ли комната. Временная функция для фронта
 * @param io
 * @param idRoom
 * @returns {null,object}
 */
function isRoomCreated(io,idRoom) {
  let data = null
  for (const room of io.sockets.adapter.rooms) {
    if (room[0]===idRoom) {
      //Пример собранных данных. Либо просто data = null
      data = getAwaitRoomTemporaryData()
      break
    }
  }
  
  return data
}