const nodemailer = require('nodemailer');
const Log = require('../log');

class EmailNotifier {
  constructor(name, { from, to, smtp_host: smptHost, smtp_port: smptPort = 25, smtp_auth: smptAuth }) {
    this.name = name;
    this.from = from;
    this.to = Array.isArray(to) ? to.join(', ') : to;
    this.transporter = nodemailer.createTransport({
      host: smptHost,
      port: smptPort,
      auth: smptAuth
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
}

module.exports = EmailNotifier;
