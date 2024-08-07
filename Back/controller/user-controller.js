const userService = require('../service/user-service');
const {validationResult} = require('express-validator')
const ApiError = require('../exceptions/api-error')
const axios = require('axios')
const uuid = require('uuid')
const playerDataService = require('../service/playerData-service')
const systemFunction = require('../systemFunction/systemFunction')
const fs = require("fs");
const {F_OK} = require("constants");
const jsdom = require("jsdom");
require('dotenv').config()
const gameKey = require('../service/gameKey-service')
const tokenService = require('../service/token-service')

class UserController {
  async registration(req, res, next) {
    try {
      
      let {recaptchaToken} = req.body
      
      const params = new URLSearchParams({
        secret: process.env.recaptchaKey,
        response: recaptchaToken
      })
      await fetch('https://www.google.com/recaptcha/api/siteverify', {method: "POST", body: params})
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            //    console.log('УДАЧНО')
          }
          else {
            //   console.log('Не удачно')
            return next(ApiError.CapthaBlock())
            
          }
        })
        .catch((e) => {
          //   console.log('Не удачно CATCH', e)
          return next(ApiError.CapthaBlock())
        })
      
      
      const errors = validationResult(req)
      
      if (!errors.isEmpty()) {
        return next(ApiError.BadRerquest('Ошибка валидации поля', [{input: 'nickname', type: 'Error validate'}]))
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
      
      let {recaptchaToken} = req.body
      //  console.log(recaptchaToken)
      
      const params = new URLSearchParams({
        secret: process.env.recaptchaKey,
        response: recaptchaToken
      })
      await fetch('https://www.google.com/recaptcha/api/siteverify', {method: "POST", body: params})
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            //      console.log('УДАЧНО')
          }
          else {
            //    console.log('Не удачно')
            return next(ApiError.CapthaBlock())
            
          }
        })
        .catch((e) => {
          //     console.log('Не удачно CATCH', e)
          return next(ApiError.CapthaBlock())
        })
      
      
      const errors = validationResult(req)
      // console.log(req)
      if (!errors.isEmpty()) {
        return next(ApiError.BadRerquest('Ошибка валидации поля', [{input: 'nickname', type: 'Error validate'}]))
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
      //  console.log(req)
      const {refreshToken} = req.cookies
      const token = await userService.logout(refreshToken)
      res.clearCookie('refreshToken', {httpOnly: true, sameSite: 'Lax'})
      //    console.log(token)
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
      //  console.log(userData)
      res.redirect(redirect_url)
      
    } catch(e) {
      next(e)
    }
  }
  
  async test(req, res, next) {
    // let chartPlayerIdBase = await playerDataService.getDataPackData(1, 'playerData')
    await playerDataService.setStatisticGame('NDNU3')
    // const hostPack = await playerDataService.hostUsePack(1)
//     const {
//       hostBaseDataPacksData,
//       hostAdvanceDataPacksData,
//       systemDataPacksData
//     } = await playerDataService.dataForPlayer(hostPack, systemData)
//     let usePack = hostPack
//     const result = await playerDataService.createDataPlayer(hostBaseDataPacksData, hostAdvanceDataPacksData, systemDataPacksData, usePack, 1,1, 0,1, systemData)
//     const data = {
//       players:{}
//     }
//     data.players = Object.assign(data.players,result.result)result
    // const {hostBaseDataPacksBunker, hostAdvanceDataPacksBunker} = await playerDataService.dataForBunker(hostPack,
    //    systemData)
    //   const result = await playerDataService.createDataBunker([2, 3, 5, 6, 6, 7], systemData, hostBaseDataPacksBunker,
    //    hostAdvanceDataPacksBunker)
    //  const le = await playerDataService.getDataBunkerFromId(result)
    //  console.log(result)
    // res.json(result)
  }
  
  async refresh(req, res, next) {
    try {
      const {refreshToken} = req.cookies
      //  console.log(req.cookies)
      const userData = await userService.refresh(refreshToken)
      res.cookie('refreshToken', userData.refreshToken,
        {maxAge: 30 * 24 * 60 * 60 * 1000, httpOnly: true, sameSite: 'Lax'})
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
    //  console.log(req.query)
    
    const code = req.query['code']
    const userData = await userService.connectionDiscord(code)
    // console.log(userData)
    if (userData==='banned') {
      res.redirect(`${process.env.FRONT_API}/login?blocked=true`)
      return
    }
    res.cookie('refreshToken', userData.refreshToken,
      {maxAge: 30 * 24 * 60 * 60 * 1000, httpOnly: true, sameSite: 'strict'})
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
      // console.log(userId)
      // const id = req.headers
      let token = null
      const accessToken = req.headers.authorization
      if (accessToken && accessToken.toString().includes('Bearer ')) {
        token = accessToken.split('Bearer ')[1]
      }
      const user = await userService.getUser(userId, token)
      
      return res.json(user)
    } catch(e) {
      next(e)
    }
  }
  
  async uploadAvatar(req, res, next) {
    try {
      let token = null
      const accessToken = req.headers.authorization
      if (accessToken && accessToken.toString().includes('Bearer ')) {
        token = accessToken.split('Bearer ')[1]
      }
      
      const errors = validationResult(req)
      
      
      if (!errors.isEmpty()) {
        return next(ApiError.BadRerquest('Ошибка валидации поля', [{input: 'avatar', type: 'Error validate'}]))
      }
      const file = req.files.file
      //console.log("ASDASDASDASDA",req.files.file['mimetype'])
      
      // console.log(file)
      const userId = req.params.id
      //  console.log(userId)
      const user = await userService.uploadAvatar(file, userId, token)
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
      
      let {recaptchaToken} = req.body
      //   console.log(recaptchaToken)
      
      const params = new URLSearchParams({
        secret: process.env.recaptchaKey,
        response: recaptchaToken
      })
      await fetch('https://www.google.com/recaptcha/api/siteverify', {method: "POST", body: params})
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            //     console.log('УДАЧНО')
          }
          else {
            //    console.log('Не удачно')
            return next(ApiError.CapthaBlock())
            
          }
        })
        .catch((e) => {
          //  console.log('Не удачно CATCH', e)
          return next(ApiError.CapthaBlock())
        })
      
      const errors = validationResult(req)
      
      if (!errors.isEmpty()) {
        return next(ApiError.BadRerquest('Ошибка валидации поля', [{input: 'email', type: 'Error validate'}]))
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
        return next(ApiError.BadRerquest('Ошибка валидации поля', [{input: 'password', type: 'Error validate'}]))
      }
      
      const {password, link, userId, idLink} = req.body
      const result = await userService.validationLinkReset(link)
      if (result.type.toString()!=="password") {
        return next(ApiError.BadRerquest('Ошибка валидации поля', [{input: 'userId', type: 'Error validate'}]))
      }
      //  console.log(userId, result.userId)
      if (userId.toString()!==result.userId.toString()) {
        return next(ApiError.BadRerquest('Ошибка валидации поля', [{input: 'userId', type: 'Error validate'}]))
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
        return next(ApiError.BadRerquest('Ошибка валидации поля', [{input: 'email', type: 'Error validate'}]))
      }
      
      const {email, link, userId, idLink} = req.body
      const result = await userService.validationLinkReset(link)
      if (result.type.toString()!=="email") {
        return next(ApiError.BadRerquest('Ошибка валидации поля', [{input: 'userId', type: 'Error validate'}]))
      }
      // console.log(userId, result.userId)
      if (userId.toString()!==result.userId.toString()) {
        return next(ApiError.BadRerquest('Ошибка валидации поля', [{input: 'userId', type: 'Error validate'}]))
      }
      const newEmail = await userService.newEmail(email, userId, idLink)
      
      const status = {status: 200, statusText: 'Ссылка на подтверждение отправлена на email, подтвердите новый email'}
      res.json(status)
      
    } catch(e) {
      next(e)
    }
    
  }
  
  generatRoomId
  
  async resetEmail(req, res, next) {
    
    
    try {
      
      const type = "email"
      const {refreshToken} = req.cookies
      const user = await userService.resetProfile(refreshToken)
      
      const result = await userService.reset(user.email, type)
      
      //   console.log(result)
      const status = {status: 200, statusText: 'OK'}
      res.json(status)
    } catch(e) {
      next(e)
    }
    
  }
  
  async generateRoomId(req, res, next) {
    try {
      let {recaptchaToken} = req.body
      
      const params = new URLSearchParams({
        secret: process.env.recaptchaKey,
        response: recaptchaToken
      })
      await fetch('https://www.google.com/recaptcha/api/siteverify', {method: "POST", body: params})
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            //  console.log('УДАЧНО')
          }
          else {
            //  console.log('Не удачно')
            return next(ApiError.CapthaBlock())
          }
        })
        .catch((e) => {
          //console.log('Не удачно CATCH', e)
          return next(ApiError.CapthaBlock())
        })
      
      const roomLink = await userService.gen_roomLink()
      return res.json({link: roomLink})
    } catch(e) {
      next(e)
    }
  }
  
  async userGames(req, res, next) {
    try {
      let token = null
      const accessToken = req.headers.authorization
      
      if (accessToken && accessToken.toString().includes('Bearer ')) {
        token = accessToken.split('Bearer ')[1]
      }
      const noregToken = req.body.noregToken
      //console.log(token, noregToken)
      const data = await userService.userGames(token, noregToken)
      // console.log(data)
      res.json(data)
    } catch(e) {
      next(e)
    }
    
  }
  
  async allUsersGames(req, res, next) {
    
    
    try {
      
      const data = await userService.allUsersGames()
      //console.log(data)
      res.json(data)
    } catch(e) {
      next(e)
    }
    
  }
  
  async allPacks(req, res, next) {
    try {
      let token = null
      const accessToken = req.headers.authorization
      //  console.log(accessToken)
      if (accessToken && accessToken.toString().includes('Bearer ')) {
        token = accessToken.split('Bearer ')[1]
      }
      
      const data = await userService.allPacks(token)
      //console.log(data)
      res.json(data)
    } catch(e) {
      next(e)
    }
  }
  
  async activateKey(req, res, next) {
    try {
      let {key, question} = req.body
      let token = null
      const accessToken = req.headers.authorization
      //  console.log(accessToken)
      if (accessToken && accessToken.toString().includes('Bearer ')) {
        token = accessToken.split('Bearer ')[1]
      }
      else {
        return next(ApiError.UnauthorizedError())
      }
      const userData = tokenService.validateAccessToken(token)
      if (!userData) {
        return next(ApiError.UnauthorizedError())
      }
      const data = await gameKey.activateKey(key, userData.id, question)
      //console.log(data)
      res.json(data)
    } catch(e) {
      next(e)
    }
  }
  
  async changePack(req, res, next) {
    try {
      let {id, isUse} = req.body
      let token = null
      const accessToken = req.headers.authorization
      //    console.log(accessToken)
      if (accessToken && accessToken.toString().includes('Bearer ')) {
        token = accessToken.split('Bearer ')[1]
      }
      
      const data = await userService.changePack(token, id, isUse)
      //console.log(data)
      res.json(data)
    } catch(e) {
      next(e)
    }
  }
  
  async loadStaticPage(req, res, next) {
    try {
      let fs = require('fs')
      const jsdom = require("jsdom");
      const {JSDOM} = jsdom;
      
      let staticPage = await userService.getStaticPage(req.params.id.toString())
      if (!staticPage || !staticPage.fileName) {
        console.log('АЙАЙАЙА')
        next()
        return
      }
      else {
        fs.readFile(process.env.STATIC_PAGE_LINK+staticPage.fileName, 'utf8', (e, data) => {
          res.json({html: data})
        })
      }
      
      
      // let name = `${process.env.STATIC_PAGE_LINK + req.params.id.toString()}.txt`
      // let _name = `${process.env.STATIC_PAGE_LINK + '_' + req.params.id.toString()}.txt`
      //
      //
      // fs.readFile(name, 'utf8', (e, data) => {
      //   //  console.log(name)
      //   if (!e) {
      //     //  console.log('Прочитали файл')
      //     const dom = new JSDOM(data);
      //     let title = dom.window.document.querySelector('h1').textContent
      //     //  console.log(title)
      //     res.json({html: data, title})
      //   }
      //   else {
      //     fs.readFile(_name, 'utf8', (e, data) => {
      //       //    console.log(name)
      //       if (!e) {
      //         //  console.log('Прочитали файл2')
      //         const dom = new JSDOM(data);
      //         let title = dom.window.document.querySelector('h1').textContent
      //         // console.log(title)
      //         res.json({html: data, title})
      //       }
      //       else {
      //         //  console.log('Ошибка чтения файла')
      //         next(e)
      //       }
      //     })
      //   }
      // })
    } catch(e) {
      next(e)
    }
  }
  
  async loadOtherText(req, res, next) {
    try {
      const textData = await userService.getOtherText(req.params.id.toString())
      if (textData) {
        if (textData.text) {
          res.json(textData.text)
        }
        else {
          res.json(textData)
        }
        //  console.log('Нашли текст')
      }
      else {
        next({message: 'Текст не найден'})
      }
    } catch(e) {
      next(e)
    }
  }
  
  async loadWikiList(req, res, next) {
    try {
      const fs = require('fs');
      let resultArr = []
      const staticPages = await userService.getAllStaticPages()
      if (!staticPages.length) {
        res.json(resultArr)
        return
      }
      
      function isFileExist(path) {
        return new Promise((resolve, reject) => {
          try {
            fs.access(path, fs.constants.F_OK, (a) => {
              if (!a) {
                resolve(true)
              }
              else {
                resolve(false)
              }
            })
          } catch(e) {
            reject(e)
          }
        })
      }
      
      for (let page of staticPages) {
        try {
          if (!page.isHide && await isFileExist(process.env.STATIC_PAGE_LINK + page.fileName)) {
            resultArr.push({title: page.title, link: page.link, pageNum: page.pageNum})
          }
        } catch(e) {
          console.log(e)
        }
      }
      
      resultArr = resultArr.sort((a, b) => +a.pageNum - +b.pageNum)
      res.json(resultArr)
      
    } catch(e) {
      next(e)
    }
  }
  
  async getBaseProfession(req, res, next) {
    try {
      const data = await userService.getBaseProfession()
      res.json(data)
      //console.log('imageName', imageName)
    } catch(e) {
      console.log(e)
      next(e)
    }
  }
  
  async getHomeImageName(req, res, next) {
    try {
      const imageName = await userService.getHomeImageName()
      res.json(imageName)
      //console.log('imageName', imageName)
    } catch(e) {
      console.log(e)
      next(e)
    }
  }
  
  async getPriceInfo(req, res, next) {
    try {
      const priceInfo = await userService.getPriceInfo()
      res.json(priceInfo)
      //console.log('priceInfo', priceInfo)
    } catch(e) {
      console.log(e)
      next(e)
    }
  }
  
  async getUpdateInfo(req, res, next) {
    try {
      const priceInfo = await userService.getUpdateInfo()
      res.json(priceInfo)
    } catch(e) {
      console.log(e)
      next(e)
    }
  }
}


module.exports = new UserController()