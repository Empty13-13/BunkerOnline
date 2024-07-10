const bcrypt = require('bcrypt')
const uuid = require('uuid')
const sequelize = require('../db')
const mailService = require('./mail-service')
const UserModel = require('../model/models')
const tokenService = require('./token-service')
const UserDto = require('../dtos/user-dto')
const UserDtoDiscord = require('../dtos/user-dtoDiscord')
const ApiError = require('../exceptions/api-error')
const playerDataService = require('./playerData-service')
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
    const candidateNickName = await UserModel.User.findOne(
      {where: {nickname: nickname}})
    //sequelize.where(sequelize.fn('BINARY', sequelize.col('nickname')), nickname)s
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
    await UserModel.UserUsePack.create({userId: user.id, chartPackId: 1})
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
      user = await UserModel.User.findOne(
        {where: sequelize.where(sequelize.fn('BINARY', sequelize.col('nickname')), login)})
      if (!user) {
        throw ApiError.BadRerquest(`Пользователь с таким ником не существует`,
          [{input: 'nickname', type: 'Missing data'}])
      }
    }
    const isBlock = await UserModel.BlackListUsers.findOne({where: {userId: user.id}})
    if (isBlock) {
      throw ApiError.BlockedUser('Пользователь заблокирован', [{input: 'nickname', type: 'user Blocked'}])
    }
    // console.log(user)
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
  
  async getUser(userId, token) {
    let isAdmin = false
    let isUser = false
    if (token) {
      const tokenData = tokenService.validateAccessToken(token)
      if (!tokenData) {
        throw ApiError.UnauthorizedError()
      }
      const thisUser = await UserModel.User.findOne({where: {id: tokenData.id}})
      //   console.log(thisUser.id, userId)
      if (thisUser.id.toString()===userId.toString()) {
        isUser = true
      }
      if (thisUser.accsessLevel.toString()==='admin') {
        isAdmin = true
      }
    }
    // console.log('userID',userId)
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
    if (users.refreshNickname) {
      isChange = true
      users.dataValues.isChange = isChange
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
    //   console.log(isBdayHidden, isAdmin, isUser)
    // let birthday = users.dataValues.birthday
    //console.log('isBdayHidden',isBdayHidden)
    if (isBdayHidden && !isAdmin && !isUser) {
      users.dataValues.birthday.setFullYear(0)
      // users.dataValues.birthday = `${users.dataValues.birthday.getDate().toString().padStart(2,'0')}.${(users.dataValues.birthday.getMonth()+1).toString().padStart(2,'0')}`
      //  console.log(users.dataValues.birthday)
    }
    delete users.dataValues.activationLink
    delete users.dataValues.password
    delete users.dataValues.email
    delete users.dataValues.updatedAt
    delete users.dataValues.isUsedSystemAdvancePack
    delete users.dataValues.isUsedSystemBasePack
    delete users.dataValues.refreshNickname
    
    return users
  }
  
  async getPrice() {
    console.log('1')
    try {
      const resp = await axios.get(
        'https://a.ggsel.com/partner/paginate/goods?token=$2y$10$xB37cm37yDYUcQXFC.mtie2sAa.xArJbvq56tVMr97/b8SBEKfFiq&filter[id_goods]=3726124')
      //console.log(resp.data.links)
    } catch(e) {
      console.log(e)
    }
    
    
  }
  
  async connectionDiscord(code, res) {
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
    
    
    //  console.log()
    const access_token = resp.data['access_token']
    const token_type = resp.data['token_type']
    //  console.log(access_token, token_type)
    const user = await axios.get('https://discord.com/api/v10/users/@me', {
      headers:
        {
          'Authorization': `Bearer ${access_token}`,
        }
    })
    // console.log(user.data)
    const userId = user.data['id']
    let nickname = user.data['username']
    const email = user.data['email']
    // const avatar = user.data['avatar']
    const isNickname = await UserModel.User.findOne({where: {nickname: nickname}})
    const candidate = await UserModel.DiscordAuthId.findOne({where: {discordId: userId}})
    //console.log(candidate)
    const candidateUser = await UserModel.User.findOne({where: {email: email}})
    //console.log(candidateUser.userId)
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
        await user.save()
        userDto = new UserDto(user)
        
      }
      else {
        const userIsBlock = await UserModel.BlackListUsers.findOne({where: {userId: candidateUser.userId}})
        if (userIsBlock) {
          return 'banned'
        }
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
    const candidateDisUser = await UserModel.User.findOne({where: {id: candidate.userId}})
    const userIsBlock1 = await UserModel.BlackListUsers.findOne({where: {userId: candidate.userId}})
    if (userIsBlock1) {
      return 'banned'
    }
    
    if (!candidateDisUser.isActivated) {
      candidateDisUser.isActivated = 1
      await candidateDisUser.save()
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
  
  async uploadAvatar(file, userId, token) {
    if (token===null) {
      throw ApiError.UnauthorizedError()
    }
    const userData = tokenService.validateAccessToken(token)
    if (!userData) {
      throw ApiError.UnauthorizedError()
    }
    let tokenId = userData.id
    const extension = (path.extname(file['name'])).toLowerCase()
    //const type = file['name'].replace('image/','')
    //  console.log(extension)
    
    const user = await UserModel.User.findOne({where: {id: userId}})
    if (tokenId===userId) {
      if (extension==='gif') {
        if (user.accsessLevel.toString()!=='mvp' || user.accsessLevel.toString()!=='admin') {
          //  console.log('ZAPRET EPTAAA')
          throw ApiError.BadRerquestUser('Такого пользователя не существует', [{type: 'Acsess Denied'}])
        }
      }
    }
    const avatarName = uuid.v4() + `${extension}`
    
    if (!user) {
      throw ApiError.BadRerquestUser('Такого пользователя не существует', [{type: 'Wrong user'}])
    }
    
    if (user.avatar) {
      //  console.log("LOL")
      try {
        fs.unlinkSync(process.env.STATIC_PATH + "/" + user.avatar)
      } catch(e) {
        console.log(e)
      }
      //file.delete(process.env.STATIC_PATH + "/" + user.avatar)
    }
    
    
    file.mv(process.env.STATIC_PATH + "/" + avatarName)
    //  console.log(user.avatar)
    user.avatar = avatarName
    await user.save()
    //  console.log(user.avatar)
    return avatarName
  }
  
  
  async deleteAvatar(userId) {
    
    
    const user = await UserModel.User.findOne({where: {id: userId}})
    
    if (!user) {
      throw ApiError.BadRerquestUser('Такого пользователя не существует', [{type: 'Wrong user'}])
    }
    if (user.avatar) {
      //   console.log("LOL")
      try {
        fs.unlinkSync(process.env.STATIC_PATH + "/" + user.avatar)
      } catch(e) {
        console.log(e)
      }
      user.avatar = null
      await user.save()
    }
    return user
  }
  
  async updateUser(data, refreshToken, userId) {
    if (objIsEmpty(data)) {
      throw ApiError.BadRerquest('Data missing', [])
    }
    //  console.log("DATA BABSDHBSAJDHASBJDKHASBKHJD", data)
    
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
        // console.log('Попытка смена недопустимого параметра', 'Параметр:', key, 'Значение:', data[key])
      }
      
      
    }
    const newUser = await user.save()
    //  console.log(newUser.nickname)
    return user
    
    
  }
  
  
  async updateNickname(data, refreshToken, userId) {
    if (objIsEmpty(data)) {
      throw ApiError.BadRerquest('Data missing', [])
    }
    //  console.log("DATA BABSDHBSAJDHASBJDKHASBKHJD", data)
    
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
      // console.log("KEY BABSDHBSAJDHASBJDKHASBKHJD",key)s
      if ('nickname'===key.toString()) {
        if (user[key].toLowerCase().toString()!==data[key].toLowerCase().toString()) {
          const candidateNickName = await UserModel.User.findOne(
            {where: {nickname: data[key]}})
          //  console.log('NICKNAME::', data[key])
          //  console.log('candidateNickName::', candidateNickName)
          
          if (candidateNickName) {
            throw ApiError.BadRerquest(`Пользователь с таким ником уже существует`,
              [{input: 'nickname', type: 'Already exist'}])
            
          }
        }
        user[key] = data[key]
      }
      else {
        //   console.log('Попытка смена недопустимого параметра', 'Параметр:', key, 'Значение:', data[key])
      }
      
      
    }
    if (user.accsessLevel==='vip') {
      user.refreshNickname = 0
    }
    await user.save()
    //  console.log(newUser.nickname)
    
    const isChange = await UserModel.DiscordAuthId.findOne({where: {userId: userId}})
    if (isChange) {
      isChange.changeNickname = 1
      await isChange.save()
    }
    
    return user
    
    
  }
  
  async resetProfile(refreshToken) {
    if (refreshToken) {
      const tokenData = await UserModel.Token.findOne({where: {refreshToken: refreshToken}})
      //    console.log(refreshToken)
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
    //  console.log(new Date())
    
    //  console.log("qweqweqwe", tokenLinkExp)
    const alreadyReset = await UserModel.ResetPassword.findOne(
      {where: {userId: candidate.id, tokenLinkExp: {[Op.gt]: Date.now()}, isChange: 0, type: type}})
    //  console.log(alreadyReset)
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
      if (type.toString()==='password') {
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
    await resetPasswordDb.save()
    user.password = hashPassword
    await user.save()
    
    
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
    await resetPasswordDb.save()
    user.activationLink = activationLink
    user.email = email
    user.isActivated = 0
    await user.save()
    await mailService.sendactivationMail(email, `${process.env.API_URL}/api/activate/${activationLink}`)
    
  }
  
  async gen_roomLink() {
    let isValid = false
    while (!isValid) {
      var link = "";
      var symbols = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      for (var i = 0; i<5; i++) {
        link += symbols.charAt(Math.floor(Math.random() * symbols.length));
      }
      let isRoom = await UserModel.GameRooms.findOne({where: {idRoom: link}})
      if (!isRoom) {
        isValid = true
      }
    }
    return link;
  }
  
  async userGames(token, noRegToken) {
    
    //  console.log('Game Uploaded')
    let tokenId = null
    let noRegId = null
    if (token) {
      const userData = tokenService.validateAccessToken(token)
      if (!userData) {
        throw ApiError.UnauthorizedError()
      }
      tokenId = userData.id
    }
    const isValidNoRegToken = await UserModel.NoRegUsers.findOne({where: {noRegToken: noRegToken}})
    if (isValidNoRegToken) {
      
      noRegId = -Math.abs(isValidNoRegToken.id)
    }
    let data = await getGamesData(tokenId, noRegId)
    
    return data
    
  }
  
  async allUsersGames() {
    
    const data = await UserModel.GameRooms.findAll({where: {isStarted: 1, isHidden: 0}})
    if (!data) {
      return null
    }
    const dataRooms = await getNickName(data)
    
    return dataRooms
    
  }
  
  async getHomeImageName() {
    let image = await UserModel.CatastropheImage.findAll({where: {favourite: 1}, raw: true})
    let index = playerDataService.getRandomInt(0, image.length - 1)
//     let system = await UserModel.SystemSettings.findAll()
//     if(system.homeImageName!==null){
//
//     }
    if (image[index].imageName) {
      return {imageName: image[index].imageName}
    }
    else {
      return {iamgeName: null}
    }
  }
  
  async changePack(token, idPack, isUse) {
    
    const userData = tokenService.validateAccessToken(token)
    if (!userData) {
      throw ApiError.UnauthorizedError()
    }
    let isSystemPack = false
    let systemData = {}
    let systemSettings = await UserModel.SystemSettings.findAll({where: {nameSetting: ['basePack', 'advancePack']}})
    for (let item of systemSettings) {
      systemData[item.nameSetting] = item.value
      if (item.value===idPack) {
        isSystemPack = true
      }
    }
    let user = await UserModel.User.findOne({where: {id: userData.id}})
    let userUsePack = await UserModel.UserUsePack.findAll({where: {userId: user.id}})
    let userPacks = []
    for (let item of userUsePack) {
      userPacks.push(item.chartPackId)
    }
    const packs = await UserModel.ChartPack.findAll({
      attributes: ['id', 'namePack', 'status', 'text'],
      where: {
        isHidden: 0, id: {
          [Op.and]: [
            {[Op.ne]: systemData.basePack},
            {[Op.ne]: systemData.advancePack},
            userPacks
          ]
        }
      }
    })
    
    
    let basePack = []
    let advancePack = []
    
    for (let pack of packs) {
      if (!!pack.status) {
        advancePack.push(pack.id)
      }
      else {
        basePack.push(pack.id)
      }
    }
    let isUseBaseSystemPack = false
    let isUseAdvanceSystemPack = false
    
    if (user.isUsedSystemBasePack) {
      basePack.push(systemData.basePack)
      isUseBaseSystemPack = true
    }
    if (user.isUsedSystemAdvancePack) {
      advancePack.push(systemData.advancePack)
      isUseAdvanceSystemPack = true
    }
    let thisPack = await UserModel.ChartPack.findOne({where: {id: idPack}})
    
    if (isUse) {
      if (isSystemPack && thisPack.status===1) {
        user.isUsedSystemAdvancePack = 1
        //await user.save()
        // console.log('LOOOL')
      }
      else if (isSystemPack && thisPack.status===0) {
        user.isUsedSystemBasePack = 1
        //await user.save()
      }
      else {
        await UserModel.UserUsePack.create({userId: user.id, chartPackId: idPack})
      }
      if (user.accsessLevel.toString()==='vip') {
        if (isUseBaseSystemPack && thisPack.status===0) {
          user.isUsedSystemBasePack = 0
          // await user.save()
        }
        else if (isUseAdvanceSystemPack && thisPack.status===1) {
          user.isUsedSystemAdvancePack = 0
          //  await user.save()
        }
        else if (thisPack.status===0) {
          await UserModel.UserUsePack.destroy({where: {userId: user.id, chartPackId: basePack[0]}})
        }
        else if (thisPack.status===1 && advancePack.length!==0) {
          await UserModel.UserUsePack.destroy({where: {userId: user.id, chartPackId: advancePack[0]}})
        }
      }
      await user.save()
    }
    else {
      if (thisPack.status===0 && basePack.length<=1) {
        throw ApiError.BadRerquest(`У вас должен быть включен хотя бы один базовый пак`)
      }
      if (isSystemPack && thisPack.status===1) {
        user.isUsedSystemAdvancePack = 0
      }
      else if (isSystemPack && thisPack.status===0) {
        user.isUsedSystemBasePack = 0
      }
      else {
        await UserModel.UserUsePack.destroy({where: {userId: user.id, chartPackId: thisPack.id}})
      }
      await user.save()
    }
  }
  
  async allPacks(token) {
    
    const userData = tokenService.validateAccessToken(token)
    if (!userData) {
      throw ApiError.UnauthorizedError()
    }
    let systemData = {}
    let systemSettings = await UserModel.SystemSettings.findAll({where: {nameSetting: ['basePack', 'advancePack']}})
    for (let item of systemSettings) {
      systemData[item.nameSetting] = item.value
      
    }
    const packs = await UserModel.ChartPack.findAll({
      attributes: ['id', 'ageRestriction', 'namePack', 'status', 'text'],
      where: {
        isHidden: 0, id: {
          [Op.and]: [
            {[Op.ne]: systemData.basePack},
            {[Op.ne]: systemData.advancePack}
          ]
        }
      }
    })
    
    //   console.log('PACKS',packs)
    if (!packs) {
      return null
    }
    let alivePacks = []
    for (let item of packs) {
      alivePacks.push(item.id)
    }
    const userPacks = await UserModel.UserUsePack.findAll({where: {userId: userData.id, chartPackId: alivePacks}})
    let data = []
    let user = await UserModel.User.findOne({where: {id: userData.id}})
    //   console.log(userPacks)
    const systemPacks = await UserModel.ChartPack.findAll(
      {where: {id: [systemData.basePack, systemData.advancePack]}})
    for (let item of systemPacks) {
      let dataPacks = {}
      dataPacks.id = item.id
      dataPacks.namePack = item.namePack
      dataPacks.status = item.status
      dataPacks.text = item.text
      dataPacks.isUse = false
      
      if (item.id===systemData.basePack && user.isUsedSystemBasePack) {
        dataPacks.isUse = true
      }
      else if (item.id===systemData.advancePack && user.isUsedSystemAdvancePack) {
        dataPacks.isUse = true
      }
      dataPacks.systemPack = true
      data.push(dataPacks)
    }
    if (packs) {
      for (let item of packs) {
        let dataPacks = {}
        dataPacks.id = item.id
        dataPacks.namePack = item.namePack
        dataPacks.status = item.status
        dataPacks.text = item.text
        dataPacks.isUse = false
        dataPacks.systemPack = false
        if (item.ageRestriction===1) {
          dataPacks.ageRestriction = true
        }
        if (userPacks) {
          for (let pack of userPacks) {
            if (item.id===pack.chartPackId) {
              dataPacks.isUse = true
            }
          }
        }
        data.push(dataPacks)
      }
    }
    
    
    return data
  }
  
  async getOtherText(name) {
    if (name==='all') {
      let a = await UserModel.OtherTexts.findAll()
      let resultObj = a.reduce((old, item) => {
        old[item.name] = item.text
        return old
      }, {})
      return resultObj
    }
    else {
      return await UserModel.OtherTexts.findOne({where: {name}})
    }
  }
  
  async getPriceInfo() {
    return await UserModel.prices.findAll()
  }
}

async function getNickName(user) {
  
  //console.log('123123123',data)
  let dataRooms = null
  let hostId = user.hostId
  if (hostId<0) {
    hostId = Math.abs(hostId)
    dataRooms = ({nickname: `Гость#${hostId}`, idRoom: user.idRoom})
  }
  else {
    const dataUser = await UserModel.User.findOne({where: {id: hostId}})
    dataRooms = ({nickname: dataUser.nickname, idRoom: user.idRoom})
  }
  
  return dataRooms
}

async function getGamesData(userId, noregUserId) {
  let data = []
  let dataAllGames = []
  let userJoinGame
  const allGameRoom = await UserModel.GameRooms.findAll()
  if (allGameRoom) {
    // console.log('AllGameRoom',allGameRoom)
    let idUserGame = []
    if (userId && noregUserId===null) {
      userJoinGame = await UserModel.RoomSession.findAll({where: {userId: userId}})
      
    }
    else if (userId===null && noregUserId) {
      userJoinGame = await UserModel.RoomSession.findAll({where: {userId: noregUserId}})
    }
    else {
      userJoinGame = await UserModel.RoomSession.findAll({where: {userId: [noregUserId, userId]}})
    }
    for (let user of userJoinGame) {
      idUserGame.push(user.gameRoomId)
    }
    for (let gameRoom of allGameRoom) {
      
      
      if (idUserGame.includes(gameRoom.id)) {
        const countPlayers = await UserModel.RoomSession.findAndCountAll(
          {where: {gameRoomId: gameRoom.id, isPlayer: 1}})
        let isHost = false
        if (gameRoom.hostId===userId || gameRoom.hostId===noregUserId) {
          isHost = true
          
        }
        data.push({
          idRoom: gameRoom.idRoom,
          countPlayers: countPlayers.count,
          isStarted: !!+gameRoom.isStarted,
          dataCreate: gameRoom.createdAt,
          isHost: isHost
        })
      }
      else {
        if (gameRoom.isStarted===1 && gameRoom.isHidden===0) {
          dataAllGames.push(await getNickName(gameRoom))
        }
        
      }
      
      
    }
    
    
  }

//
//   const userJoinGame = await UserModel.RoomSession.findAll({where: {userId: userId}})
//   if (userJoinGame) {
//     for (const room of userJoinGame) {
//       let isRoomExist = false
//       const gameRoom = await UserModel.GameRooms.findOne({where: {id: room.gameRoomId}})
//       const countPlayers = await UserModel.RoomSession.findAndCountAll({where: {gameRoomId: room.gameRoomId}})
//       if (dataRooms) {
//         for (let i = 0; i<dataRooms.length; i++) {
//           if (dataRooms[i].idRoom===gameRoom.idRoom) {
//             isRoomExist = true
//             break
//           }
//         }
//       }
//       if (!isRoomExist) {
//         data.push({
//           idRoom: gameRoom.idRoom,
//           countPlayers: countPlayers.count,
//           isStarted: !!+gameRoom.isStarted,
//           dataCreate: gameRoom.createdAt
//         })
//       }
//     }
//   }
  return {userGame: data, allGames: dataAllGames}
  
}

function emailTest(value) {
//  console.log(value)
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