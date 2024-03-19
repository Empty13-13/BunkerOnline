const bcrypt = require('bcrypt')
const uuid = require('uuid')
const mailService = require('./mail-service')
const UserModel = require('../model/models')
const tokenService = require('./token-service')
const UserDto = require('../dtos/user-dto')
const ApiError = require('../exceptions/api-error')
const axios = require('axios')
require('dotenv').config()

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
    const userData = await UserModel.User.findOne({where: {email}})
    await mailService.sendactivationMail(email, `${process.env.API_URL}/api/activate/${activationLink}`)
    
    const userDto = new UserDto(user)
    const tokens = tokenService.generateTokens({...userDto})
    await tokenService.saveToken(userDto.id, tokens.refreshToken)
    
    return {
      ...tokens,
      user: userDto
    }
  }
  
  async activate(activationLink) {
    const user = await UserModel.User.findOne({where: {activationLink}})
    if (!user) {
      throw ApiError.BadRerquest('Error link')
    }
    user.isActivated = 1
    await user.save()
  }
  
  
  async login(login, password) {
    let user = null
    if (emailTest(login)) {
      user = await UserModel.User.findOne({where: {email: login}})
      if (!user) {
        throw ApiError.BadRerquest(`Пользователь с таким e-mail не существует`,
          [{input: 'email', type: 'Missing data'}])
      }
    }
    else {
      user = await UserModel.User.findOne({where: {nickname: login}})
      if (!user) {
        throw ApiError.BadRerquest(`Пользователь с таким ником не существует`,
          [{input: 'nickname', type: 'Missing data'}])
      }
    }
    
    console.log(user)
    const isPassEquals = await bcrypt.compare(password, user.password)
    if (!isPassEquals) {
      throw ApiError.BadRerquest('Неверный пароль', [{input: 'password', type: 'Wrong password'}])
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

  async getUser(userId) {
    const users = await UserModel.User.findOne({where:{id:userId}})
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
    const userId = user.data['id']
    const username = user.data['username']
    const email = user.data['email']
    const avatar = user.data['avatar']
    const candidate = await UserModel.DiscordAuthId.findOne({where: {discordId: userId}})
    const candidateUser = await UserModel.User.findOne({where: {email: email}})
    if (!candidate) {
        let userDto = null
      if (!candidateUser) {
        const password = gen_password(16)
        const hashPassword = await bcrypt.hash(password, 3)
        const user = await UserModel.User.create({nickname: username, email, password: hashPassword, isActivated: 1})
        userDto = new UserDto(user)

      }
      else {
        userDto = new UserDto(candidateUser)
      }

      await UserModel.DiscordAuthId.create({id: userDto.id, discordId: userId})
      const tokens = tokenService.generateTokens({...userDto})
      await tokenService.saveToken(userDto.id, tokens.refreshToken)
      
      return {
        ...tokens,
        user: userDto
      }
    }
    const userDto1 = new UserDto(candidateUser)
    const tokens = tokenService.generateTokens({...userDto1})
    await tokenService.saveToken(userDto1.id, tokens.refreshToken)
    return {
      ...tokens,
      user: userDto1
    }

  }
  async updateUser(data,refreshToken){
    const id = await UserModel.Token.findOne({where:{refreshToken:refreshToken}})
    if(!id){
      throw ApiError.UnauthorizedError()
    }
    const user = await UserModel.User.findOne({where:{id:id.id}})
    for (let key in data){

      user[key]=data[key]

    }
    const newUser =await user.save()
    console.log(newUser)
    return user


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


module.exports = new UserService()