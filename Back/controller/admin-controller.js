const Service = require('../service/admin-service');
const {validationResult} = require('express-validator')
const ApiError = require('../exceptions/api-error')
const axios = require('axios')
require('dotenv').config()

class AdminController {

    async banUser(req, res, next) {
        try {
           const userId = req.params.id
           const isBlock =await Service.blockUser(userId)
           if(isBlock){
               return res.json({message: 'Пользователь успешно заблокирован',type:'successfully'})
           }
           return res.json({message: 'Пользователь успешно разблокирован',type:'successfully'})


        } catch(e) {
          next(e)
        }
      }




}

module.exports = new AdminController()