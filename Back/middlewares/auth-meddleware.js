const ApiError = require('../exceptions/api-error')
const tokenService = require('../service/token-service')
module.exports = function(req,res,next){
    
    try{
        const authorizationHeader = req.headers.authorization
        if(!authorizationHeader){
            return next(ApiError.UnauthorizedError())
        }
        let  accessToken = null
        if (authorizationHeader && authorizationHeader.toString().includes('Bearer ')) {
               accessToken = authorizationHeader.split('Bearer ')[1]
              }

        if(!accessToken){
            return next(ApiError.UnauthorizedError())
        }
        const userData = tokenService.validateAccessToken(accessToken)
       // console.log(userData)
        if(!userData){
            return next(ApiError.UnauthorizedError())
        }
        req.user = userData
        next()
    }catch(e){
        return next(ApiError.UnauthorizedError())
    }
}