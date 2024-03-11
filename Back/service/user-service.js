const  bcrypt = require('bcrypt')
const uuid = require('uuid')
const mailService = require('./mail-service')
const UserModel = require('../model/models')
const tokenService = require('./token-service')
const UserDto = require('../dtos/user-dto')
const ApiError = require('../exceptions/api-error')

class UserService{
    async registration(email,password){
        const candidate = await UserModel.User.findOne({where:{email}})
        if (candidate){
            throw ApiError.BadRerquest('User has not done')
        }
        const hashPassword = await bcrypt.hash(password,3)
        const activationLink = uuid.v4()
        const user = await UserModel.User.create({email,password:hashPassword,activationLink})
        const userData = await UserModel.User.findOne({where:{email}})
        await mailService.sendactivationMail(email,`${process.env.API_URL }/api/activate/${activationLink}`)

        const userDto = new UserDto(user)
        const tokens = tokenService.generateTokens({...userDto})
        await  tokenService.saveToken(userDto.id,tokens.refreshToken)

        return{
            ...tokens,
            user:userDto
        }
    }
    async activate(activationLink){
        const user = await UserModel.User.findOne({where:{activationLink}})
        if(!user){
            throw  ApiError.BadRerquest('Error link')
        }
        user.isActivated = 1
        await user.save()
    }
    async login(email,password){
        const user = await UserModel.User.findOne({where:{email}})
        if (!user){
            throw ApiError.BadRerquest('User not search')
        }
        const isPassEquals = await bcrypt.compare(password,user.password)
        if (!isPassEquals){
            throw ApiError.BadRerquest('not password')
        }
        const userDto = new UserDto(user)
        const tokens = tokenService.generateTokens({...userDto})
        await  tokenService.saveToken(userDto.id,tokens.refreshToken)
        return{
                    ...tokens,
                    user:userDto
                }
    }
    async logout(refreshToken){
        const token = await tokenService.removeToken(refreshToken)
        return token

    }

}
module.exports = new UserService()