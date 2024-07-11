const ApiError = require('../exceptions/api-error')
const tokenService = require("../service/token-service");
const UserModel = require("../model/models");


module.exports = function(accsessLevel) {
  return async function(req, res, next) {
    try {
      const authorizationHeader = req.headers.authorization
      if (!authorizationHeader) {
        return next(ApiError.UnauthorizedError())
      }
      let  accessToken = null
              if (authorizationHeader && authorizationHeader.toString().includes('Bearer ')) {
                     accessToken = authorizationHeader.split('Bearer ')[1]
                    }
      if (!accessToken) {
        return next(ApiError.UnauthorizedError())
      }
     
      
      const userData = tokenService.validateAccessToken(accessToken)
      if (!userData) {
        console.log(
          'ERRORERRORERRORERRORERRORERRORERRORERRORERRORERRORERRORERRORERRORERRORERRORERRORERRORERRORERRORERRORERRORERRORERRORERRORERRORERRORERRORERRORERRORERRORERRORERRORERRORERRORERRORERROR')
        return next(ApiError.UnauthorizedError())
      }
      
      let user = await UserModel.User.findOne({where:{id:userData.id}})
      if (user.dataValues.accsessLevel.toString()===accsessLevel) {
      return next(ApiError.BadRerquest(`Доступ запрещен`, [{type: 'Access Denied'}]))
      }
      next()
    } catch(e) {
      console.log(
        '123')
      return next(ApiError.UnauthorizedError())
    }
  }
}