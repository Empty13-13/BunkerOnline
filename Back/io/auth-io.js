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


        }
        else {
            next(new Error("Accsess denied"))
        }

        socket.data.userId = userData.id
        next()
    })
    auth.on('connection', async socket => {
        let userId = socket.data.userId
        socket.join(`authUser:${userId}`)
        console.log(`${socket.id} user auth with userId ${userId}`)
        socket.on('logout', async () => {
            io.to(`authUser:${userId}`).emit('logout')
        })
    })
}
