const bcrypt = require('bcrypt')
const uuid = require('uuid')
const mailService = require('./mail-service')
const UserModel = require('../model/models')
const tokenService = require('./token-service')
const UserDto = require('../dtos/user-dto')
const UserDtoDiscord = require('../dtos/user-dtoDiscord')
const ApiError = require('../exceptions/api-error')
const axios = require('axios')
const fs = require('fs')
require('dotenv').config()
const path = require('path')
const {Op} = require('sequelize')


class ioUserService {
  
  
  async validateToken(socket) {
    try {
      let token = socket.handshake.auth.token
      let noRegToken = socket.handshake.auth.noregToken
      let idRoom = socket.handshake.auth.idRoom
      let isValidateId = null
      if (!socket.handshake.auth.noregToken) {
        //Создавай новый токен и клади его в БД
        
        noRegToken = uuid.v4()
        socket.emit('setNoregToken', noRegToken)
        await UserModel.NoRegUsers.create({noRegToken: noRegToken})
      }
      
      
      if (token) {
        const userData = tokenService.validateAccessToken(token)
        if (!userData) {
          socket.emit("setError",
            {
              message: `Сервер не смог подтвердить вашу личность. Пожалуйста перезагрузите страницу или перезайдите в аккаунт`,
              status: 403,
              functionName: 'createRoom'
            })
          console.log('Невалидный токен')
          return null
        }
        console.log('Connected with AccsessToken', userData.id)
        isValidateId = userData.id
        return {idRoom, isValidateId}
      }
      const isValidNoRegToken = await UserModel.NoRegUsers.findOne({where: {noRegToken: noRegToken}})
      if (!isValidNoRegToken) {
        socket.emit("setError",
          {message: `Произошла ошибка. Пожалуйста перезагрузите страницу`, status: 403, functionName: 'createRoom'})
        return null
      }
      console.log('Connected with noRegToken', -Math.abs(isValidNoRegToken.id))
      isValidateId = -Math.abs(isValidNoRegToken.id)
      return {idRoom, isValidateId}
    } catch(e) {
      console.log(e)
      return null
    }
  }
  
  
}

module.exports = new ioUserService()