ApiError = require('../exceptions/api-error')
const tokenService = require("../service/token-service");
const UserModel = require("../model/models");

module.exports = function(accsessLevel) {
  return async function(req, res, next) {
    try {

//          const authorizationHeader = req.headers.authorization
//                 if(!authorizationHeader){
//                     return next(ApiError.UnauthorizedError())
//                 }
//                 const accessToken = authorizationHeader.split(' ')[1]
//                 if(!accessToken){
//                     return next(ApiError.UnauthorizedError())
//                 }
//                 const userData = tokenService.validateAccessToken(accessToken)
//                 console.log(userData)
//                 if(!userData){
//                     return next(ApiError.UnauthorizedError())
//                 }
      
      const {refreshToken} = req.cookies
     // console.log("resfresh", req.cookies)
      const id = await UserModel.Token.findOne({where: {refreshToken: refreshToken}})
      if (!id) {
        return next(ApiError.UnauthorizedError())
      }
      
      const user = await UserModel.User.findOne({where: {id: id.userId}})
      //console.log("USERRR", user.dataValues.accsessLevel)
      if (user.dataValues.accsessLevel!==accsessLevel) {
        return next(ApiError.BadRerquest(`Нет доступа менять данные`, [{type: 'Inadmissible id'}]))
      }
      
      
      // req.user = userData
      next()
      
    } catch(e) {
     // console.log('fsdfsdfsdfsdfsdfsdfsdfsdfsdfsdfsdf')
      return next(ApiError.UnauthorizedError())
    }
  }
}