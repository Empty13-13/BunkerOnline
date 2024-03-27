const userService = require('../service/user-service');
const {validationResult} = require('express-validator')
const ApiError = require('../exceptions/api-error')
const axios = require('axios')
require('dotenv').config()

class UserController {
  async registration(req, res, next) {
    try {
      const errors = validationResult(req)
      
      if (!errors.isEmpty()) {
        return next(ApiError.BadRerquest('Error validate', [{input: 'nickname', type: 'Error validate'}]))
      }
      const {nickname, email, password} = req.body
      await userService.registration(nickname, email, password)
      //res.cookie('refreshToken', userData.refreshToken,
      //  {maxAge: 30 * 24 * 60 * 60 * 1000, httpOnly: true, sameSite: 'Lax'})
      //delete userData.refreshToken
      return res.json({message: 'Вы успешно зарегистрировались!', type: 'successfully'})
      
      
    } catch(e) {
      next(e)
    }
  }
  
  async login(req, res, next) {
    try {
      
      const errors = validationResult(req)
      console.log(req)
      if (!errors.isEmpty()) {
        return next(ApiError.BadRerquest('Error validate', [{input: 'nickname', type: 'Error validate'}]))
      }
      
      const {login, password} = req.body
      const userData = await userService.login(login, password)
      
      
      res.cookie('refreshToken', userData.refreshToken,
        {maxAge: 30 * 24 * 60 * 60 * 1000, httpOnly: true, sameSite: 'Lax'})
      delete userData.refreshToken
      return res.json(userData)
    } catch(e) {
      next(e)
    }
  }
  
  async logout(req, res, next) {
    try {
      console.log(req)
      const {refreshToken} = req.cookies
      const token = await userService.logout(refreshToken)
      res.clearCookie('refreshToken', {httpOnly: true, sameSite: 'Lax'})
      console.log(token)
      return res.json(token)
    } catch(e) {
      next(e)
    }
  }
  
  async activate(req, res, next) {
    try {
      const activateLink = req.params.link
      const userData = await userService.activate(activateLink)
      const redirect_url = `${process.env.FRONT_API}/profile=${userData.user.id}?account=connected`
      res.cookie('refreshToken', userData.refreshToken,
        {maxAge: 30 * 24 * 60 * 60 * 1000, httpOnly: true, sameSite: 'Lax'})
      delete userData.refreshToken
      console.log(userData)
      res.redirect(redirect_url)
      
    } catch(e) {
      next(e)
    }
  }
  
  async refresh(req, res, next) {
    try {
      const {refreshToken} = req.cookies
      console.log(req.cookies)
      const userData = await userService.refresh(refreshToken)
      res.cookie('refreshToken', userData.refreshToken,
        {maxAge: 30 * 24 * 60 * 1000, httpOnly: true, sameSite: 'Lax'})
      delete userData.refreshToken
      return res.json(userData)
      
    } catch(e) {
      next(e)
    }
  }
  
  async updateUser(req, res, next) {
    try {
      const userId = req.params.id
      
      
      const data = req.body
      const {refreshToken} = req.cookies
      const resultData = await userService.updateUser(data, refreshToken, userId) //{email,nickname,sex,avatar,text,birthday,hiddenBirthday}
      const status = {status: 200, statusText: 'OK'}
      res.json(status)
      
      
    } catch(e) {
      next(e)
    }
  }
  
  async updateNickname(req, res, next) {
    try {
      const userId = req.params.id
      
      
      const data = req.body
      const {refreshToken} = req.cookies
      const resultData = await userService.updateNickname(data, refreshToken, userId) //{email,nickname,sex,avatar,text,birthday,hiddenBirthday}
      const status = {status: 200, statusText: 'OK'}
      res.json(status)
      
      
    } catch(e) {
      next(e)
    }
  }
  
  
  async getUsers(req, res, next) {
    try {
      const users = await userService.getAllUsers()
      
      return res.json(users)
    } catch(e) {
      next(e)
    }
  }
  
  loginDiscord(req, res, next) {
    const redirect_url = `${process.env.DISCORD_URL}`
    res.redirect(redirect_url)
  }
  
  async callback(req, res, next) {
    console.log(req.query)
    
    const code = req.query['code']
    const userData = await userService.connectionDiscord(code)
    console.log(userData)
    if (userData==='banned') {
      res.redirect(423,`${process.env.FRONT_API}/login`)
      return
    }
    res.cookie('refreshToken', userData.refreshToken,
      {maxAge: 30 * 24 * 60 * 1000, httpOnly: true, sameSite: 'strict'})
    delete userData.refreshToken
    //console.log(userData.user.id)
    const redirect_url = `${process.env.FRONT_API}/profile=${userData.user.id}?account=connected`
    res.redirect(redirect_url)
  }

//   async loginVK(req, res, next) {
//     const redirect_url = `https://oauth.vk.com/authorize?client_id=${process.env.APP_ID}&redirect_uri=${process.env.REDIRECT_URLVK}&display=page&response_type=code&scope=email&v=5.131'`
//     res.redirect(redirect_url)
//   }

//   async callbackVK(req, res, next) {
//
//     const code = req.query['code']
//     const userData = await userService.connectionVK(code)
//     res.cookie('refreshToken', userData.refreshToken,
//       {maxAge: 30 * 24 * 60 * 1000, httpOnly: true, sameSite: 'strict'})
//     delete userData.refreshToken
//         console.log(userData.user.id)
//         console.log(userData)
//         const redirect_url = `${process.env.FRONT_API}/profile=${userData.user.id}?account=connected`
//         res.redirect(redirect_url)
//   }
  
