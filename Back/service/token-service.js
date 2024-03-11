const jwt = require('jsonwebtoken')
const tokenModel = require('../model/models')
class TokenService{
    generateTokens(payload){
        const accessToken = jwt.sign(payload, process.env.JWT_ACCESS_SECRET,{expiresIn: '15m'})
        const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET,{expiresIn: '30d'})
        return{
            accessToken,
            refreshToken
        }

    }
    async saveToken(userId,refreshToken){
        const tokenData = await  tokenModel.Token.findOne({where:{userId}})
        if (tokenData){
            console.log('error')
            tokenData.refreshToken = refreshToken
            return tokenData.save()
        }
        const token = await  tokenModel.Token.create({userId,refreshToken})
        return token;
    }
}
module.exports = new TokenService()