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
//import { Op } from '@sequelize/core';

const forbiddenCharacters = [
  '..', '__', '  '
]

function testNicknameKey(key) {
  return /[a-zA-Z]/.test(key) ||
    /[а-яА-Я]/.test(key) ||
    /[0-9]/.test(key) ||
    key==="_" ||
    key==="." ||
    key===" "
}


class UserService {
  async registration(nickname, email, password) {
    const forbiddenCharacters = await UserModel.BlackListWords.findAll()
    
    if (forbiddenCharacters) {
      forbiddenCharacters.forEach(word => {
        if (nickname.toLowerCase().includes(word.word.toLowerCase())) {
          throw ApiError.BadRerquest(`Данный ник недопустим`, [{input: 'nickname', type: 'Inadmissible data'}])
        }
      })
    }
    const candidateNickName = await UserModel.User.findOne({where: {nickname}})
    if (candidateNickName) {
      throw ApiError.BadRerquest(`Пользователь с таким ником уже существует`,
        [{input: 'nickname', type: 'Already exist'}])
      
    }
    const candidate = await UserModel.User.findOne({where: {email}})
    if (candidate) {
      throw ApiError.BadRerquest(`Пользователь с таким e-mail уже существует`,
        [{input: 'email', type: 'Already exist'}])
    }
    const hashPassword = await bcrypt.hash(password, 3)
    const activationLink = uuid.v4()
    const user = await UserModel.User.create({nickname, email, password: hashPassword, activationLink})
    // const userData = await UserModel.User.findOne({where: {email}})
    await mailService.sendactivationMail(email, `${process.env.API_URL}/api/activate/${activationLink}`)
    
    // const userDto = new UserDto(user)
    // const tokens = tokenService.generateTokens({...userDto})
    // await tokenService.saveToken(userDto.id, tokens.refreshToken)
    
    //return {
    //   ...tokens,
    //   user: userDto
    // }
  }
  
  async activate(activationLink) {
    const user = await UserModel.User.findOne({where: {activationLink}})
    if (!user) {
      throw ApiError.BadRerquest('Error link')
    }
    user.isActivated = 1
    await user.save()
    const userDto = new UserDto(user)
    const tokens = tokenService.generateTokens({...userDto})
    await tokenService.saveToken(userDto.id, tokens.refreshToken)
    return {
      ...tokens,
      user: userDto
    }
  }
  
  
  async login(login, password) {
    let user = null
    if (emailTest(login)) {
      user = await UserModel.User.findOne({where: {email: login}})
      if (!user) {
        throw ApiError.BadRerquest(`Пользователь с таким e-mail не существует`,
          [{input: 'nickname', type: 'Missing data'}])
      }
    }
    else {
      user = await UserModel.User.findOne({where: {nickname: login}})
      if (!user) {
        throw ApiError.BadRerquest(`Пользователь с таким ником не существует`,
          [{input: 'nickname', type: 'Missing data'}])
      }
    }
    const isBlock = await UserModel.BlackListUsers.findOne({where: {userId: user.id}})
    if (isBlock) {
      throw ApiError.BadRerquest('Пользователь заблокирован', [{input: 'nickname', type: 'user Blocked'}])
    }
    console.log(user)
    const isPassEquals = await bcrypt.compare(password, user.password)
    if (!isPassEquals) {
      throw ApiError.BadRerquest('Неверный пароль', [{input: 'password', type: 'Wrong password'}])
    }
    if (user.isActivated!==1) {
      throw ApiError.BadRerquest(`Почта данного аккаунта не подтверждена`,
        [{input: 'nickname', type: 'Missing data'}])
    }
    const userDto = new UserDto(user)
    const tokens = tokenService.generateTokens({...userDto})
    await tokenService.saveToken(userDto.id, tokens.refreshToken)
    return {
      ...tokens,
      user: userDto
    }
  }
  
  async logout(refreshToken) {
    return await tokenService.removeToken(refreshToken)
  }
  
  async refresh(refreshToken) {
    if (!refreshToken) {
      throw ApiError.UnauthorizedError()
    }
    const userData = tokenService.validateRefreshToken(refreshToken)
    const tokenFrom = await tokenService.findToken(refreshToken)
    if (!userData || !tokenFrom) {
      throw ApiError.UnauthorizedError()
    }
    const user = await UserModel.User.findOne({where: {id: userData.id}})
    const userDto = new UserDto(user)
    const tokens = tokenService.generateTokens({...userDto})
    await tokenService.saveToken(userDto.id, tokens.refreshToken)
    return {
      ...tokens,
      user: userDto
    }
  }
  
