const sequelize = require('../db')
const {DataType, DataTypes} = require('sequelize')

const User = sequelize.define('user', {
  id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
  email: {type: DataTypes.STRING, required: true},
  nickname: {type: DataTypes.STRING, required: true},
  password: {type: DataTypes.STRING, required: true},
  isActivated: {type: DataTypes.TINYINT, default: 0},
  activationLink: {type: DataTypes.STRING,},
  sex: {type: DataTypes.STRING,default: 'Male'},
  avatar: {type: DataTypes.STRING,default: ''},
  text: {type: DataTypes.STRING,default: ''},
  accsessLevel: {type: DataTypes.STRING,default: 'Default'},
  birthday: {type: DataTypes.DATE},
  numGame: {type: DataTypes.INTEGER,default: 0},
  numWinGame: {type: DataTypes.INTEGER,default: 0},
  hiddenBirthday: {type: DataTypes.TINYINT,default: 0}
})

const Token = sequelize.define('token', {
  id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
  userId: {type: DataTypes.INTEGER},
  refreshToken: {type: DataTypes.STRING, required: true}
})

const DiscordAuthId = sequelize.define('discordAuthId', {
  id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
  discordId: {type: DataTypes.STRING}
})

const BlackListWords = sequelize.define('BlackListWords', {
  id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
  word: {type: DataTypes.STRING, required: true}
})
User.hasOne(Token)
User.hasOne(DiscordAuthId)

module.exports = {
  User,
  Token,
  BlackListWords,
  DiscordAuthId
}