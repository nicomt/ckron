import EmailNotifier from './email.js';
import SlackNotifier from './slack.js';
import JobNotifier from './job.js';

export default {
  email: EmailNotifier,
  slack: SlackNotifier,
  job: JobNotifier,
};
