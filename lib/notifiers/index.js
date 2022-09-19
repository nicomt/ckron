import EmailNotifier from './email.js';
import SlackNotifier from './slack.js';

export default {
  email: EmailNotifier,
  slack: SlackNotifier,
};
