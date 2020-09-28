/* eslint-disable camelcase */
const { CronJob } = require('cron');
const Hashids = require('hashids/cjs');
const Log = require('./log');

const hashids = new Hashids();

class Job {

  constructor(name, { schedule, timezone, run_on_init = false, enabled = true, tasks, on_error }, taskInstances, notifierInstances) {

    this.name = name;
    this.enabled = enabled;

    this.tasks = [];
    tasks.forEach((t) => {
      this.tasks.push(taskInstances[t]);
    });

    this.error_notifiers = [];
    if (on_error) {
      on_error.forEach((n) => {
        this.error_notifiers.push(notifierInstances[n]);
      });
    }

    const opt = {
      cronTime: schedule,
      onTick: () => this.run()
    };

    if (timezone) {
      opt.timeZone = timezone;
    }
    if (this.enabled && run_on_init) {
      opt.runOnInit = run_on_init;
    }

    this.job = new CronJob(opt);
  }

  async run() {
    const log = new Log();
    log.pushNamespace(`${this.name} ${hashids.encode(Date.now())}`);

    try {
      log.info('Job started');
      for (const task of this.tasks) {
        await task.execute(log);
      }
      log.info('Job done');
    } catch (err) {
      log.error('Job failed', err);
      // TODO better error formatting
      await this.notifyError(err.toString());
    }

  }

  async notifyError(body) {
    return Promise.all(
      this.error_notifiers.map(eN => eN.notify({
        subject: `Job ${this.name} failed`,
        body
      }))
    );
  }

  start() {
    if (!this.enabled) return;
    this.job.start();
  }

  stop() {
    this.job.stop();
  }
}

module.exports = Job;
