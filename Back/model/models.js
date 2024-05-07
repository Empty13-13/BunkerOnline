const sequelize = require('../db')
const {DataType, DataTypes} = require('sequelize')

const User = sequelize.define('user', {
  id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
  email: {type: DataTypes.STRING, required: true},
  nickname: {type: DataTypes.STRING, required: true},
  password: {type: DataTypes.STRING, required: true},
  isActivated: {type: DataTypes.TINYINT, defaultValue: 0},
  activationLink: {type: DataTypes.STRING,},
  sex: {type: DataTypes.STRING, defaultValue: null},
  avatar: {type: DataTypes.STRING},
  text: {type: DataTypes.STRING, defaultValue: ""},
  accsessLevel: {type: DataTypes.STRING, defaultValue: "default"},
  birthday: {type: DataTypes.DATE},
  numGame: {type: DataTypes.INTEGER, defaultValue: 0},
  numWinGame: {type: DataTypes.INTEGER, defaultValue: 0},
  hiddenBirthday: {type: DataTypes.TINYINT, defaultValue: 0},
  isUsedSystemBasePack: {type: DataTypes.TINYINT, defaultValue: 1},
  isUsedSystemAdvancePack : {type: DataTypes.TINYINT, defaultValue: 0}
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
  isChange: {type: DataTypes.TINYINT, defaultValue: 0},
  type: {type: DataTypes.STRING}
})

const NoRegUsers = sequelize.define('noRegUsers', {
  id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
  noRegToken: {type: DataTypes.STRING},
  isBlock: {type: DataTypes.TINYINT, defaultValue: 0}
})

const GameRooms = sequelize.define('gameRooms', {
  id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
  idRoom: {type: DataTypes.STRING},
  hostId: {type: DataTypes.INTEGER},
  isStarted: {type: DataTypes.TINYINT, defaultValue: 0},
  isHidden: {type: DataTypes.TINYINT, defaultValue: 0},
  bunkerSize: {type: DataTypes.INTEGER},
  maxSurvivor: {type: DataTypes.INTEGER},
  catastrophe: {type: DataTypes.INTEGER},
  bunkerTime: {type: DataTypes.INTEGER},
  bunkerLocation: {type: DataTypes.INTEGER},
  bunkerBedroom: {type: DataTypes.INTEGER},
  bunkerItems1: {type: DataTypes.INTEGER},
  bunkerItems2: {type: DataTypes.INTEGER},
  bunkerItems3: {type: DataTypes.INTEGER},
  bunkerFood: {type: DataTypes.INTEGER},
  imageId: {type: DataTypes.INTEGER}
})

const RoomSession = sequelize.define('roomSession', {
  id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
  userId: {type: DataTypes.INTEGER},
  isPlayer: {type: DataTypes.TINYINT, defaultValue: 1},
  usePack: {type: DataTypes.STRING},
  sex: {type: DataTypes.STRING},
  body: {type: DataTypes.STRING},
  height: {type: DataTypes.STRING},
  trait: {type: DataTypes.STRING},
  profession: {type: DataTypes.STRING},
  health: {type: DataTypes.STRING},
  hobbies: {type: DataTypes.STRING},
  phobia: {type: DataTypes.STRING},
  inventory: {type: DataTypes.STRING},
  backpack: {type: DataTypes.STRING},
  addInfo: {type: DataTypes.STRING},
  spec1: {type: DataTypes.STRING},
  spec2: {type: DataTypes.STRING},
  isMVPRefresh:{type: DataTypes.TINYINT},
  isAlive:{type: DataTypes.TINYINT, defaultValue: 1}
})

const ChartPlayer = sequelize.define('chartPlayer', {
  id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
  name: {type: DataTypes.STRING},
  text: {type: DataTypes.STRING(1500)}
})

const Profession = sequelize.define('profession', {
  id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
  name: {type: DataTypes.STRING},
  description: {type: DataTypes.STRING(800)},
  minAmateurAge: {type: DataTypes.INTEGER},
  minInternAge: {type: DataTypes.INTEGER},
  minMiddleAge: {type: DataTypes.INTEGER},
  minExperiencedAge: {type: DataTypes.INTEGER},
  minExpertAge: {type: DataTypes.INTEGER},
  minProAge: {type: DataTypes.INTEGER}
})

const ChartBunker = sequelize.define('chartBunker', {
  id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
  name: {type: DataTypes.STRING},
  text: {type: DataTypes.STRING(1500)}
})

const ChartPack = sequelize.define('chartPack', {
  id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
  namePack: {type: DataTypes.STRING},
  text: {type: DataTypes.STRING},
  isHidden: {type: DataTypes.TINYINT, defaultValue: 1},
  status: {type: DataTypes.TINYINT, defaultValue: 0} 
})



const PlayerChartPack = sequelize.define('playerChartPack', {})
const ProfessionChartPack = sequelize.define('professionChartPack', {})
const BunkerChartPack = sequelize.define('bunkerChartPack', {})
const UserUsePack = sequelize.define('userUsePack', {})


const SystemSettings = sequelize.define('systemSettings', {
  id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
  nameSetting: {type: DataTypes.STRING},
  value: {type: DataTypes.INTEGER}
})

const CatastropheImage = sequelize.define('catastropheImage', {
  id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
  imageName: {type: DataTypes.STRING},
  catastropheId: {type: DataTypes.INTEGER}
})


User.hasOne(Token)
User.hasOne(DiscordAuthId)
User.hasOne(VkAuthId)
User.hasOne(BlackListUsers)
User.hasOne(ResetPassword)

GameRooms.hasOne(RoomSession)

ChartBunker.hasOne(BunkerChartPack)
ChartPack.hasOne(BunkerChartPack)
ChartPack.hasOne(PlayerChartPack)
ChartPack.hasOne(ProfessionChartPack)
Profession.hasOne(ProfessionChartPack)
ChartPlayer.hasOne(PlayerChartPack)

User.hasOne(UserUsePack)
ChartPack.hasOne(UserUsePack)


module.exports = {
  User,
  Token,
  BlackListWords,
  DiscordAuthId,
  VkAuthId,
  BlackListUsers,
  ResetPassword,
  NoRegUsers,
  GameRooms,
  RoomSession,
  ChartBunker,
  ChartPack,
  ChartPlayer,
  BunkerChartPack,
  PlayerChartPack,
  ProfessionChartPack,
  Profession,
  UserUsePack,
  SystemSettings,
  CatastropheImage
}