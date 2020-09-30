const fs = require('fs').promises;
const yaml = require('js-yaml');
const taskTypes = require('./tasks');
const notifierTypes = require('./notifiers');
const Job = require('./job');
const loadValidator = require('./load-validator');

class Ckron {

  constructor() {
    this.tasks = {};
    this.jobs = {};
    this.notifiers = {};
    this.initialized = false;
  }

  async init() {
    if (this.initialized) return;
    this.taskValidator = await loadValidator('task');
    this.jobValidator = await loadValidator('job');
    this.notifierValidator = await loadValidator('notifier');
    this.configValidator = await loadValidator('config');
    this.initialized = true;
  }

  async loadConfig(configFile) {
    await this.init();

    this.tasks = {};
    this.jobs = {};
    this.notifiers = {};

    const config = yaml.safeLoad(await fs.readFile(configFile));

    if (!this.configValidator(config)){
      const [err] = this.configValidator.errors;
      throw new Error(`Config error: ${err.dataPath} ${err.message}`);
    }

    if (config.notifiers) {
      for (const [name, notifier] of Object.entries(config.notifiers)) {
        this.notifiers[name] = new notifierTypes[notifier.type](name, notifier);
      }
    }

    if (config.tasks) {
      for (const [name, task] of Object.entries(config.tasks)) {
        this.tasks[name] = new taskTypes[task.type](name, task);
      }
    }

    if (config.jobs) {
      for (const [name, job] of Object.entries(config.jobs)) {
        this.jobs[name] = new Job(name, job, this.tasks, this.notifiers);
      }
    }
  }

  static _validateName(name) {
    const valid = /^[a-zA-Z0-9._-]+$/.test(name);
    if (!valid) {
      throw new Error(`Invalid name ${name}`);
    }
  }

  async addTask(name, task) {
    await this.init();
    Ckron._validateName(name);
    if (!this.taskValidator(task)) {
      const [err] = this.taskValidator.errors;
      throw new Error(`Task error: ${err.dataPath} ${err.message}`);
    }
  }

  async addJob(name, job) {
    await this.init();
    Ckron._validateName(name);
    if (!this.jobValidator(job)) {
      const [err] = this.jobValidator.errors;
      throw new Error(`Job error: ${err.dataPath} ${err.message}`);
    }
  }

  async addNotifier(name, notifier) {
    await this.init();
    Ckron._validateName(name);
    if (!this.notifierValidator(notifier)) {
      const [err] = this.notifierValidator.errors;
      throw new Error(`Notifier error: ${err.dataPath} ${err.message}`);
    }
  }

  start() {
    Object.values(this.jobs).forEach(j => j.start());
  }

  stop() {
    Object.values(this.jobs).forEach(j => j.stop());
  }
}

module.exports = Ckron;
