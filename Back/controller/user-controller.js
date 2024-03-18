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
        return next(ApiError.BadRerquest('Error validate', errors.array()))
      }
      const {nickname, email, password} = req.body
      const userData = await userService.registration(nickname, email, password)
      res.cookie('refreshToken', userData.refreshToken,
        {maxAge: 30 * 24 * 60 * 60 * 1000, httpOnly: true, sameSite: 'Lax'})
      delete userData.refreshToken
      return res.json(userData)
      
      
    } catch(e) {
      next(e)
    }
  }
  
  async login(req, res, next) {
    try {
      
      const errors = validationResult(req)
      console.log(req)
      if (!errors.isEmpty()) {
        return next(ApiError.BadRerquest('Error validate', errors.array()))
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
      await userService.activate(activateLink)
      return res.redirect(process.env.CLIENT_URL)
    } catch(e) {
      next(e)
    }
  }
  
  async refresh(req, res, next) {
    try {
      const {refreshToken} = req.cookies
      const userData = await userService.refresh(refreshToken)
      res.cookie('refreshToken', userData.refreshToken,
        {maxAge: 30 * 24 * 60 * 1000, httpOnly: true, sameSite: 'Lax'})
      delete userData.refreshToken
      return res.json(userData)
      
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
    const redirect_url = `https://discord.com/oauth2/authorize?client_id=1217113312018563163&response_type=code&redirect_uri=http%3A%2F%2Flocalhost%3A5000%2Fapi%2Fcallback&scope=identify+email`
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
  
  
}


module.exports = new UserController()