const { IncomingWebhook } = require('@slack/webhook');
const Log = require('../log');

class SlackNotifier {
  constructor(name, { webhook_url: webhookUrl }) {
    this.webhookUrl = webhookUrl;
    this.webhook = new IncomingWebhook(this.webhookUrl);

    this.log = new Log();
    this.log.pushNamespace('slack');
    this.log.pushNamespace(name);
  }

  async notify({ subject, body }) {
    this.log.info('Sending slack message');

    await this.webhook.send({
      blocks: [{
        type: 'header',
        text: {
          type: 'plain_text',
          text: subject,
          emoji: true
        }
      }, {
        type: 'divider'
      }, {
        type: 'section',
        text: {
          type: 'plain_text',
          text: body,
          emoji: true
        }
      }]
    });
    this.log.info('Message sent');
  }
}

module.exports = SlackNotifier;
