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


router.post('/registration',
  body('nickname').isLength({min: 3, max: 15}),
  body('email').isEmail(),
  body('password').isLength({min: 5, max: 16}),
  userController.registration);
router.post('/login',
  body('login').notEmpty(),
  userController.login);
router.post('/logout', userController.logout);
router.post('/blockUser=:id', adminMiddleware('admin'), adminController.banUser);
router.get('/activate/:link', userController.activate);
router.post('/refresh', userController.refresh);
router.post('/updateUser=:id', updateUserMiddleware('admin'), userController.updateUser);
router.post('/updateNickname=:id',vipMvpAdminMiddleware('admin'), userController.updateNickname);
router.get('/users', authMiddleware, userController.getUsers);
router.get('/user=:id', userController.getUser);
router.get('/loginDiscord', userController.loginDiscord);
router.get('/callback', userController.callback);
router.post('/uploadAvatar=:id',updateUserMiddleware('admin'), body('files').custom((value, req) => {
  console.log(req)
  
  let extension = (path.extname(req.req.files.file.name)).toLowerCase();
  let correctExtensions = ['.jpg','.jpeg','.png','.gif']
  
  return correctExtensions.toString().includes(extension);
}), userController.uploadAvatar);
router.post('/deleteAvatar=:id',updateUserMiddleware('admin'), userController.deleteAvatar);


//router.get('/loginVK',userController.loginVK);
//router.get('/callbackVK',userController.callbackVK);

module.exports = router
