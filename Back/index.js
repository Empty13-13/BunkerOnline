require('dotenv').config()
const express = require('express')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const {createServer} = require("http");
const sequelize = require('./db')
const router = require('./router/index')
const fileUpload = require("express-fileupload")
const errorMiddleware = require('./middlewares/error-middleware')
const {rateLimit} = require('express-rate-limit')
const {Server} = require("socket.io");
const cron = require("node-cron")
let mer = require("mersennetwister")
const bcrypt = require('bcrypt')
const  crypto = require('crypto')
const buffer = require("buffer");
const path = require('path')
const fs = require('fs')
const gameKey = require('./service/gameKey-service')
const userService = require('./service/user-service')
const ioUserService = require('./service/io-user-service')
const UserModel = require('./model/models')


const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 1,
  message: 'Rate limiter'
})

const app = express()
const http = createServer(app)
const io = new Server(http, {
  cors: {
    origin: `${process.env.FRONT_API}`
  },
  path: '/socket/'
});
require('./io/admin-io')(io)
require('./io/host-io')(io)
require('./io/users-io')(io)
require('./io/auth-io')(io)


// io.on('connection', (socket) => {
//   console.log(`${socket.id} user connected`)
//
//   socket.on('createRoom', (idRoom, idUser) => {
//     let isJoined = false
//     console.log(idRoom, idUser)
//
//     for (const room of io.sockets.adapter.rooms) {
//       if (room[0]===idRoom) {
//         socket.join(idRoom)
//         isJoined = true
//         break
//       }
//     }
//     if (!isJoined) {
//       socket.join(idRoom)
//     }
//
//     console.log(io.sockets.adapter.rooms)
//   })
//
//   socket.on('getAllData',(idRoom,idUser) => {
//     if(!idUser) {
//       //Передаем все данные, кроме личных
//     } else {
//       //Передаем все данные, ещё при этом добавляем туда инфу юзера
//     }
//   })

// socket.on('openCard', (idRoom,idUser) => {
//   io.in('idRoom').emit('updateUserData',data)
// })

//})

const PORT = process.env.PORT || 5000;

// const corsOptions ={
//   origin: 'http://localhost:5173/',
// }

app.use(fileUpload({}))
app.use(express.json());
app.use(cookieParser());
app.use(cors());
app.use(express.static('static'))
app.use('/api', router);
app.use('/api/login', limiter)
app.use(errorMiddleware);


const start = async () => {
  try {
    await sequelize.authenticate()
    await sequelize.sync()
    http.listen(PORT, () => console.log(`Server started on PORT = ${PORT}`))
        //await gameKey.generateKey('Новые ключи','vip',30,40)
   //let s = await gameKey.activateKey('C509-3D69-929D-2864',1)
   // await  gameKey.updateSubscription()
   // await gameKey.getKeyId('C509-3D69-929D-2864')
    // console.log(s.endDate)
        // await ioUserService.testFunc(io)
  } catch(e) {
    console.log(e);
  }
}
start()

  cron.schedule('58 23 * * *', async () => {
   console.log('Запущена обновление подписки');
   await  gameKey.updateSubscription()
  })

    // cron.schedule("*/1000000 * * * * *", async function() {
 //  await userService.getPrice()
//     let user = await UserModel.User.findOne({where: {id: 6}})
//     console.log(user.accsessLevel)
//     let dateNow = new Date(new Date().setUTCHours(0, 0, 0, 0))
//     console.log(dateNow)
//     let dateNow2 = new Date(new Date().setUTCHours(0, 0, 0, 0)+5*24*60*60*1000)
//     console.log(user.updateDate)
//     console.log(new Date(user.endDate-dateNow)/ (1000 * 60 * 60 * 24))
//    //  let newTitle = path.join('../gameKey/','lol2.txt')
//    //   fs.open(newTitle, 'w' ,(err)=>{})
//      //   if(err) throw err;
//      //   console.log('File created');
//      // })
//   //    let mr = new mer()
//   //  //  let cryptKey = await bcrypt.hash('$2b$04$4VuaUHebHuTRjOFKc8Zxgu3uzeKdJa0elIECUl0/ycsiEHUwFyGqu', 3)
//   //    let key1 = 'XXXX-XXXX-XXXX-XXXX'
//   //    const algorithm = 'aes-256-cbc'; // Алгоритм шифрования
//   //    //const key = (crypto.randomBytes(32)).toString('base64'); // Генерация случайного ключа (256 бит)
//   //   // const iv = crypto.randomBytes(16).toString('base64'); // Генерация случайного вектора инициализации (IV)
//   //    //let key ='<Buffer 30 2d 66 c2 6f 9e 7a 2d e1 2f 4c 75 34 ea 9d e5 49 9d 89 d1 d5 e2 ba 6d 71 38 cd 35 d0 92 53 c4>'
//   //   // let iv = '<Buffer 9f 3f 31 05 25 9e 1c f7 74 15 03 bc aa 09 2b f9>'
//   //    let key ='xB4bfGriY3eauHJnHpbtGTwf4CTY+KhP8i19zBhBRzQ='
//   //    let iv ='vDG22SHsTGenEkBRTIP6bQ=='
//   //    const cipher = crypto.createCipheriv(algorithm, Buffer.from(key.toString('utf8'),"base64"),Buffer.from(iv.toString('utf8'),"base64"));
//   //    let encrypted = cipher.update(key1, 'utf8', 'hex');
//   //    encrypted += cipher.final('hex');
//   //
//   //
//   // //        //    let date = new Date(new Date().setHours(0,0,0,0)+30*24*60*60*1000)
//   // //  //   let date2 = new Date(new Date().setHours(0,0,0,0)+90*24*60*60*1000)
//   // // //   let result = new Date(date2-date)/ (1000 * 60 * 60 * 24)
//   //  console.log('Запущена обновление подписки');
//   //  await  gameKey.updateSubscription()
//
// });


module.exports = {io}

// export {io}