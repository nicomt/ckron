import betterAjvErrors from 'better-ajv-errors';
import taskTypes from './tasks/index.js';
import notifierTypes from './notifiers/index.js';
import Job from './job.js';
import loadValidator from './load-validator.js';
import CkronError from './error.js';
import { readConfigFile, parseYaml } from './util.js';


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

    const content = await readConfigFile(configFile);
    const config = parseYaml(content);

    if (!this.configValidator(config)) {
      const { errors } = this.configValidator;
      const message = betterAjvErrors(
        this.configValidator.schema,
        config,
        [errors[0]],
        { indent: 2 }
      );

      const err = new CkronError(message, 'SYNTAX_CONFIG');
      err.validationErrors = errors;
      err.validationSchema = this.configValidator.schema;
      err.validationData = config;
      throw err;
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
      throw new CkronError(`Invalid name ${name}`, 'INVALID_CONF_NAME');
    }
  }

  async addTask(name, task) {
    await this.init();
    Ckron._validateName(name);
    if (!this.taskValidator(task)) {
      const [err] = this.taskValidator.errors;
      throw new CkronError(`Task error: ${err.dataPath} ${err.message}`, 'SYNTAX_TASK');
    }
  }

  async addJob(name, job) {
    await this.init();
    Ckron._validateName(name);
    if (!this.jobValidator(job)) {
      const [err] = this.jobValidator.errors;
      throw new CkronError(`Job error: ${err.dataPath} ${err.message}`, 'SYNTAX_JOB');
    }
  }

  async addNotifier(name, notifier) {
    await this.init();
    Ckron._validateName(name);
    if (!this.notifierValidator(notifier)) {
      const [err] = this.notifierValidator.errors;
      throw new CkronError(`Notifier error: ${err.dataPath} ${err.message}`, 'SYNTAX_NOTIFIER');
    }
  }

  async runJob(name, notifyError = false) {
    await this.init();
    const job = this.jobs[name];
    if (!job) {
      throw new CkronError(`Job ${name} not found`, 'JOB_NOT_FOUND');
    }
    return job.run(notifyError);
  }

  start() {
    Object.values(this.jobs).forEach(j => j.start());
  }

  stop() {
    Object.values(this.jobs).forEach(j => j.stop());
  }
}

export default Ckron;