  async getAllUsers() {
    const users = await UserModel.User.findAll()
    return users
  }
  
  async getUser(userId, refreshToken) {
    let isAdmin = false
    let isUser = false
    if (refreshToken) {
      const tokenData = await UserModel.Token.findOne({where: {refreshToken: refreshToken}})
      console.log(refreshToken)
      if (!tokenData) {
        throw ApiError.UnauthorizedError()
      }
      const thisUser = await UserModel.User.findOne({where: {id: tokenData.userId}})
      console.log(thisUser.id, userId)
      if (thisUser.id.toString()===userId.toString()) {
        isUser = true
      }
      if (thisUser.accsessLevel.toString()==='admin') {
        isAdmin = true
      }
    }
    
    const users = await UserModel.User.findOne({where: {id: userId}})
    if (!users) {
      throw ApiError.BadRerquestUser('Такого пользователя не существует', [{type: 'Wrong user'}])
    }
    let isBan = false
    let isChange = false
    let isBdayHidden = false
    if (users.hiddenBirthday===1) {
      isBdayHidden = true
    }
    const userIsBlock = await UserModel.BlackListUsers.findOne({where: {userId: userId}})
    const userIsDiscord = await UserModel.DiscordAuthId.findOne({where: {userId: userId}})
    if (userIsDiscord) {
      if (!userIsDiscord.changeNickname) {
        isChange = true
      }
      users.dataValues.isChange = isChange
    }
    if (userIsBlock) {
      isBan = true
    }
    users.dataValues.isBanned = isBan
    console.log(isBdayHidden, isAdmin, isUser)
    if (isBdayHidden && !isAdmin && !isUser) {
      delete users.dataValues.birthday
    }
    return users
  }
  
