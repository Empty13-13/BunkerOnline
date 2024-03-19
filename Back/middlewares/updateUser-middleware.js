const ApiError = require('../exceptions/api-error')
const tokenService = require("../service/token-service");
const UserModel = require("../model/models");



module.exports = function (accsessLevel) {
    return async function (req, res, next) {
        try {
            const authorizationHeader = req.headers.authorization
            if (!authorizationHeader) {
                return next(ApiError.UnauthorizedError())
            }
            const accessToken = authorizationHeader.split(' ')[1]
            if (!accessToken) {
                return next(ApiError.UnauthorizedError())
            }
            const userId = req.params.id
            const {refreshToken} = req.cookies
            const id = await UserModel.Token.findOne({where: {refreshToken: refreshToken}})
            if (!id) {
                return next(ApiError.UnauthorizedError())
            }
            const user = await UserModel.User.findOne({where:{id:id.id}})

            const userData = tokenService.validateAccessToken(accessToken)
            if (!userData) {
                return next(ApiError.UnauthorizedError())
            }

            console.log(userId,id.id,user.accsessLevel,accsessLevel)
            if (userId.toString() !== id.id.toString() ) {
                if(user.accsessLevel !== accsessLevel)
                    {
                        return next(ApiError.BadRerquest(`Нет доступа менять данные`, [{type: 'Inadmissible id'}]))
                    }
                }


            req.user = userData
            next()
        } catch (e) {
            return next(ApiError.UnauthorizedError())
        }
    }
}