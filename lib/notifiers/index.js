const EmailNotifier = require('./email');
const SlackNotifier = require('./slack');

module.exports = {
  email: EmailNotifier,
  slack: SlackNotifier
};
