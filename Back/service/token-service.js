const jwt = require('jsonwebtoken')
const tokenModel = require('../model/models')

class TokenService {
  generateTokens(payload) {
    const accessToken = jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {expiresIn: '25m'})
    const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {expiresIn: '30d'})
    return {
      accessToken,
      refreshToken,
      expiresIn: 3600,
    }
    
  }
  
  validateAccessToken(token) {
    try {
      const userData = jwt.verify(token, process.env.JWT_ACCESS_SECRET)
      return userData
    } catch(e) {
      return null
    }
  }
  
  validateRefreshToken(token) {
    try {
      const userData = jwt.verify(token, process.env.JWT_REFRESH_SECRET)
      return userData
    } catch(e) {
      return null
    }
  }
  
  async saveToken(userId, refreshToken) {
    const tokenData = await tokenModel.Token.findOne({where: {userId}})
    if (tokenData) {
      console.log('error')
      tokenData.refreshToken = refreshToken
      return await tokenData.save()
    }
    const token = await tokenModel.Token.create({userId, refreshToken})
    return token;
  }
  
  async removeToken(refreshToken) {
    const tokenData = await tokenModel.Token.destroy({where: {refreshToken: refreshToken}})
    return tokenData
  }
  
  async findToken(refreshToken) {
    console.log(refreshToken)
    const tokenData = await tokenModel.Token.findOne({where: {refreshToken: refreshToken}})
    return tokenData
  }
}

module.exports = new TokenService()