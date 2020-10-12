/* eslint-disable camelcase */
const { CronJob } = require('cron');
const Hashids = require('hashids/cjs');
const stripAnsi = require('strip-ansi');
const Log = require('./log');
const util = require('./util');

const hashids = new Hashids();

class Job {

  constructor(name, { schedule, timezone, run_on_init = false, enabled = true, tasks, on_error }, taskInstances, notifierInstances) {

    this.name = name;
    this.enabled = enabled;
    this.runOnInit = run_on_init;

    this.tasks = [];
    tasks.forEach((t) => {
      this.tasks.push(taskInstances[t]);
    });

    this.errorNotifiers = [];
    if (on_error) {
      on_error.forEach((n) => {
        this.errorNotifiers.push(notifierInstances[n]);
      });
    }

    const opt = {
      cronTime: schedule,
      onTick: () => this.run()
    };

    if (timezone) {
      opt.timeZone = timezone;
    }

    this.job = new CronJob(opt);
    this.lastRunTime = 0;
    this.lastStatus = null;
  }

  async run() {
    this.lastRunTime = Date.now();

    const log = new Log();
    log.pushNamespace(`${this.name} ${hashids.encode(Date.now())}`);

    try {
      log.info('Job started');
      for (const task of this.tasks) {
        await task.execute(log);
      }
      log.info('Job done');
      this.lastStatus = 'ok';
      return true;
    } catch (err) {
      log.error('Job failed', err);
      this.lastStatus = 'fail';
      await this.notifyError(util.formatError(err));
      return false;
    }

  }

  async notifyError(body) {
    const cleanBody = stripAnsi(body);
    return Promise.all(
      this.errorNotifiers.map(eN => eN.notify({
        subject: `Job ${this.name} failed`,
        body: cleanBody
      }))
    );
  }

  async start() {
    if (!this.enabled) return;
    if (this.runOnInit) {
      await this.run();
    }
    this.job.start();
  }

  stop() {
    this.job.stop();
  }

  serialize() {
    return {
      name: this.name,
      schedule: this.job.schedule,
      tasks: this.tasks.map(t => t.name),
      errorNotifiers: this.errorNotifiers.map(n => n.name),
      lastRunTime: this.lastRunTime,
      lastStatus: this.lastStatus
    };
  }
}

module.exports = Job;
