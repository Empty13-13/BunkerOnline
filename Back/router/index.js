const Router = require('express').Router;
const userController = require('../controller/user-controller')
const router = new Router()
const {body} = require('express-validator')
const authMiddleware = require('../middlewares/auth-meddleware')
const updateUserMiddleware = require('../middlewares/updateUser-middleware')

router.post('/registration',
  body('nickname').isLength({min: 3, max: 15}),
  body('email').isEmail(),
  body('password').isLength({min: 5, max: 16}),
  userController.registration);
router.post('/login',
  body('login').notEmpty(),
  userController.login);
router.post('/logout', userController.logout);
router.get('/activate/:link', userController.activate);
router.post('/refresh', userController.refresh);
router.post('/updateUser=:id',updateUserMiddleware('Admin'), userController.updateUser);
router.get('/users',authMiddleware, userController.getUsers);
router.get('/user=:id', userController.getUser);
router.get('/loginDiscord',userController.loginDiscord);
router.get('/callback',userController.callback);

module.exports = router
