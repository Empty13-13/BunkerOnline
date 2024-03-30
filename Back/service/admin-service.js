const bcrypt = require('bcrypt')
const uuid = require('uuid')
const mailService = require('./mail-service')
const UserModel = require('../model/models')
const tokenService = require('./token-service')
const userService = require('./user-service')
const UserDto = require('../dtos/user-dto')
const UserDtoDiscord = require('../dtos/user-dtoDiscord')
const ApiError = require('../exceptions/api-error')
const axios = require('axios')
require('dotenv').config()


class AdminService {
  
  async blockUser(id) {
    
    const isBlocked = await UserModel.BlackListUsers.findOne({where: {userId: id}})
    if (!isBlocked) {
      await UserModel.BlackListUsers.create({userId: id})
      const refreshToken = await UserModel.Token.findOne({where: {userId: id}})
      try {
        const token = await userService.logout(refreshToken.refreshToken)
      } catch(e) {
        console.log('У пользователя нет refreshToken в системе')
      }
      
      return true
    }
    
    await UserModel.BlackListUsers.destroy({where: {userId: id}})
    return false
    
  }
  
  
}

module.exports = new AdminService()