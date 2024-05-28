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
      }

      if (!accessToken) {
        return next(ApiError.UnauthorizedError())
      }
      const userData = tokenService.validateAccessToken(accessToken)
      console.log(userData)
      if (!userData) {
        return next(ApiError.UnauthorizedError())
      }
       const isBlocked = await UserModel.BlackListUsers.findOne({where: {userId: userData.id}})
       if(isBlocked){
         return next(ApiError.BlockedUser())
       }
       // next()
    }
    next()
  } catch(e) {
    return next(ApiError.UnauthorizedError())
  }
}