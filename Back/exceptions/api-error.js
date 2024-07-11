module.exports = class ApiError extends Error {
  status;
  errors;
  
  constructor(status, message, errors = []) {
    super(message)
    this.status = status
    this.errors = errors
    
  }
  
  static UnauthorizedError() {
    return new ApiError(401, 'Пользователь не авторизован')
  }
  
  static BlockedUser() {
    return new ApiError(469, 'Пользователь заблокирован')
  }
  static AccessDenie() {
    return new ApiError(400, 'У вас имеются 2 созданных игры. Закройте предыдущие комнаты перед созданием новой или зайдите в игру по приглашению')
  }
  static keyExp(message) {
      return new ApiError(300, message)
    }
  
  static CapthaBlock() {
      return new ApiError(601, 'Ошибка прохождения ReCaptcha. Пожалуйста, перезагрузите страницу и попробуйте снова')
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
