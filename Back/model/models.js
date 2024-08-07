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
  isUsedSystemAdvancePack: {type: DataTypes.TINYINT, defaultValue: 0},
  updateDate: {type: DataTypes.DATE},
  endDate: {type: DataTypes.DATE},
  refreshNickname: {type: DataTypes.TINYINT, defaultValue: 0}
})

const Token = sequelize.define('token', {
  id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
  userId: {type: DataTypes.INTEGER},
  refreshToken: {type: DataTypes.STRING(1000), required: true}
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
  bunkerCreated: {type: DataTypes.INTEGER},
  bunkerBedroom: {type: DataTypes.INTEGER},
  bunkerItems1: {type: DataTypes.INTEGER},
  bunkerItems2: {type: DataTypes.INTEGER},
  bunkerItems3: {type: DataTypes.INTEGER},
  creatorId: {type: DataTypes.INTEGER},
  bunkerItemsOthers: {type: DataTypes.STRING(1000)},
  bunkerFood: {type: DataTypes.INTEGER},
  imageId: {type: DataTypes.INTEGER},
  userList: {type: DataTypes.STRING},
  bunkerAge: {type: DataTypes.STRING},
  population: {type: DataTypes.STRING},
  endOfTime: {type: DataTypes.DATE},
  voitingStatus: {type: DataTypes.TINYINT},
  soundId: {type: DataTypes.INTEGER},
  timerEndDate: {type: DataTypes.DATE},
  nowDateTimer: {type: DataTypes.DATE},
  timerPauseSeconds: {type: DataTypes.INTEGER}
})

const RoomSession = sequelize.define('roomSession', {
  id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
  userId: {type: DataTypes.INTEGER},
  isPlayer: {type: DataTypes.TINYINT, defaultValue: 1},
  usePack: {type: DataTypes.STRING},
  sex: {type: DataTypes.STRING(500)},
  body: {type: DataTypes.STRING(500)},
  height: {type: DataTypes.STRING(500)},
  trait: {type: DataTypes.STRING(500)},
  profession: {type: DataTypes.STRING(500)},
  health: {type: DataTypes.STRING(500)},
  hobbies: {type: DataTypes.STRING(500)},
  phobia: {type: DataTypes.STRING(500)},
  inventory: {type: DataTypes.STRING(500)},
  backpack: {type: DataTypes.STRING(500)},
  addInfo: {type: DataTypes.STRING(500)},
  spec1: {type: DataTypes.STRING(500)},
  spec2: {type: DataTypes.STRING(500)},
  isMVPRefresh: {type: DataTypes.TINYINT},
  isAlive: {type: DataTypes.TINYINT, defaultValue: 1},
  votedFor: {type: DataTypes.INTEGER}
})

const ChartPlayer = sequelize.define('chartPlayer', {
  id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
  name: {type: DataTypes.STRING},
  text: {type: DataTypes.STRING(1500)},
  dontAddLevelInfo: {type: DataTypes.TINYINT, defaultValue: 0}
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
  text: {type: DataTypes.STRING(1500)},
  countMin: {type: DataTypes.INTEGER}
})

const ChartPack = sequelize.define('chartPack', {
  id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
  namePack: {type: DataTypes.STRING},
  text: {type: DataTypes.STRING},
  isHidden: {type: DataTypes.TINYINT, defaultValue: 1},
  status: {type: DataTypes.TINYINT, defaultValue: 0},
  ageRestriction: {type: DataTypes.TINYINT, defaultValue: 0}
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

const Logi = sequelize.define('logi', {
  id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
  idRoom: {type: DataTypes.STRING},
  funcName: {type: DataTypes.STRING},
  lastVar: {type: DataTypes.STRING(15000)},
  text: {type: DataTypes.STRING(500)},
  step: {type: DataTypes.INTEGER},
  userId: {type: DataTypes.INTEGER},
  isBack: {type: DataTypes.TINYINT, defaultValue: 0}
})

const CatastropheImage = sequelize.define('catastropheImage', {
  id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
  imageName: {type: DataTypes.STRING},
  catastropheId: {type: DataTypes.INTEGER},
  favourite: {type: DataTypes.TINYINT, defaultValue: 0},
})

const CatastropheSounds = sequelize.define('catastropheSounds', {
  id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
  soundName: {type: DataTypes.STRING},
  catastropheId: {type: DataTypes.INTEGER}
})
const EmailNotification = sequelize.define('emailNotification', {
  id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
  type: {type: DataTypes.STRING},
  userId: {type: DataTypes.INTEGER},
  timerEndDate: {type: DataTypes.DATE}
})

const OtherTexts = sequelize.define('otherTexts', {
  id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
  name: {type: DataTypes.STRING, allowNull: false},
  text: {type: DataTypes.STRING(15000), allowNull: false},
})

const gameKey = sequelize.define('gameKey', {
  id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
  key: {type: DataTypes.STRING(1000)},
  period: {type: DataTypes.INTEGER},
  type: {type: DataTypes.STRING()},
  isActivate: {type: DataTypes.TINYINT, defaultValue: 0}
})

const prices = sequelize.define('prices', {
  id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
  price: {type: DataTypes.STRING()},
  oldPrice: {type: DataTypes.STRING()},
  levelAccess: {type: DataTypes.STRING()},
  months: {type: DataTypes.INTEGER},
  link: {type: DataTypes.STRING()},
})

const updateInfo = sequelize.define('updateInfo', {
  id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
  title: {type: DataTypes.STRING(255)},
  text: {type: DataTypes.STRING(10000)},
  dateText: {type: DataTypes.STRING(255)},
})

const staticPages = sequelize.define('staticPages', {
  id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
  fileName: {type: DataTypes.STRING(255), allowNull: false},
  link: {type: DataTypes.STRING(255), allowNull: false},
  title: {type: DataTypes.STRING(255), allowNull: false},
  pageNum: {type: DataTypes.INTEGER, allowNull: false},
  isHide: {type: DataTypes.TINYINT, defaultValue: 0},
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
  staticPages,
  GameRooms,
  updateInfo,
  RoomSession,
  ChartBunker,
  ChartPack,
  ChartPlayer,
  CatastropheSounds,
  BunkerChartPack,
  PlayerChartPack,
  ProfessionChartPack,
  Profession,
  UserUsePack,
  SystemSettings,
  CatastropheImage,
  Logi,
  OtherTexts,
  gameKey,
  prices,
  EmailNotification
}