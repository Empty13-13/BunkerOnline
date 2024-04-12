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
      const userId = req.params.id
      const {refreshToken} = req.cookies
      const id = await UserModel.Token.findOne({where: {refreshToken: refreshToken}})
      if (!id) {
        console.log(
          'ERRORERRORERRORERRORERRORERRORERRORERRORERRORERRORERRORERRORERRORERRORERRORERRORERRORERRORERRORERRORERRORERRORERRORERRORERRORERRORERRORERRORERRORERRORERRORERRORERRORERRORERRORERROR')
        return next(ApiError.UnauthorizedError())
      }
      const user = await UserModel.User.findOne({where: {id: id.dataValues.userId}})
      
      const userData = tokenService.validateAccessToken(accessToken)
      if (!userData) {
        console.log(
          'ERRORERRORERRORERRORERRORERRORERRORERRORERRORERRORERRORERRORERRORERRORERRORERRORERRORERRORERRORERRORERRORERRORERRORERRORERRORERRORERRORERRORERRORERRORERRORERRORERRORERRORERRORERROR')
        return next(ApiError.UnauthorizedError())
      }
      
      console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! ID: ', user)
      if (userId.toString()!==id.dataValues.userId.toString()) {
        if (user.dataValues.accsessLevel!==accsessLevel) {
          return next(ApiError.BadRerquest(`Нет доступа менять данные`, [{type: 'Inadmissible id'}]))
        }
      }
      else if (user.dataValues.accsessLevel.toString()==='default') {
        const isChange = await UserModel.DiscordAuthId.findOne({where:{userId:userId}})
        if(!isChange){
          return next(ApiError.BadRerquest(`Нет доступа менять данные`, [{type: 'Inadmissible id'}]))
        }
        if(isChange.changeNickname){
          return next(ApiError.BadRerquest(`Нет доступа менять данные`, [{type: 'Inadmissible id'}]))
        }
                                                
      }
      
      
      next()
    } catch(e) {
      console.log(
        '123')
      return next(ApiError.UnauthorizedError())
    }
  }
}