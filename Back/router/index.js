const Router = require('express').Router;
const userController = require('../controller/user-controller')
const adminController = require('../controller/admin-controller')
const router = new Router()
const {body} = require('express-validator')
const bodys = require('express-validator')
const authMiddleware = require('../middlewares/auth-meddleware')
const adminMiddleware = require('../middlewares/admin-middleware')
const vipMvpAdminMiddleware = require('../middlewares/vipMvpAdmin-middleware')
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
              console.log("22",user)
      if (user) {
        console.log("22222222", user.email)
        mailService.sendRateLimited(user.email)
      }
      
      throw ApiError.BadRerquest(`Привышен лимит запросов`, [{input: 'login', type: 'Rate limited'}])
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
router.get('/activate/:link', userController.activate);
router.post('/refresh', userController.refresh);
router.post('/updateUser=:id', updateUserMiddleware('admin'), userController.updateUser);
router.post('/updateNickname=:id', vipMvpAdminMiddleware('admin'), userController.updateNickname);
router.get('/users', authMiddleware, userController.getUsers);
router.get('/user=:id', userController.getUser);
router.get('/loginDiscord', userController.loginDiscord);
router.get('/callback', userController.callback);
router.post('/resetPasswordProfile', authMiddleware, userController.resetPasswordProfile);                                         //Только через профиль. Принимает refreshToken
router.post('/resetPassword', body('email').isEmail(), userController.resetPassword);                                                       //Забыл пароль. Body - Email
router.post('/newPassword', body('password').isLength({min: 5, max: 16}), userController.newPassword);  //Принимает данные от перехода по ссылке. Query paramerters
router.get('/resetUser/:link', userController.resetUser);                                                          //Ссылка которая будет приходить на почту. Редирект
router.post('/uploadAvatar=:id', updateUserMiddleware('admin'), body('files').custom((value, req) => {
  console.log(req)
  
  let extension = (path.extname(req.req.files.file.name)).toLowerCase();
  let correctExtensions = ['.jpg', '.jpeg', '.png', '.gif']
  
  return correctExtensions.toString().includes(extension);
}), userController.uploadAvatar);
router.post('/deleteAvatar=:id', updateUserMiddleware('admin'), userController.deleteAvatar);
router.post('/resetEmail', authMiddleware, userController.resetEmail); // cookie
router.post('/newEmail', body('email').isEmail(), userController.newEmail);  //body parameters and email

router.post('/generateRoomId', userController.generateRoomId);
router.post('/userGames', userController.userGames);
router.post('/allGames', userController.allUsersGames);

//router.get('/loginVK',userController.loginVK);
//router.get('/callbackVK',userController.callbackVK);

module.exports = router

function emailTest(value) {
  console.log(value)
  return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,8})+$/.test(value);
}