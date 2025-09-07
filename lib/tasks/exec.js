import { finished } from 'stream';
import Docker from 'dockerode';
import * as util from '../util.js';

class ExecTask {

  constructor(name, { container, working_dir: workingDir, environment, command, user, timeout }) {
    this.name = name;
    this.container = container;
    this.command = util.parseCommand(command);
    this.user = user;
    this.workingDir = workingDir;
    this.timeout = timeout;
    if (environment) this.environment = util.parseEnvironment(environment);
    this.docker = new Docker();
  }

  async execute(log) {
    log.pushNamespace(this.name);
    log.info('Started task');

    let timeoutId;
    let exec;

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

      exec = await container.exec(opt);
      const bufferStream = util.buildOutputBufferStream();

      // Set up timeout if specified
      let timeoutPromise;
      if (this.timeout) {
        timeoutPromise = new Promise((_, reject) => {
          timeoutId = setTimeout(() => {
            reject(new Error(`Task timed out after ${this.timeout} seconds`));
          }, this.timeout * 1000);
        });
      }

      const outputStream = await exec.start();

      const execPromise = new Promise((res, rej) => {
        finished(outputStream, (err) => {
          if (err) rej(err);
          res();
        });
        container.modem.demuxStream(outputStream, bufferStream.stream, bufferStream.stream);
      });

      // Wait for execution or timeout
      if (this.timeout) {
        try {
          await Promise.race([execPromise, timeoutPromise]);
        } catch (err) {
          if (err.message.includes('timed out')) {
            // Try to kill the exec process
            try {
              await exec.inspect().then(async (info) => {
                if (info.Running) {
                  // Docker doesn't provide a direct way to kill exec,
                  // so we'll let the timeout error propagate
                }
              });
            } catch (killErr) {
              // Ignore errors when trying to get exec info
            }
          }
          throw err;
        }
      } else {
        await execPromise;
      }

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
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      log.popNamespace();
    }
  }
}

export default ExecTask;
