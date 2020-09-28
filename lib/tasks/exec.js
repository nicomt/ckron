const Docker = require('dockerode');
const util = require('../util');

class ExecTask {

  constructor(name, { container, command }) {
    this.name = name;
    this.container = container;
    this.command = util.parseCommand(command);
    this.docker = new Docker();
  }

  async execute(log) {
    log.pushNamespace(this.name);
    log.info('Started task');

    try {
      const [containerInfo] = await this.docker.listContainers({
        filters: {
          name: [this.container]
        }
      });
      if (!containerInfo) {
        throw new Error(`Cannot find running container ${this.container}`);
      }

      const container = this.docker.getContainer(containerInfo.Id);
      const opt = {
        Cmd: this.command,
        AttachStdout: true,
        AttachStderr: true
      };
      const exec = await container.exec(opt);
      const bufferStream = util.buildBufferStream();
      const { output: outputStream } = await exec.start();

      await new Promise((res, rej) => {
        outputStream.on('error', rej);
        outputStream.on('end', res);
        container.modem.demuxStream(outputStream, bufferStream.stream, bufferStream.stream);
      });
      const { ExitCode: exitCode } = await exec.inspect();
      const output = bufferStream.buffer.trim();

      if (exitCode !== 0) {
        throw new Error(`${this.name} exited with exit code: ${exitCode} - output:\n${output}`);
      }

      log.info(`Task done - output:\n${output}`);
    } catch (err) {
      log.error('Task failed', err);
      throw err;
    } finally {
      log.popNamespace();
    }


  }
}

module.exports = ExecTask;
