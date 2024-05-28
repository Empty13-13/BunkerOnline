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
      
      
    }
  )
}