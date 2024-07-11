const bcrypt = require('bcrypt')
const uuid = require('uuid')
const sequelize = require('../db')
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
let mer = require("mersennetwister")
const crypto = require('crypto')
const buffer = require("buffer");


class gameKey {
  
  constructor() {
    this.crKey = 'xB4bfGriY3eauHJnHpbtGTwf4CTY+KhP8i19zBhBRzQ='
    this.iv = 'vDG22SHsTGenEkBRTIP6bQ=='
    this.algorithm = 'aes-256-cbc'
  }
  
  
  async generateKey(title, status, period, count) {
    
    let newTitle = path.join('../gameKey/', `${title}.txt`)
    fs.open(newTitle, 'w', (err) => {
    })
    for (let i = 0; i<count; i++) {
      let isNewKey = false
      let encKey
      let writtenKey
      while (!isNewKey) {
        let newKey = ([...Array(4)].map(() => crypto.randomBytes(2).toString('hex')).join('-').toUpperCase())
        const cipher = crypto.createCipheriv(this.algorithm, Buffer.from(this.crKey.toString('utf8'), "base64"),
          Buffer.from(this.iv.toString('utf8'), "base64"));
        let encrypted = cipher.update(newKey, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        let checkKey = await UserModel.gameKey.findOne({where: {key: encrypted}})
        if (!checkKey) {
          isNewKey = true
          encKey = encrypted
          writtenKey = newKey
        }
        
      }
      let newKeyDb = await UserModel.gameKey.create({key: encKey, period: period, type: status})
      // console.log(newKeyDb.id)
      fs.appendFileSync(newTitle, `\n${writtenKey}`, (err) => {
      })
      
      
    }
    // fs.close()
    console.log('Прошло успешно')
    
  }
  
  async activateKey(key, userId,question) {
    //  let cryptKey = await bcrypt.hash(key, 3)
    const cipher = crypto.createCipheriv(this.algorithm, Buffer.from(this.crKey.toString('utf8'), "base64"),
      Buffer.from(this.iv.toString('utf8'), "base64"));
    let encrypted = cipher.update(key, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    let user = await UserModel.User.findOne({where: {id: userId}})
    let gameKey = await UserModel.gameKey.findOne({where: {key: encrypted}})
    if (gameKey) {
      if (!gameKey.isActivate) {
        if(!question && gameKey.type!==user.accsessLevel && (user.accsessLevel==='vip'||user.accsessLevel==='mvp')){
          let dateNow = new Date(new Date().setUTCHours(0, 0, 0, 0))
          let period = new Date(user.endDate - dateNow) / (1000 * 60 * 60 * 24)
          return{
            question:true,
            days:period
          }
        }
        let newTitle = path.join('../SystemLogs/', `activateKey-logs.txt`)
        let now = new Date()

        fs.appendFile(newTitle,
          `\nАктивирован ключ: ${key} пользователем ${user.nickname} Дата: ${now.toLocaleDateString()} Время: ${now.toLocaleTimeString()}`,
          (err) => {
          })

        if (gameKey.type===user.accsessLevel) {
          user.endDate = new Date(new Date(user.endDate).setUTCHours(0, 0, 0, 0) + gameKey.period * 24 * 60 * 60 * 1000)
          console.log(user.endDate)
          gameKey.isActivate = 1
          await gameKey.save()
          await user.save()
          return {
            endDate: user.endDate
          }
        }
        else {
          if (user.accsessLevel==='mvp') {
            await UserModel.UserUsePack.destroy({where: {userId: user.id}})
            console.log('УДАЛИЛИ ПАКИ НАХУЙ')
            user.isUsedSystemAdvancePack = 0
          }
          await this.changeLevel(gameKey.type, gameKey.period, user)
          if (gameKey.type==='vip') {
            gameKey.isActivate = 1
            await gameKey.save()

            user.refreshNickname = 1
            await user.save()
            return {
              endDate: user.endDate,
              accessLevel: gameKey.type,
              isChange: true
            }
          }

          gameKey.isActivate = 1
          await gameKey.save()
          return {
            endDate: user.endDate,
            accessLevel: gameKey.type
          }
        }

      }
      else {

        throw ApiError.keyExp(`Такого ключа не существует`)
        //Ошибка, ключ уже активирован
      }

    }
    else {
      throw ApiError.keyExp(`Такого ключа не существует`)
      //Ошибка, такого ключа не существует
    }

  }


  async changeLevel(status, period, user) {
    let updateDate = null
    let endDate = null
    if (period!==null) {
      endDate = new Date(new Date().setUTCHours(0, 0, 0, 0) + period * 24 * 60 * 60 * 1000)
      if (period<=30) {
        updateDate = endDate
      }
      else {
        updateDate = new Date(new Date().setUTCHours(0, 0, 0, 0) + 30 * 24 * 60 * 60 * 1000)
      }
    }
    user.updateDate = updateDate
    user.endDate = endDate
    user.accsessLevel = status
    await user.save()


  }

  async getKeyId(key) {
    const cipher = crypto.createCipheriv(this.algorithm, Buffer.from(this.crKey.toString('utf8'), "base64"),
      Buffer.from(this.iv.toString('utf8'), "base64"));
    let encrypted = cipher.update(key, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    let gameKey = await UserModel.gameKey.findOne({where: {key: encrypted}})
    console.log(gameKey.id)
  }

  async updateSubscription() {
    let dateNow = new Date((new Date().setUTCHours(0, 0, 0, 0)))
    let testDate = new Date()
    console.log(dateNow,testDate)
    let allUsers = await UserModel.User.findAll({where: {updateDate: {[Op.lte]:dateNow}}})
    console.log(allUsers)
    if (allUsers) {
      for (let user of allUsers) {
        console.log(user.nickname, +user.updateDate=== +user.endDate)
        if (+user.updateDate>= +user.endDate) {
          user.isUsedSystemAdvancePack = 0
          user.refreshNickName = 0
          await this.changeLevel('default', null, user)
          await UserModel.UserUsePack.destroy({where: {userId: user.id}})
          console.log('default')
        }
        else {
          let period = new Date(user.endDate - user.updateDate) / (1000 * 60 * 60 * 24)
          await this.changeLevel(user.accsessLevel, period, user)
          console.log(user.accsessLevel)
          if (user.accsessLevel==='vip') {
            user.refreshNickname = 1
            await user.save()
          }
        }


      }
    }
  }

}

module
  .exports = new gameKey()