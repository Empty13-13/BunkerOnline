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
  } catch(e) {
    console.log(e);
  }
}
start()



module.exports = {io}

// export {io}