const bcrypt = require('bcrypt')
const uuid = require('uuid')
const mailService = require('./mail-service')
const UserModel = require('../model/models')
const tokenService = require('./token-service')
const UserDto = require('../dtos/user-dto')
const ApiError = require('../exceptions/api-error')

class UserService {
  async registration(nickname, email, password) {
    const forbiddenCharacters = await UserModel.BlackListWords.findAll()
    
    if (forbiddenCharacters) {
      forbiddenCharacters.forEach(word => {
        if (nickname.toLowerCase().includes(word.word.toLowerCase())) {
          throw ApiError.BadRerquest(`Данный ник недопустим`,[{input:'nickname',type:'Inadmissible data'}])
        }
      })
    }
    const candidateNickName = await UserModel.User.findOne({where: {nickname}})
    if (candidateNickName) {
      throw ApiError.BadRerquest(`Пользователь с таким ником уже существует`,[{input:'nickname',type:'Already exist'}])
      
    }
    const candidate = await UserModel.User.findOne({where: {email}})
    if (candidate) {
      throw ApiError.BadRerquest(`Пользователь с таким e-mail уже существует`,[{input:'email',type:'Already exist'}])
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
        throw ApiError.BadRerquest(`Пользователь с таким e-mail не существует`,[{input:'email',type:'Missing data'}])
      }
    }
    else {
      user = await UserModel.User.findOne({where: {nickname: login}})
      if (!user) {
        throw ApiError.BadRerquest(`Пользователь с таким ником не существует`,[{input:'nickname',type:'Missing data'}])
      }
    }
    
    console.log(user)
    const isPassEquals = await bcrypt.compare(password, user.password)
    if (!isPassEquals) {
      throw ApiError.BadRerquest('Неверный пароль',[{input:'password',type:'Wrong password'}])
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
  
}

function emailTest(value) {
  console.log(value)
  return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,8})+$/.test(value);
}


module.exports = new UserService()