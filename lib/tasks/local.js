const util = require('util');
const exec = util.promisify(require('child_process').exec);

class LocalTask {
  constructor(name, { command }) {
    this.name = name;
    this.command = command;
  }

  async execute(log) {
    log.pushNamespace(this.name);
    log.info('Started task');
    try {
      const { stdout, stderr } = await exec(this.command);
      const output = stdout + stderr;
      log.info(`Task done - output:\n${output.trim()}`);
    } catch (err) {
      log.error('Task failed', err);
      throw err;
    } finally {
      log.popNamespace();
    }

  }
}

module.exports = LocalTask;
