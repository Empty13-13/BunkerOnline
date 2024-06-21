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
  const admin = io.of("/admin")
  
  admin.use(async (socket, next) => {
    console.log('ADMIN IO')
    let adminId = null
    let token = socket.handshake.auth.token
    let idRoom = socket.handshake.auth.idRoom
    if (token) {
      console.log('Join to Token trigger')
      console.log(token)
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
      adminId = userData.id
      const user = await UserModel.User.findOne({where: {id: adminId, accsessLevel: 'admin'}})
      if (!user) {
        next(new Error("Accsess denied"))
      }
      
    }
    else {
      next(new Error("Accsess denied"))
    }
    
    console.log('Accsess DONE ADMIN')
    socket.data.adminId = adminId
    next()
  })
  
  admin.on('connection', async socket => {
      let adminId = socket.data.adminId
      let idRoom = socket.handshake.auth.idRoom
      console.log('Коннект есть')
      socket.on('banUser', async (userId) => {
        console.log(userId)
        console.log('ADMINNNN')
        let isUser = await UserModel.User.findOne({where: {id: userId}})
        if (!isUser) {
          return
        }
        let isBlock = await UserModel.BlackListUsers.findOne({where: {userId: userId}})
        for (let room of io.sockets.adapter.rooms) {
          if (room[0].includes(`user:${userId}`)) {
            //Console.log('room',room[1])
            io.to(room[0]).emit('setError', {
              message: 'Ваш аккаунт был забанен за нарушение правил. Для уточнения вопроса обратитесь к администрации сайта',
              status: 469,
            })
            io.to(room[0]).disconnectSockets(true)
          }
        }
        
        console.log('ADMINNNNNN3', io.sockets.adapter.rooms)
      })
      socket.on('sendMessage', async (userId, title, textMessage) => {
        console.log('ПРИШЛО1')
        let gameRoom = await UserModel.GameRooms.findOne({where: {idRoom: idRoom}})
        
        console.log('ПРИШЛО')
        if (+userId===0) {
          let players = await UserModel.RoomSession.findAll({where: {gameRoomId: gameRoom.id}})
          if (!players) {
            socket.emit("setError",
              {message: "В этой игре нет игроков", status: 400, functionName: 'sendMessage'})
            return
          }
          io.in(idRoom).emit('sendMessage', {
              title: title,
              message: textMessage,
              color: 'gold'
            }
          )
        }
        else {
          let player = await UserModel.RoomSession.findOne({where: {userId: userId, gameRoomId: gameRoom.id}})
          if (!player) {
            socket.emit("setError",
              {message: "Такого игрока нет в игре", status: 400, functionName: 'sendMessage'})
            return
          }
          io.in(`user:${userId}:${idRoom}`).emit('sendMessage', {
              title: title,
              message: textMessage,
              color: 'gold'
            }
          )
        }
        socket.emit('sendMessage:timer', {
            title: 'Сообщение от разработчиков',
            message: 'Сообщение успешно отправлено',
            color: 'green'
          }
        )
        
      })
      socket.on('closeRoom', async () => {
        await ioUserService.deleteRoomFromDB(idRoom)
        
        console.log('RoomClose делаем')
        io.in(idRoom).emit('roomClosed', {message: 'Комната успешно удалена', status: 200})
        io.in(idRoom).disconnectSockets(true);
      })
    }
  )
}