/* eslint-disable camelcase */
const Docker = require('dockerode');
const util = require('../util');

class ExecTask {

  constructor(name, { container, working_dir, environment, command }) {
    this.name = name;
    this.container = container;
    this.command = util.parseCommand(command);
    this.workingDir = working_dir;
    if (environment) this.environment = util.parseEnvironment(environment);
    this.docker = new Docker();
  }

  async execute(log) {
    log.pushNamespace(this.name);
    log.info('Started task');

    try {
      const container = this.docker.getContainer(this.container);
      const opt = {
        Cmd: this.command,
        AttachStdout: true,
        AttachStderr: true,
        WorkingDir: this.workingDir,
        Env: this.environment
      };

      const exec = await container.exec(opt);
      const bufferStream = util.buildOutputBufferStream();
      const outputStream = await exec.start();

      await new Promise((res, rej) => {
        outputStream.on('error', rej);
        outputStream.on('end', res);
        container.modem.demuxStream(outputStream, bufferStream.stream, bufferStream.stream);
      });
      const { ExitCode: exitCode } = await exec.inspect();
      const output = bufferStream.buffer.trim();
      const containerId = container.id;


      if (exitCode !== 0) {
        throw new Error(`${this.name} exited with exit code: ${exitCode} - output:\n${output}`);
      }

      log.info(`Task done - output:\n${output}`);

      return { exitCode, output, containerId };
    } catch (err) {
      log.error('Task failed', err);
      throw err;
    } finally {
      log.popNamespace();
    }


  }
}

module.exports = ExecTask;
