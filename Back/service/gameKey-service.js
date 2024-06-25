const bcrypt = require('bcrypt')
const uuid = require('uuid')
const sequelize = require('../db')
const mailService = require('./mail-service')
const UserModel = require('../model/models')
const tokenService = require('./token-service')
const UserDto = require('../dtos/user-dto')
const UserDtoDiscord = require('../dtos/user-dtoDiscord')
const ApiError = require('../exceptions/api-error')
const axios = require('axios')
const fs = require('fs')
require('dotenv').config()
const path = require('path')
const {Op} = require('sequelize')
let mer = require("mersennetwister")
const  crypto = require('crypto')
const buffer = require("buffer");



class gameKey {

    constructor() {
        this.crKey = 'xB4bfGriY3eauHJnHpbtGTwf4CTY+KhP8i19zBhBRzQ='
        this.iv = 'vDG22SHsTGenEkBRTIP6bQ=='
        this.algorithm = 'aes-256-cbc'
    }


    async generateKey(title,status,period,count){

        let newTitle = path.join('../gameKey/',`${title}.txt`)
         fs.open(newTitle, 'w',(err)=>{})
        for(let i=0;i<count;i++){
            let isNewKey = false
            let encKey
            let writtenKey
            while(!isNewKey) {
                let newKey = ([...Array(4)].map(() => crypto.randomBytes(2).toString('hex')).join('-').toUpperCase())
                const cipher = crypto.createCipheriv(this.algorithm, Buffer.from(this.crKey.toString('utf8'), "base64"), Buffer.from(this.iv.toString('utf8'), "base64"));
                let encrypted = cipher.update(newKey, 'utf8', 'hex');
                encrypted += cipher.final('hex');
                let checkKey = await UserModel.gameKey.findOne({where:{key:encrypted}})
                if(!checkKey){
                    isNewKey=true
                    encKey = encrypted
                    writtenKey = newKey
                }

            }
           let newKeyDb = await UserModel.gameKey.create({key:encKey,period:period,type:status})
            console.log(newKeyDb.id)
            fs.appendFileSync(newTitle, `\n${writtenKey}`,(err)=>{})



        }
       // fs.close()
        console.log('Прошло успешно')

    }
    async activateKey(key,userId){
      //  let cryptKey = await bcrypt.hash(key, 3)
        const cipher = crypto.createCipheriv(this.algorithm, Buffer.from(this.crKey.toString('utf8'),"base64"),Buffer.from(this.iv.toString('utf8'),"base64"));
        let encrypted = cipher.update(key, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        let user = await UserModel.User.findOne({where:{id:userId}})
        let gameKey = await UserModel.gameKey.findOne({where:{key:encrypted}})
        if(gameKey){
            if(!gameKey.isActivated){
                await this.changeLevel(gameKey.type,gameKey.period,user)
                gameKey.isActivate = 1
                await gameKey.save()
                return {
                    endDate:user.endDate,
                    accsessLevel:gameKey.type
                }



            }else{
                //Ошибка, ключ уже активирован
            }

        }else{
            //Ошибка, такого ключа не существует
        }

    }
    async changeLevel(status,period,user){
        let updateDate = null
        let endDate = null
        if (period!==null) {
            endDate = new Date(new Date().setHours(0, 0, 0, 0) + period * 24 * 60 * 60 * 1000)
            if (period <= 30) {
                updateDate = endDate
            } else {
                updateDate = new Date(new Date().setHours(0, 0, 0, 0) + 30 * 24 * 60 * 60 * 1000)
            }
        }
        user.updateDate =updateDate
        user.endDate = endDate
        user.accsessLevel = status
        await user.save()




    }

    async getKeyId(key){
        const cipher = crypto.createCipheriv(this.algorithm, Buffer.from(this.crKey.toString('utf8'),"base64"),Buffer.from(this.iv.toString('utf8'),"base64"));
        let encrypted = cipher.update(key, 'utf8', 'hex');
        encrypted += cipher.final('hex');

        let gameKey = await UserModel.gameKey.findOne({where:{key:encrypted}})
        console.log(gameKey.id)
    }
    async updateSubscription(){
        let dateNow = new Date(new Date().setHours(0,0,0,0))
        let allUsers = await UserModel.User.findAll({where:{updateDate:dateNow}})
        if(allUsers){
            for(let user of allUsers){
                console.log(user.nickname,+user.updateDate===+user.endDate)
                if(+user.updateDate===+user.endDate){
                    await this.changeLevel('default',null,user)
                    console.log('default')
                }else {
                    let period = new Date(user.endDate - user.updateDate) / (1000 * 60 * 60 * 24)
                    await this.changeLevel(user.accsessLevel, period, user)
                    console.log(user.accsessLevel)
                    if(user.accsessLevel==='vip'){
                        // даем возможность еще раз сменить пароль
                    }
                }



            }
        }
    }

}
module.exports = new gameKey()