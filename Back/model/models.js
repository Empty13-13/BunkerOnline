const sequelize = require('../db')
const {DataType, DataTypes} = require('sequelize')

const User = sequelize.define('user',{
    id: {type: DataTypes.INTEGER, primaryKey:true,autoIncrement: true},
    email: {type: DataTypes.STRING,required:true},
    password: {type: DataTypes.STRING,required:true},
    isActivated: {type: DataTypes.TINYINT,default: 0},
    activationLink:{type: DataTypes.STRING,}
})

const Token = sequelize.define('token',{
    id: {type: DataTypes.INTEGER, primaryKey:true,autoIncrement: true},
    userId: {type: DataTypes.INTEGER},
    refreshToken:{type: DataTypes.STRING,required: true}
})
User.hasOne(Token)


module.exports={
    User,
    Token
}