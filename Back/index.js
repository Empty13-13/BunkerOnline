require('dotenv').config()
const express = require('express')
const cors = require('cors')
const  cookieParser =require('cookie-parser')
const sequelize = require('./db')
const router = require('./router/index')
const fileUpload = require("express-fileupload")
const errorMiddleware = require('./middlewares/error-middleware')

const app = express()

const PORT = process.env.PORT || 5000;


app.use(fileUpload({}))
app.use(express.json());
app.use(cookieParser());
app.use(cors());
app.use(express.static('static'))
app.use('/api',router);
app.use(errorMiddleware);



const  start = async ()=> {

    try{
        await sequelize.authenticate()
        await sequelize.sync()
        app.listen(PORT,()=> console.log(`Server started on PORT = ${PORT}`))
    }catch (e) {
        console.log(e);
    }
}
start()