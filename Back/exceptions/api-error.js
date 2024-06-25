module.exports = class ApiError extends Error {
  status;
  errors;
  
  constructor(status, message, errors = []) {
    super(message)
    this.status = status
    this.errors = errors
    
  }
  
  static UnauthorizedError() {
    return new ApiError(401, 'Users not autorization')
  }
  
  static BlockedUser() {
    return new ApiError(469, 'User is blocked')
  }
  static keyExp(message) {
      return new ApiError(300, message)
    }
  
  static CapthaBlock() {
      return new ApiError(601, 'Ошибка прохождения каптчи. Пожалуйста, перезагрузите страницу и попробуйте снова')
    }
  
  static BadRerquest(message, errors = []) {
    return new ApiError(400, message, errors)
  }
  
  static BadRerquestUser(message, errors = []) {
    return new ApiError(404, message, errors)
  }
  
  static BlockUser() {
    return new ApiError(404, message, errors)
  }
  
}
