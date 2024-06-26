const nodemailer = require('nodemailer')

class MailService {

  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'yandex',
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
      }
    })
  }

  async sendactivationMail(to, link) {
    await this.transporter.sendMail({
      from: process.env.SMTP_USER,
      to,
      subject: 'Активация аккаунта на' + process.env.API_URL,
      text: '',
      html:
        `
                    <div>
                        <h1> Для активации перейдите по ссылке</h1>
                        <a href="${link}">${link}</a>
                    </div>
                `

    })
  }

  async sendResetPasswordMail(to, link) {
    await this.transporter.sendMail({
      from: process.env.SMTP_USER,
      to,
      subject: 'Восстановление пароля' + process.env.API_URL,
      text: '',
      html:
        `
                        <div>
                            <h1> Для восстановления пароля перейдите по ссылке</h1>
                            <a href="${link}">${link}</a>
                        </div>
                    `

    })
  }

  async sendResetEmailMail(to, link) {
    await this.transporter.sendMail({
      from: process.env.SMTP_USER,
      to,
      subject: 'Смена email' + process.env.API_URL,
      text: '',
      html:
        `
                            <div>
                                <h1> Для смены email перейдите по ссылке</h1>
                                <a href="${link}">${link}</a>
                            </div>
                        `

    })
  }
  
  async sendRateLimited(to) {
      await this.transporter.sendMail({
        from: process.env.SMTP_USER,
        to,
        subject: 'Угроза безопасности аккаунт' + process.env.API_URL,
        text: '',
        html:
          `
                              <div>
                                  <h1> Кто-то пытается войти в ваш аккаунт</h1>
                                  
                              </div>
                          `
  
      })
    }
}

module.exports = new MailService()