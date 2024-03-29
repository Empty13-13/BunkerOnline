const sequelize = require('../db')
const {DataType, DataTypes} = require('sequelize')

const User = sequelize.define('user', {
  id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
  email: {type: DataTypes.STRING, required: true},
  nickname: {type: DataTypes.STRING, required: true},
  password: {type: DataTypes.STRING, required: true},
  isActivated: {type: DataTypes.TINYINT, defaultValue: 0},
  activationLink: {type: DataTypes.STRING,},
  sex: {type: DataTypes.STRING,defaultValue: "male"},
  avatar: {type: DataTypes.STRING},
  text: {type: DataTypes.STRING,defaultValue: ""},
  accsessLevel: {type: DataTypes.STRING,defaultValue: "default"},
  birthday: {type: DataTypes.DATE},
  numGame: {type: DataTypes.INTEGER,defaultValue: 0},
  numWinGame: {type: DataTypes.INTEGER,defaultValue: 0},
  hiddenBirthday: {type: DataTypes.TINYINT,defaultValue: 0}
})

const Token = sequelize.define('token', {
  id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
  userId: {type: DataTypes.INTEGER},
  refreshToken: {type: DataTypes.STRING, required: true}
})

const DiscordAuthId = sequelize.define('discordAuthId', {
  id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
  userId: {type: DataTypes.INTEGER},
  changeNickname: {type: DataTypes.TINYINT, defaultValue: 0},
  discordId: {type: DataTypes.STRING}
})

const VkAuthId = sequelize.define('vkId', {
  id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
  userId: {type: DataTypes.INTEGER},
  vkId: {type: DataTypes.STRING}
})

const BlackListWords = sequelize.define('BlackListWords', {
  id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
  word: {type: DataTypes.STRING, required: true}
})

const BlackListUsers = sequelize.define('BlackListUsers', {
  id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
  userId: {type: DataTypes.INTEGER},
})

const ResetPassword = sequelize.define('resetPassword', {
  id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
  userId: {type: DataTypes.INTEGER},
  tokenLink: {type: DataTypes.STRING,},
  tokenLinkExp: {type: DataTypes.DATE},
  isChange:{type: DataTypes.TINYINT, defaultValue: 0},
  type: {type: DataTypes.STRING}
})


User.hasOne(Token)
User.hasOne(DiscordAuthId)
User.hasOne(VkAuthId)
User.hasOne(BlackListUsers)
User.hasOne(ResetPassword)

module.exports = {
  User,
  Token,
  BlackListWords,
  DiscordAuthId,
  VkAuthId,
  BlackListUsers,
  ResetPassword
}