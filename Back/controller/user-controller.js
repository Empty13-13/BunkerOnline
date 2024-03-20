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
      return res.json({message: 'Вы успешно зарегистрировались!',type:'successfully'})
      
      
    } catch(e) {
      next(e)
    }
  }
  
  async login(req, res, next) {
    try {
      
      const errors = validationResult(req)
      console.log(req)
      if (!errors.isEmpty()) {
        return next(ApiError.BadRerquest('Error validate',[{input: 'nickname', type: 'Error validate'}]))
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
      const redirect_url = `http://localhost:5173/profile=${userData.user.id}?account=connected`
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
      const resultData = userService.updateUser(data, refreshToken, userId) //{email,nickname,sex,avatar,text,birthday,hiddenBirthday}
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
    const redirect_url = `https://discord.com/oauth2/authorize?client_id=1217113312018563163&response_type=code&redirect_uri=http%3A%2F%2Flocalhost%3A80%2Fapi%2Fcallback&scope=identify+email`
    res.redirect(redirect_url)
  }
  
  async callback(req, res, next) {
    console.log(req.query)
    
    const code = req.query['code']
    const userData = await userService.connectionDiscord(code)
    console.log(userData)
    res.cookie('refreshToken', userData.refreshToken,
      {maxAge: 30 * 24 * 60 * 1000, httpOnly: true, sameSite: 'strict'})
    delete userData.refreshToken
    //console.log(userData.user.id)
    const redirect_url = `http://localhost:5173/profile=${userData.user.id}?account=connected`
    res.redirect(redirect_url)
  }
  
  async loginVK(req, res, next) {
    const redirect_url = `https://oauth.vk.com/authorize?client_id=${process.env.APP_ID}&redirect_uri=${process.env.REDIRECT_URLVK}&display=page&response_type=code&scope=email&v=5.131'`
    res.redirect(redirect_url)
  }
  
  async callbackVK(req, res, next) {
    
    const code = req.query['code']
    const userData = await userService.connectionVK(code)
    res.cookie('refreshToken', userData.refreshToken,
      {maxAge: 30 * 24 * 60 * 1000, httpOnly: true, sameSite: 'strict'})
    delete userData.refreshToken
        console.log(userData.user.id)
        console.log(userData)
        const redirect_url = `http://localhost:5173/profile=${userData.user.id}?account=connected`
        res.redirect(redirect_url)
  }
  
  async getUser(req, res, next) {
    try {
      const userId = req.params.id
      const id = req.headers
      const user = await userService.getUser(userId)
      
      return res.json(user)
    } catch(e) {
      next(e)
    }
  }
  
  
}


module.exports = new UserController()