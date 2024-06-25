const Service = require('../service/admin-service');
const {validationResult} = require('express-validator')
const ApiError = require('../exceptions/api-error')
const axios = require('axios')
const gameKey = require('../service/gameKey-service')
require('dotenv').config()

class AdminController {
  
  async banUser(req, res, next) {
    try {
      const userId = req.params.id
      const isBlock = await Service.blockUser(userId)
      if (isBlock) {
        return res.json({message: 'Пользователь успешно заблокирован', type: 'successfully'})
      }
      return res.json({message: 'Пользователь успешно разблокирован', type: 'successfully'})
      
      
    } catch(e) {
      next(e)
    }
  }
  
  async generateKeys(req, res, next) {
    try {
      let arrayStatus = ['vip', 'mvp']
      
      let {filename, days, type, count} = req.body
      let status = arrayStatus[type]
      await gameKey.generateKey(filename, status, days, count)
      
      return res.json({message: `Ключ(и) в количестве ${count} для ${status} на период ${days} дней успешно создан(ы)`, type: 'successfully'})
      
    } catch(e) {
      next(e)
    }
  }
  
  
}

module.exports = new AdminController()