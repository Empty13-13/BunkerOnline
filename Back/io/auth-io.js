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
  const auth = io.of("/auth")
  
  auth.use(async (socket, next) => {
    let userId = null
    let token = socket.handshake.auth.token
    console.log('MIDLVARA')
    if (token) {
     // console.log('Join to Token trigger')
     // console.log(token)
      const userData = tokenService.validateAccessToken(token)
      if (!userData) {
       // console.log('Haven"t a UserData')
        socket.emit("setError",
          {
            message: `Сервер не смог подтвердить вашу личность. Пожалуйста перезагрузите страницу или перезайдите в аккаунт`,
            status: 403,
            functionName: 'connection'
          })
        console.log('Невалидный токен')
        return null
      }
      userId = userData.id
      
    }
    else {
      next(new Error("Access denied"))
    }
    //console.log('ПРОШЛА МИДЛВАРЮ!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!')
    socket.data.userId = userId
    next()
  })
  auth.on('connection', async socket => {
   // console.log('MIDLVARA')
    let userId = socket.data.userId
    socket.join(`authUser:${userId}`)
    socket.join('asdjsakdjsakldjasldjaskldjaskljdadsadklasjdlkajsdkl')
    console.log(`${socket.id} user auth with userId ${userId}`)

    socket.on('logout', async () => {
      console.log('logout')
      console.log(io.sockets.adapter.rooms)
      socket.to(`authUser:${userId}`).emit('logout')
    })
    socket.on('login', async () => {
      console.log('login')
      console.log(io.sockets.adapter.rooms)
      socket.broadcast.to(`authUser:${userId}`).emit('logout')
      socket.to(`authUser:${userId}`).emit('sendMessage:timer', {
        title: 'Сообщение от сайта',
        message: 'Вы вошли с другого устройства',
        color: 'green'
      })
    })
    
    console.log(io.sockets.adapter.rooms)
    console.log(socket.adapter.rooms)
  })
}
