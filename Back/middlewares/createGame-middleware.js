const ApiError = require('../exceptions/api-error')
const tokenService = require('../service/token-service')
const UserModel = require("../model/models");
module.exports = async function(req, res, next) {

    try {
        const authorizationHeader = req.headers.authorization
        if (authorizationHeader) {
            let accessToken = null
            if (authorizationHeader && authorizationHeader.toString().includes('Bearer ')) {
                accessToken = authorizationHeader.split('Bearer ')[1]

                if (!accessToken) {
                    return next(ApiError.UnauthorizedError())
                }
                const userData = tokenService.validateAccessToken(accessToken)
                console.log(userData)
                if (!userData) {
                    return next(ApiError.UnauthorizedError())
                }
                const createGame = await UserModel.GameRooms.findAll({where: {creatorId: userData.id}})
                if (createGame.length>1) {
                    return next(ApiError.AccessDenie())
                }
            }


            // next()
        }
        next()
    } catch(e) {
        return next(ApiError.UnauthorizedError())
    }
}