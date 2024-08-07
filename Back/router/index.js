const Router = require('express').Router;
const userController = require('../controller/user-controller')
const adminController = require('../controller/admin-controller')
const router = new Router()
const {body} = require('express-validator')
const bodys = require('express-validator')
const authMiddleware = require('../middlewares/auth-meddleware')
const adminMiddleware = require('../middlewares/admin-middleware')
const vipMvpAdminMiddleware = require('../middlewares/vipMvpAdmin-middleware')
const blockedUserCheck = require('../middlewares/isUserBlocked-middleware')
const createGameMiddleware = require('../middlewares/createGame-middleware')
const priorityUserMiddleware = require('../middlewares/priorityUser-middleware')
const updateUserMiddleware = require('../middlewares/updateUser-middleware')
const path = require('path')
const {rateLimit} = require('express-rate-limit')
const ApiError = require('../exceptions/api-error')
const mailService = require('../service/mail-service')
const UserModel = require('../model/models')


const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  keyGenerator: (req, res) => req.body['login'],
  message: async (req, res) => {
    try {
      const track = req.body['login']
      console.log("123123123123123", track)
      let user = null
      if (emailTest(track)) {

        user = await UserModel.User.findOne({where: {email: track}})
        
      }
      else {
        user = await UserModel.User.findOne({where: {nickname: track}})
        
        
      }
      console.log("22", user)
      if (user) {
        console.log("22222222", user.email)
        let emailNotification = await UserModel.EmailNotification.findOne({where:{userId:user.id,type:'bruet'}})
        let nextDate = new Date(new Date().setUTCHours(0, 0, 0, 0) + 7 * 24 * 60 * 60 * 1000)
        let isSend = true
        let today =  new Date(new Date().setUTCHours(0, 0, 0, 0) )
        if(emailNotification){
          if(emailNotification.timerEndDate < today){
            console.log('Можно отправлять')
            emailNotification.timerEndDate = nextDate
            await emailNotification.save()
          }else{
            console.log('Нельзя отправлять')
            isSend = false
          }
        }else{
          console.log('Новая записььв')
          await UserModel.EmailNotification.create({type:'bruet',userId:user.id,timerEndDate:nextDate})
        }
        if(isSend) {
          mailService.sendRateLimited(user.email)
        }
      }
      
      throw ApiError.BadRerquest(`Привышен лимит запросов`, [{input: 'login', type: 'Rate limited'}])
    } catch(e) {
      console.log(e)
    }
  },
  legacyHeaders: false
})

const limiterPack = rateLimit({
  windowMs: 1 * 30 * 1000,
  limit: 6,
  keyGenerator: (req, res) => req.body['id'],
  message: async (req, res) => {
    try {

      throw ApiError.BadRerquest(`Привышен лимит запросов`, [{input: 'id', type: 'Rate limited'}])
    } catch(e) {
      console.log(e)
    }
  },
  legacyHeaders: false
})


router.post('/registration',
  body('nickname').isLength({min: 3, max: 15}),
  body('email').isEmail(),
  body('password').isLength({min: 5, max: 16}),
  userController.registration);
router.post('/login', limiter,
  body('login').notEmpty(),
  userController.login);
router.post('/logout', userController.logout);
router.post('/blockUser=:id', adminMiddleware('admin'), adminController.banUser);
router.get('/activate/:link', blockedUserCheck, userController.activate);
router.post('/refresh', blockedUserCheck, userController.refresh);
router.post('/updateUser=:id', blockedUserCheck, updateUserMiddleware('admin'), userController.updateUser);
router.post('/updateNickname=:id', blockedUserCheck, vipMvpAdminMiddleware('admin'), userController.updateNickname);
router.get('/users', authMiddleware, userController.getUsers);
router.get('/user=:id', blockedUserCheck, userController.getUser);
router.get('/loginDiscord', userController.loginDiscord);
router.get('/callback', userController.callback);
router.post('/resetPasswordProfile', blockedUserCheck, authMiddleware, userController.resetPasswordProfile);                                         //Только через профиль. Принимает refreshToken
router.post('/resetPassword', blockedUserCheck, body('email').isEmail(), userController.resetPassword);                                                       //Забыл пароль. Body - Email
router.post('/newPassword', blockedUserCheck, body('password').isLength({min: 5, max: 16}), userController.newPassword);  //Принимает данные от перехода по ссылке. Query paramerters
router.get('/resetUser/:link', blockedUserCheck, userController.resetUser);                                                          //Ссылка которая будет приходить на почту. Редирект
router.post('/uploadAvatar=:id', blockedUserCheck, updateUserMiddleware('admin'), body('files').custom((value, req) => {
  console.log(req)
  
  let extension = (path.extname(req.req.files.file.name)).toLowerCase();
  let correctExtensions = ['.jpg', '.jpeg', '.png', '.gif']
  
  return correctExtensions.toString().includes(extension);
}), userController.uploadAvatar);
router.post('/deleteAvatar=:id', blockedUserCheck, updateUserMiddleware('admin'), userController.deleteAvatar);
router.post('/resetEmail', blockedUserCheck, authMiddleware, userController.resetEmail); // cookie
router.post('/newEmail', blockedUserCheck, body('email').isEmail(), userController.newEmail);  //body parameters and email

router.post('/generateRoomId',createGameMiddleware, blockedUserCheck, userController.generateRoomId);
router.post('/userGames', blockedUserCheck, userController.userGames);
//router.post('/allGames', userController.allUsersGames);
router.post('/allPacks', blockedUserCheck, userController.allPacks);
router.post('/changePack', blockedUserCheck, priorityUserMiddleware('default'), limiterPack, userController.changePack);
router.get('/test', userController.test);
router.get('/staticPage/:id', userController.loadStaticPage);
router.get('/otherText/:id', userController.loadOtherText);
router.get('/wikiList', userController.loadWikiList);
router.post('/generateKeys', adminMiddleware('admin'), adminController.generateKeys);
router.post('/activateKey', authMiddleware, userController.activateKey);
router.get('/pricesInfo', userController.getPriceInfo);
router.get('/getHomeImageName', userController.getHomeImageName);
router.get('/getBaseProfession', userController.getBaseProfession);
router.get('/getUpdateInfo', userController.getUpdateInfo);


//router.get('/loginVK',userController.loginVK);
//router.get('/callbackVK',userController.callbackVK);

module.exports = router

function emailTest(value) {
  console.log(value)
  return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,8})+$/.test(value);
}