  async getUser(req, res, next) {
    try {
      const userId = req.params.id
      // const id = req.headers
      const {refreshToken} = req.cookies
      const user = await userService.getUser(userId, refreshToken)
      
      return res.json(user)
    } catch(e) {
      next(e)
    }
  }
  
  async uploadAvatar(req, res, next) {
    try {
      
      
      const errors = validationResult(req)
      
      
      if (!errors.isEmpty()) {
        return next(ApiError.BadRerquest('Error validate', [{input: 'avatar', type: 'Error validate'}]))
      }
      const file = req.files.file
      //console.log("ASDASDASDASDA",req.files.file['mimetype'])
      
      // console.log(file)
      const userId = req.params.id
      console.log(userId)
      const user = await userService.uploadAvatar(file, userId)
      return res.json({link: user})
      
      
    } catch(e) {
      next(e)
    }
  }
  
  async deleteAvatar(req, res, next) {
    try {
      const userId = req.params.id
      const user = await userService.deleteAvatar(userId)
      
      return res.json(user)
    } catch(e) {
      next(e)
    }
  }
  
  async resetPasswordProfile(req, res, next) {
    try {
      const {refreshToken} = req.cookies
      const user = await userService.resetProfile(refreshToken)
      const type = "password"
      const result = await userService.reset(user.email, type)
      
      
      const status = {status: 200, statusText: 'OK'}
      res.json(status)
    } catch(e) {
      next(e)
    }
  }
  
  async resetPassword(req, res, next) {
    try {
      const errors = validationResult(req)
      
      if (!errors.isEmpty()) {
        return next(ApiError.BadRerquest('Error validate', [{input: 'email', type: 'Error validate'}]))
      }
      
      const {email} = req.body
      const type = "password"
      const result = await userService.reset(email, type)
      
      
      const status = {status: 200, statusText: 'OK'}
      res.json(status)
    } catch(e) {
      next(e)
    }
  }
  
  async resetUser(req, res, next) {
    try {
      if (!req.params.link) {
        return res.redirect(process.env.API_URL)
      }
      
      const link = req.params.link
      
      
      const result = await userService.validationLinkReset(link)
      
      
      const status = {status: 200, statusText: 'OK'}
      if (result.type.toString()==="password") {
        res.redirect(
          `${process.env.FRONT_API}?connected=resetPassword&linkId=${result.id}&userId=${result.userId}&link=${link}`)
      }
      else {
        res.redirect(
          `${process.env.FRONT_API}?connected=resetEmail&linkId=${result.id}&userId=${result.userId}&link=${link}`)
      }
    } catch(e) {
      next(e)
    }
  }
  
  async newPassword(req, res, next) {
    
    
    try {
      
      const errors = validationResult(req)
      
      if (!errors.isEmpty()) {
        return next(ApiError.BadRerquest('Error validate', [{input: 'password', type: 'Error validate'}]))
      }
      
      const {password, link, userId, idLink} = req.body
      const result = await userService.validationLinkReset(link)
      if (result.type.toString()!=="password") {
        return next(ApiError.BadRerquest('Error validate', [{input: 'userId', type: 'Error validate'}]))
      }
      console.log(userId, result.userId)
      if (userId.toString()!==result.userId.toString()) {
        return next(ApiError.BadRerquest('Error validate', [{input: 'userId', type: 'Error validate'}]))
      }
      const newPass = await userService.newPassword(password, userId, idLink)
      
      const status = {status: 200, statusText: 'OK'}
      res.json(status)
      
    } catch(e) {
      console.log(e)
    }
    
  }
  
  async newEmail(req, res, next) {
    
    
    try {
      const errors = validationResult(req)
      
      if (!errors.isEmpty()) {
        return next(ApiError.BadRerquest('Error validate', [{input: 'email', type: 'Error validate'}]))
      }
      
      const {email, link, userId, idLink} = req.body
      const result = await userService.validationLinkReset(link)
      if (result.type.toString()!=="email") {
        return next(ApiError.BadRerquest('Error validate', [{input: 'userId', type: 'Error validate'}]))
      }
      console.log(userId, result.userId)
      if (userId.toString()!==result.userId.toString()) {
        return next(ApiError.BadRerquest('Error validate', [{input: 'userId', type: 'Error validate'}]))
      }
      const newEmail = await userService.newEmail(email, userId, idLink)
      
      const status = {status: 200, statusText: 'Ссылка на подверждение отправлена на email, подтвердите новый email'}
      res.json(status)
      
    } catch(e) {
      next(e)
    }
    
  }
  
  async resetEmail(req, res, next) {
    
    
    try {
      const type = "email"
      const {refreshToken} = req.cookies
      const user = await userService.resetProfile(refreshToken)
      
      const result = await userService.reset(user.email, type)
      
      console.log(result)
      const status = {status: 200, statusText: 'OK'}
      res.json(status)
    } catch(e) {
      next(e)
    }
    
  }
  
  
}


module.exports = new UserController()