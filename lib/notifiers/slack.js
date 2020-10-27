const fetch = require('node-fetch');
const Log = require('../log');

class SlackNotifier {
  constructor(name, { webhook_url: webhookURL }) {
    this.webhookURL = webhookURL;
    this.requestOptions = {
      method: 'POST',
      header: {
        'Content-Type': 'application/json'
      }
    };

    this.markdownMessage = {
      type: 'section',
      text: {
        type: 'mrkdwn'
      }
    };

    this.log = new Log();
    this.log.pushNamespace('slack');
    this.log.pushNamespace(name);
  }

  getMarkdownSection(text, isBold = false) {
    return {
      ...this.markdownMessage,
      text: {
        ...this.markdownMessage.text,
        text: isBold ? `*${text}*` : text
      }
    };
  }

  async sendSlackMessage({ subject, body }) {
    try {
      const payload = JSON.stringify({
        username: 'Ckron Scheduler',
        icon_emoji: ':bell:',
        blocks: [
          this.getMarkdownSection(subject, true),
          this.getMarkdownSection(body)
        ]
      });

      const options = {
        ...this.requestOptions,
        body: payload
      };

      await fetch(this.webhookURL, options);
    } catch (ex) {
      this.log.error(ex.stack);
    }
  }

  async notify({ subject, body }) {
    this.log.info('Sending slack message');

    await this.sendSlackMessage({ subject, body });
    this.log.info('Message sent');
  }
}

module.exports = SlackNotifier;
