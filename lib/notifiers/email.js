/* eslint-disable camelcase */
const nodemailer = require('nodemailer');
const Log = require('../log');

class EmailNotifier {
  constructor(name, { from, to, smtp_host, smtp_port = 25, smtp_auth }) {
    this.name = name;
    this.from = from;
    this.to = Array.isArray(to) ? to.join(', ') : to;
    this.smtpHost = smtp_host;
    this.smtpPort = smtp_port;
    this.smtpAuth = smtp_auth;
    this.transporter = nodemailer.createTransport({
      host: this.smtpHost,
      port: this.smtpPort,
      auth: this.smtpAuth
    });
    this.log = new Log();
    this.log.pushNamespace('email');
    this.log.pushNamespace(this.name);
  }

  async notify({ subject, body }) {
    this.log.info('Sending email');

    const info = await this.transporter.sendMail({
      from: this.from,
      to: this.to,
      subject,
      text: body,
    });
    this.log.info(`Message sent: ${info.messageId}`);
  }

  serialize() {
    return {
      type: 'email',
      name: this.name,
      from: this.from,
      to: this.to,
      smtpHost: this.smtpHost,
      smtpPort: this.smtpPort,
      smtpAuth: this.smtpAuth
    };
  }
}

module.exports = EmailNotifier;
