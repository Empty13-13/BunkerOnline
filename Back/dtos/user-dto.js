module.exports = class  UserDto{
    nickname;
    email;
    id;
    isActivated;
    

    constructor(model) {
        this.nickname = model.nickname
        this.email =model.email
        this.id = model.id
        this.isActivated = model.isActivated
    }
}