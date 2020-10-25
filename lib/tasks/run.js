/* eslint-disable camelcase */
const Docker = require('dockerode');
const util = require('../util');

class RunTask {
  constructor(name, { image, command, user, working_dir, volumes, environment, network, pull = 'missing', auto_remove = true }) {
    this.name = name;
    this.image = image;
    this.command = command ? util.parseCommand(command) : [];
    this.user = user;
    this.workingDir = working_dir;
    this.volumes = volumes;
    if (environment) this.environment = util.parseEnvironment(environment);
    this.network = network;
    this.pull = pull;
    this.autoRemove = auto_remove;
    this.docker = new Docker();
    this.lastPull = 0;
  }

  async imageExists(image) {
    const localImages = await this.docker.listImages({
      filters: { reference: [image] }
    });

    return localImages.length > 0;
  }
  async checkOrPull(image, log) {
    if (this.pull === 'never') return;

    if (this.pull === 'always' || !(await this.imageExists(image))) {
      log.info(`Pulling ${image} from registry`);
      const stream = await this.docker.pull(image);
      await new Promise((res, rej) => {
        this.docker.modem.followProgress(stream, (err) => {
          if (err) return rej(err);
          return res();
        });
      });
      this.lastPull = Date.now();
    }
  }

  async execute(log) {
    log.pushNamespace(this.name);
    log.info('Started task');
    try {

      await this.checkOrPull(this.image, log);
      const opt = {
        User: this.user,
        WorkingDir: this.workingDir,
        HostConfig: {
          AutoRemove: this.autoRemove
        }
      };

      if (this.environment) opt.Env = this.environment;
      if (this.volumes) opt.HostConfig.Binds = this.volumes;

      const bufferStream = util.buildOutputBufferStream();
      const [res, container] = await this.docker.run(this.image, this.command, bufferStream.stream, opt);

      const { Error: error, StatusCode: exitCode } = res;
      const output = bufferStream.buffer.trim();
      const containerId = container.id;

      if (error) throw error;
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

module.exports = RunTask;
