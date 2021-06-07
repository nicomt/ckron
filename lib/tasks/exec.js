const { finished } = require('stream');
const Docker = require('dockerode');
const util = require('../util');

class ExecTask {

  constructor(name, { container, working_dir: workingDir, environment, command, user }) {
    this.name = name;
    this.container = container;
    this.command = util.parseCommand(command);
    this.user = user;
    this.workingDir = workingDir;
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
        AttachStdin: false,
        AttachStdout: true,
        AttachStderr: true
      };

      if (this.workingDir) opt.WorkingDir = this.workingDir;
      if (this.environment) opt.Env = this.environment;
      if (this.user) opt.User = this.user;

      const exec = await container.exec(opt);
      const bufferStream = util.buildOutputBufferStream();
      const outputStream = await exec.start();

      await new Promise((res, rej) => {
        finished(outputStream, (err) => {
          if (err) rej(err);
          res();
        });
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
