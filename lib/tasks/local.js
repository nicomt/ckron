import { promisify } from 'util';
import { exec as _exec } from 'child_process';

const exec = promisify(_exec);

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

export default LocalTask;
