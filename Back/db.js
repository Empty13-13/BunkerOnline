const {Sequelize} = require('sequelize')

module.exports = new Sequelize(
  process.env.DB_NAME, // Название бд
  process.env.DB_USER, // Имя пользователя
  process.env.DB_PASSWORD, // Пароль
  {
    dialect: 'mysql',
    host: process.env.DB_HOST,
    port: process.env.DB_PORT
  }
)