  async connectionDiscord(code) {
    const resp = await axios.post('https://discord.com/api/oauth2/token',
      new URLSearchParams({
        'client_id': process.env.CLIENT_ID,
        'client_secret': process.env.CLIENT_SECRET,
        'grant_type': 'authorization_code',
        'redirect_uri': process.env.REDIRECT_URI,
        'code': code
      }),
      {
        headers:
          {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
      })
    // res.send('Logged In: ' + JSON.stringify(resp.data));
    
    
    console.log()
    const access_token = resp.data['access_token']
    const token_type = resp.data['token_type']
    console.log(access_token, token_type)
    const user = await axios.get('https://discord.com/api/v10/users/@me', {
      headers:
        {
          'Authorization': `Bearer ${access_token}`,
        }
    })
    console.log(user.data)
    const userId = user.data['id']
    let nickname = user.data['username']
    const email = user.data['email']
    // const avatar = user.data['avatar']
    const isNickname = await UserModel.User.findOne({where: {nickname: nickname}})
    const candidate = await UserModel.DiscordAuthId.findOne({where: {discordId: userId}})
    const candidateUser = await UserModel.User.findOne({where: {email: email}})
    if (!candidate) {
      let userDto = null
      if (!candidateUser) {
        const password = gen_password(16)
        const hashPassword = await bcrypt.hash(password, 3)
        const user = await UserModel.User.create(
          {email, password: hashPassword, isActivated: 1})
        if (isNickname) {
          nickname += user.id.toString()
        }
        user.nickname = nickname
        user.save()
        userDto = new UserDto(user)
        
      }
      else {
        userDto = new UserDto(candidateUser)
      }
      await UserModel.DiscordAuthId.create({userId: userDto.id, discordId: userId})
      const tokens = tokenService.generateTokens({...userDto})
      await tokenService.saveToken(userDto.id, tokens.refreshToken)
      
      return {
        ...tokens,
        user: userDto
      }
    }
    const candidateDisUser = await UserModel.User.findOne({where:{id:candidate.userId}})
    
    if (!candidateDisUser.isActivated) {
      candidateDisUser.isActivated = 1
      candidateDisUser.save()
    }
    
    const userDto1 = new UserDto(candidateDisUser)
    const tokens = tokenService.generateTokens({...userDto1})
    await tokenService.saveToken(userDto1.id, tokens.refreshToken)
    return {
      ...tokens,
      user: userDto1
    }
    
  }

//   async connectionVK(code) {
//
//     const resp = await axios.get(
//       `https://oauth.vk.com/access_token?client_id=${process.env.APP_ID}&client_secret=${process.env.CLIENT_SECRETVK}&redirect_uri=${process.env.REDIRECT_URLVK}&display=page&code=${code}&scope=email&v=5.131`)
//
//
//     const data = await axios.get(
//       `https://api.vk.com/method/users.get?access_token=${resp.data['access_token']}&user_ids=${resp.data['user_id']}&fields=domain,sex,bdate&v=5.131`)
//     let email = false
//     const candidateVK = await UserModel.VkAuthId.findOne({where: {vkId: resp.data['user_id']}})
//
//     if (!candidateVK) {
//       let userDto = null
//       let candidateEmail
//       if (resp.data['email']) {
//         console.log(resp.data['email'], data.data.response[0]['domain'], resp.data['user_id'],
//           data.data.response[0]['sex'])
//         candidateEmail = await UserModel.User.findOne({where: {email: resp.data['email']}})
//         email = true
//       }
//       if (!candidateEmail) {
//         let sex = 2
//         if (data.data.response[0]['sex']===2) {
//           sex = 1
//         }
//
//         const password = gen_password(16)
//         const hashPassword = await bcrypt.hash(password, 3)
//         let user
//         let nickname = data.data.response[0]['domain']
//         const isNickname = await UserModel.User.findOne({where: {nickname: data.data.response[0]['domain']}})
//
//         if (email) {
//           user = await UserModel.User.create(
//             {
//               email: resp.data['email'],
//               password: hashPassword,
//               isActivated: 1,
//               sex: sex
//               //birthday: data.data.response[0]['bdate']
//             })
//         }
//         else {
//           user = await UserModel.User.create(
//             {
//               password: hashPassword,
//               isActivated: 1,
//               sex: sex
//              // birthday: data.data.response[0]['bdate']
//             })
//
//         }
//         if (isNickname) {
//           nickname += user.id.toString()
//         }
//         user.nickname = nickname
//         user.save()
//         userDto = new UserDto(user)
//
//       }
//       else {
//         userDto = new UserDto(candidateEmail)
//       }
//
//
//       await UserModel.VkAuthId.create({userId: userDto.id, vkId: resp.data['user_id']})
//       const tokens = tokenService.generateTokens({...userDto})
//       await tokenService.saveToken(userDto.id, tokens.refreshToken)
//
//       return {
//         ...tokens,
//         user: userDto
//       }
//
//     }
//     const candidateUser = await UserModel.User.findOne({where:{id:candidateVK.userId}})
//     if (!candidateUser.isActivated) {
//           candidateUser.isActivated = 1
//           candidateUser.save()
//         }
//
//         const userDto1 = new UserDto(candidateUser)
//         const tokens = tokenService.generateTokens({...userDto1})
//         await tokenService.saveToken(userDto1.id, tokens.refreshToken)
//         return {
//           ...tokens,
//           user: userDto1
//         }
//
//
//   }
//
  
  async uploadAvatar(file, userId) {
    const extension = (path.extname(file['name'])).toLowerCase()
    //const type = file['name'].replace('image/','')
    console.log(extension)
    const user = await UserModel.User.findOne({where: {id: userId}})
    const avatarName = uuid.v4() + `${extension}`
    
    if (!user) {
      throw ApiError.BadRerquestUser('Такого пользователя не существует', [{type: 'Wrong user'}])
    }
    
    if (user.avatar) {
      console.log("LOL")
      try {
        fs.unlinkSync(process.env.STATIC_PATH + "\\" + user.avatar)
      } catch(e) {
        console.log(e)
      }
      //file.delete(process.env.STATIC_PATH + "\\" + user.avatar)
    }
    
    
    file.mv(process.env.STATIC_PATH + "\\" + avatarName)
    console.log(user.avatar)
    user.avatar = avatarName
    user.save()
    console.log(user.avatar)
    return avatarName
  }
  
  
  async deleteAvatar(userId) {
    
    
    const user = await UserModel.User.findOne({where: {id: userId}})
    
    if (!user) {
      throw ApiError.BadRerquestUser('Такого пользователя не существует', [{type: 'Wrong user'}])
    }
    if (user.avatar) {
      console.log("LOL")
      try {
        fs.unlinkSync(process.env.STATIC_PATH + "\\" + user.avatar)
      } catch(e) {
        console.log(e)
      }
      user.avatar = null
      user.save()
    }
    return user
  }
  
  async updateUser(data, refreshToken, userId) {
    if (objIsEmpty(data)) {
      throw ApiError.BadRerquest('Data missing', [])
    }
    console.log("DATA BABSDHBSAJDHASBJDKHASBKHJD", data)
    
    // const id = await UserModel.Token.findOne({where: {refreshToken: refreshToken}})
    // if (!id) {
    //   throw ApiError.UnauthorizedError()
    // }
    
    const user = await UserModel.User.findOne({where: {id: userId}})
    if (!user) {
      throw ApiError.BadRerquestUser('Такого пользователя не существует', [{type: 'Wrong user'}])
    }
    // console.log(id.dataValues.userId)
    // console.log('Проверка', id.id)
    let unCorrectInputs = ['nickname', '.password', 'isActivated', 'activationLink', 'accsessLevel', 'numGame', 'numWinGame']
    for (let key in data) {
      // console.log("KEY BABSDHBSAJDHASBJDKHASBKHJD",key)
      if (!unCorrectInputs.toString().includes(key.toString())) {
        user[key] = data[key]
      }
      else {
        console.log('Попытка смена недопустимого параметра', 'Параметр:', key, 'Значение:', data[key])
      }
      
      
    }
    const newUser = await user.save()
    console.log(newUser.nickname)
    return user
    
    
  }
  
  
  async updateNickname(data, refreshToken, userId) {
    if (objIsEmpty(data)) {
      throw ApiError.BadRerquest('Data missing', [])
    }
    console.log("DATA BABSDHBSAJDHASBJDKHASBKHJD", data)
    
    // const id = await UserModel.Token.findOne({where: {refreshToken: refreshToken}})
    // if (!id) {
    //   throw ApiError.UnauthorizedError()
    // }
    const user = await UserModel.User.findOne({where: {id: userId}})
    if (!user) {
      throw ApiError.BadRerquestUser('Такого пользователя не существует', [{type: 'Wrong user'}])
    }
    
    
    // console.log(id.dataValues.userId)
    // console.log('Проверка', id.id)
    // let unCorrectInputs = ['nickname','.password','isActivated','activationLink','accsessLevel','numGame','numWinGame']
    for (let key in data) {
      // console.log("KEY BABSDHBSAJDHASBJDKHASBKHJD",key)
      if ('nickname'===key.toString()) {
        const candidateNickName = await UserModel.User.findOne({where: {nickname: data[key]}})
        if (candidateNickName) {
          throw ApiError.BadRerquest(`Пользователь с таким ником уже существует`,
            [{input: 'nickname', type: 'Already exist'}])
          
        }
        user[key] = data[key]
      }
      else {
        console.log('Попытка смена недопустимого параметра', 'Параметр:', key, 'Значение:', data[key])
      }
      
      
    }
    const newUser = await user.save()
    console.log(newUser.nickname)
    
    const isChange = await UserModel.DiscordAuthId.findOne({where: {userId: userId}})
    if (isChange) {
      isChange.changeNickname = 1
      isChange.save()
    }
    
    return user
    
    
  }
  
  async resetProfile(refreshToken) {
    if (refreshToken) {
      const tokenData = await UserModel.Token.findOne({where: {refreshToken: refreshToken}})
      console.log(refreshToken)
      if (!tokenData) {
        throw ApiError.UnauthorizedError()
      }
      const thisUser = await UserModel.User.findOne({where: {id: tokenData.userId}})
      if (!thisUser) {
        throw ApiError.BadRerquest(`Такого пользователя не существует`,
          [{input: 'user', type: 'Not'}])
        
      }
      return thisUser
    }
    
    
  }
  
  async reset(email, type) {
    const candidate = await UserModel.User.findOne({where: {email: email}})
    if (!candidate) {
      throw ApiError.BadRerquest(`Пользователя с таким email не существует`,
        [{input: 'email', type: 'Not valid email'}])
    }
    const resetLink = uuid.v4()
    const tokenLinkExp = Date.now() + 60 * 60000
    console.log(new Date())
    
    console.log("qweqweqwe", tokenLinkExp)
    const alreadyReset = await UserModel.ResetPassword.findOne(
      {where: {userId: candidate.id, tokenLinkExp: {[Op.gt]: Date.now()}, isChange: 0, type: type}})
    console.log(alreadyReset)
    if (alreadyReset) {
      if (alreadyReset.type.toString()==='password') {
        throw ApiError.BadRerquest(
          `Запрос на смену пароля уже был отправлен, проверьте почту или же запросить ссылку заново`,
          [{input: 'link', type: 'database'}])
      }
      else {
        throw ApiError.BadRerquest(
          `Запрос на смену email уже был отправлен, проверьте почту или же запросить ссылку заново`,
          [{input: 'link', type: 'database'}])
      }
      
      
    }
    const reset = await UserModel.ResetPassword.create(
      {userId: candidate.id, tokenLink: resetLink, tokenLinkExp: tokenLinkExp, type: type})
    if (!reset) {
      throw ApiError.BadRerquest(`Ошибка при добавлении в базу данных`,
        [{input: 'link', type: 'database'}])
    }
    try {
      if (type.toString() ==='password') {
        await mailService.sendResetPasswordMail(email, `${process.env.API_URL}/api/resetUser/${resetLink}`)
      }
      else {
        await mailService.sendResetEmailMail(email, `${process.env.API_URL}/api/resetUser/${resetLink}`)
      }
    } catch(e) {
      throw ApiError.BadRerquest(`Ошибка при отправке сообщения на почту`,
        [{input: 'email', type: 'sendEmail'}])
    }
    
    
  }
  
  async validationLinkReset(link) {
    const isLink = await UserModel.ResetPassword.findOne(
      {where: {tokenLink: link, tokenLinkExp: {[Op.gt]: Date.now()}, isChange: 0}})
    if (!isLink) {
      throw ApiError.BadRerquest(`Данная ссылка неправильная или не действительная`,
        [{input: 'link', type: 'resetPassword'}])
    }
    
    return isLink
  }
  
  async newPassword(password, userId, idLink) {
    const hashPassword = await bcrypt.hash(password, 3)
    const user = await UserModel.User.findOne({where: {id: userId}})
    if (!user) {
      throw ApiError.BadRerquest(`Данная ссылка неправильная или не действительная`,
        [{input: 'userId', type: 'resetPassword'}])
    }
    const resetPasswordDb = await UserModel.ResetPassword.findOne({where: {id: idLink, userId: userId}})
    if (!resetPasswordDb) {
      throw ApiError.BadRerquest(`Такой ссылки не существует`,
        [{input: 'userId', type: 'resetPassword'}])
    }
    resetPasswordDb.isChange = 1
    resetPasswordDb.save()
    user.password = hashPassword
    user.save()
    
    
  }
  
  async newEmail(email, userId, idLink) {
    
    const user = await UserModel.User.findOne({where: {id: userId}})
    const isEmail = await UserModel.User.findOne({where: {email: email}})
    if (isEmail) {
      throw ApiError.BadRerquest(`Данный email уже зарегистрирован`,
        [{input: 'email', type: 'resetEmail'}])
    }
    if (!user) {
      throw ApiError.BadRerquest(`Данная ссылка неправильная или не действительная`,
        [{input: 'userId', type: 'resetEmail'}])
    }
    const resetPasswordDb = await UserModel.ResetPassword.findOne({where: {id: idLink, userId: userId}})
    if (!resetPasswordDb) {
      throw ApiError.BadRerquest(`Такой ссылки не существует`,
        [{input: 'userId', type: 'resetEmail'}])
    }
    const activationLink = uuid.v4()
    resetPasswordDb.isChange = 1
    resetPasswordDb.save()
    user.activationLink = activationLink
    user.email = email
    user.isActivated = 0
    user.save()
    await mailService.sendactivationMail(email, `${process.env.API_URL}/api/activate/${activationLink}`)
    
  }
  
  
}

function emailTest(value) {
  console.log(value)
  return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,8})+$/.test(value);
}

function gen_password(len) {
  var password = "";
  var symbols = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!№;%:?*()_+=";
  for (var i = 0; i<len; i++) {
    password += symbols.charAt(Math.floor(Math.random() * symbols.length));
  }
  return password;
}

function objIsEmpty(obj) {
  for (let key in obj) {
    return false;
  }
  return true;
}


module.exports = new UserService()